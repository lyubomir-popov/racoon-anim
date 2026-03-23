import * as THREE from "../../three/build/three.module.js";
import {
  TAU,
  COMPOSITION_SIZE_PX,
  STAGE_BACKGROUND_COLOR,
  BACKGROUND_SPOKE_WIDTH_PX,
  MASCOT_VIEWBOX_SIZE,
  MASCOT_EYE_SPECS,
  MASCOT_NOSE_PATH_DATA,
  HALO_REFERENCE_OPACITY,
  HALO_REFERENCE_COLOR,
  DEFAULT_OUTPUT_PROFILE_KEY,
  DEFAULT_OUTPUT_PROFILE,
  LARGEST_OUTPUT_PROFILE,
  clamp,
  get_output_profile_metrics,
  lerp,
  smoothstep,
  radians,
  wrap_positive,
  compute_frontier_scale,
  hash_01
} from "./config-schema.js";
import { createCircleLayer, createSegmentLayer } from "./three-primitives.js";

const WORLD_BACKGROUND_ORDER = 10;
const WORLD_POINTS_ORDER = 20;
const HALO_REFERENCE_ORDER = 30;
const HALO_THIN_ORDER = 31;
const HALO_THICK_ORDER = 32;
const HALO_ECHO_ORDER = 33;
const DEBUG_BOUNDARY_ORDER = 90;
const DEBUG_MASK_ORDER = 91;
const MASCOT_FACE_ORDER = 40;
const MASCOT_NOSE_ORDER = 41;
const MASCOT_NOSE_CUTOUT_ORDER = 42;
const MASCOT_EYE_ORDER = 43;
const DEBUG_BOUNDARY_COLOR = "#ff4d6d";
const DEBUG_MASK_COLOR = "#22d3ee";
const DEBUG_MASK_SEGMENT_COUNT = 96;
const ECHO_PLUS_SIZE_PX = 9.6;
const ECHO_TEXT_BASE_FONT_SIZE_PX = 4;
const UBUNTU_RELEASE_LABELS = Object.freeze([
  "25.10",
  "25.04",
  "24.10",
  "24.04",
  "23.10",
  "23.04",
  "22.10",
  "22.04",
  "21.10",
  "21.04",
  "20.10",
  "20.04",
  "19.10",
  "19.04",
  "18.10",
  "18.04",
  "17.10",
  "17.04",
  "16.10",
  "16.04",
  "15.10",
  "15.04",
  "14.10",
  "14.04",
  "13.10",
  "13.04",
  "12.10",
  "12.04",
  "11.10",
  "11.04",
  "10.10",
  "10.04",
  "9.10",
  "9.04",
  "8.10",
  "8.04",
  "7.10",
  "7.04",
  "6.10",
  "6.06",
  "5.10",
  "5.04",
  "4.10"
]);

const MASCOT_NOSE_PATH = new Path2D(MASCOT_NOSE_PATH_DATA);
const MASCOT_TEXTURE_SCALE = Math.max(
  2,
  LARGEST_OUTPUT_PROFILE.width_px / DEFAULT_OUTPUT_PROFILE.width_px
);

function capacities_match(current_capacities, next_capacities) {
  if (!current_capacities) {
    return false;
  }

  return Object.keys(next_capacities).every(
    (key) => current_capacities[key] === next_capacities[key]
  );
}

function create_nose_texture() {
  const nose_canvas_size_px = Math.ceil(MASCOT_VIEWBOX_SIZE * MASCOT_TEXTURE_SCALE);
  const nose_canvas = document.createElement("canvas");
  nose_canvas.width = nose_canvas_size_px;
  nose_canvas.height = nose_canvas_size_px;
  const nose_context = nose_canvas.getContext("2d", { alpha: true });
  if (!nose_context) {
    throw new Error("Nose texture 2D context is unavailable.");
  }

  const scale = nose_canvas_size_px / MASCOT_VIEWBOX_SIZE;
  nose_context.clearRect(0, 0, nose_canvas.width, nose_canvas.height);
  nose_context.scale(scale, scale);
  nose_context.fillStyle = "#ffffff";
  nose_context.fill(MASCOT_NOSE_PATH);

  const nose_texture = new THREE.CanvasTexture(nose_canvas);
  nose_texture.colorSpace = THREE.SRGBColorSpace;
  nose_texture.generateMipmaps = true;
  nose_texture.minFilter = THREE.LinearMipmapLinearFilter;
  nose_texture.magFilter = THREE.LinearFilter;
  nose_texture.needsUpdate = true;
  return nose_texture;
}

function load_image_element(image_url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => {
      resolve(image);
    });
    image.addEventListener("error", () => {
      reject(new Error(`Failed to load image: ${image_url}`));
    });
    image.src = image_url;
  });
}

function normalize_svg_markup(svg_markup) {
  if (/\swidth\s*=/.test(svg_markup) && /\sheight\s*=/.test(svg_markup)) {
    return svg_markup;
  }

  return svg_markup.replace(
    /<svg\b/,
    `<svg width="${MASCOT_VIEWBOX_SIZE}" height="${MASCOT_VIEWBOX_SIZE}" preserveAspectRatio="xMidYMid meet"`
  );
}

function get_display_phase_metrics({
  angle_rad,
  base_angle_rad,
  slot_count,
  phase_count,
  spoke_pattern_id,
  center_x_px,
  phase_mask_center_offset_x_px
}) {
  if (phase_count !== 2) {
    const segment_id = Math.min(
      phase_count - 1,
      Math.floor(spoke_pattern_id * phase_count / slot_count)
    );
    const segment_start = Math.floor(segment_id * slot_count / phase_count);
    const segment_end = Math.floor((segment_id + 1) * slot_count / phase_count) - 1;
    const segment_length = Math.max(1, segment_end - segment_start + 1);
    const segment_index = spoke_pattern_id - segment_start;
    const fill_u = segment_length <= 1 ? 1 : segment_index / (segment_length - 1);
    return {
      fill_u,
      phase_frontier_u: fill_u,
      phase_mask_center_x_px:
        segment_id === 0
          ? center_x_px - phase_mask_center_offset_x_px
          : center_x_px + phase_mask_center_offset_x_px
    };
  }

  // In the stage's y-up world space this maps as: 3PM=0, 12PM=0.25, 9AM=0.5, 6PM=0.75.
  // Boundary ownership is intentionally asymmetric:
  // - 3PM belongs to the bottom phase, so it carries the bottom phase's maximum thickness/length.
  // - 9AM belongs to the top phase, so it carries the top phase's maximum thickness/length.
  const display_u = wrap_positive(angle_rad - base_angle_rad, TAU) / TAU;
  const is_upper_phase = display_u > 0 && display_u <= 0.5;
  const fill_u = is_upper_phase
    ? display_u / 0.5
    : (display_u > 0.5 ? (display_u - 0.5) / 0.5 : 1);
  return {
    fill_u,
    phase_frontier_u: fill_u,
    phase_mask_center_x_px: is_upper_phase
      ? center_x_px - phase_mask_center_offset_x_px
      : center_x_px + phase_mask_center_offset_x_px
  };
}

function get_phase_mask_geometry({
  box,
  center_x_px,
  center_y_px
}) {
  const geometry_scale = box ? box.draw_size_px / MASCOT_VIEWBOX_SIZE : 1;
  const radius_px = 250 * geometry_scale;
  const center_offset_x_px = 50 * geometry_scale;
  return {
    radius_px,
    center_offset_x_px,
    center_y_px,
    left_center_x_px: center_x_px - center_offset_x_px,
    right_center_x_px: center_x_px + center_offset_x_px
  };
}

function get_width_transition_phase_metrics({
  angle_rad,
  base_angle_rad,
  slot_count,
  phase_count,
  spoke_pattern_id,
  center_x_px,
  phase_mask_center_offset_x_px
}) {
  const phase_metrics = get_display_phase_metrics({
    angle_rad,
    base_angle_rad,
    slot_count,
    phase_count,
    spoke_pattern_id,
    center_x_px,
    phase_mask_center_offset_x_px
  });

  if (phase_count !== 2 || slot_count <= 1) {
    return phase_metrics;
  }

  const spoke_slot_u = 1 / slot_count;
  const display_u = wrap_positive(angle_rad - base_angle_rad, TAU) / TAU;
  if (!(display_u > 0 && display_u < spoke_slot_u * 3)) {
    return phase_metrics;
  }

  const skew_strength = 1 - smoothstep(spoke_slot_u, spoke_slot_u * 3, display_u);
  if (skew_strength <= 0) {
    return phase_metrics;
  }

  const skewed_display_u = clamp(display_u + spoke_slot_u * skew_strength, 0, 0.5);
  const skewed_angle_rad = base_angle_rad + TAU * skewed_display_u;
  return get_display_phase_metrics({
    angle_rad: skewed_angle_rad,
    base_angle_rad,
    slot_count,
    phase_count,
    spoke_pattern_id,
    center_x_px,
    phase_mask_center_offset_x_px
  });
}

export function createRenderer({
  stage,
  canvas,
  text_overlay_canvas,
  config,
  output_profile_key = DEFAULT_OUTPUT_PROFILE_KEY
}) {
  let current_output_profile_key = config.output_profile_key || output_profile_key;
  let stage_metrics = get_output_profile_metrics(current_output_profile_key);
  let stage_width_px = stage_metrics.width_px;
  let stage_height_px = stage_metrics.height_px;
  let stage_aspect_ratio = stage_metrics.aspect_ratio;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(get_render_pixel_ratio());
  renderer.setSize(stage_width_px, stage_height_px, false);
  renderer.setClearColor(STAGE_BACKGROUND_COLOR, 1);
  const text_overlay_context = text_overlay_canvas
    ? text_overlay_canvas.getContext("2d", {
      alpha: true,
      desynchronized: Boolean(config.performance?.desynchronized)
    })
    : null;
  const export_canvas = document.createElement("canvas");

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    0,
    stage_width_px,
    stage_height_px,
    0,
    -100,
    100
  );
  camera.position.z = 10;

  const world_group = new THREE.Group();
  const mascot_group = new THREE.Group();
  scene.add(world_group);
  scene.add(mascot_group);

  const mascot_plane_geometry = new THREE.PlaneGeometry(1, 1);
  const face_material = new THREE.MeshBasicMaterial({
    transparent: true,
    color: "#ffffff",
    depthTest: false,
    depthWrite: false
  });
  face_material.toneMapped = false;

  const halo_reference_material = new THREE.MeshBasicMaterial({
    transparent: true,
    color: HALO_REFERENCE_COLOR,
    depthTest: false,
    depthWrite: false,
    opacity: HALO_REFERENCE_OPACITY
  });
  halo_reference_material.toneMapped = false;
  const nose_texture = create_nose_texture();
  const nose_material = new THREE.MeshBasicMaterial({
    transparent: true,
    color: "#ffffff",
    map: nose_texture,
    depthTest: false,
    depthWrite: false
  });
  nose_material.toneMapped = false;

  const nose_cutout_material = new THREE.MeshBasicMaterial({
    transparent: true,
    color: STAGE_BACKGROUND_COLOR,
    map: nose_texture,
    depthTest: false,
    depthWrite: false
  });
  nose_cutout_material.toneMapped = false;

  const face_mesh = new THREE.Mesh(mascot_plane_geometry, face_material);
  face_mesh.renderOrder = MASCOT_FACE_ORDER;
  face_mesh.visible = false;

  const halo_reference_mesh = new THREE.Mesh(mascot_plane_geometry, halo_reference_material);
  halo_reference_mesh.renderOrder = HALO_REFERENCE_ORDER;
  halo_reference_mesh.visible = false;

  const nose_mesh = new THREE.Mesh(mascot_plane_geometry, nose_material);
  nose_mesh.renderOrder = MASCOT_NOSE_ORDER;
  nose_mesh.visible = false;

  const nose_cutout_mesh = new THREE.Mesh(mascot_plane_geometry, nose_cutout_material);
  nose_cutout_mesh.renderOrder = MASCOT_NOSE_CUTOUT_ORDER;
  nose_cutout_mesh.visible = false;

  mascot_group.add(halo_reference_mesh);
  mascot_group.add(face_mesh);
  mascot_group.add(nose_mesh);
  mascot_group.add(nose_cutout_mesh);

  const texture_loader = new THREE.TextureLoader();

  const runtime = {
    dpr: 1,
    dot_end_sec: 1,
    finale_start_sec: 1,
    finale_end_sec: 1,
    playback_end_sec: 1,
    playback_time_sec: 0,
    blink_start_sec: 1,
    blink_end_sec: 1,
    spawn_angle_rad: 0,
    points: [],
    spokes: [],
    mascot_face_texture: null,
    mascot_halo_texture: null,
    mascot_box: null,
    animation_frame_id: 0,
    is_paused: false,
    pause_time_ms: 0,
    animation_start_ms: performance.now(),
    refresh_serial: 0,
    spoke_width_phase_u_by_source: new Map(),
    spoke_clip_center_x_by_source: new Map(),
    spoke_width_transition_playback_time_sec: null,
    layers: null,
    layer_capacities: null
  };

  function set_output_profile(next_profile_key) {
    current_output_profile_key = next_profile_key || DEFAULT_OUTPUT_PROFILE_KEY;
    stage_metrics = get_output_profile_metrics(current_output_profile_key);
    stage_width_px = stage_metrics.width_px;
    stage_height_px = stage_metrics.height_px;
    stage_aspect_ratio = stage_metrics.aspect_ratio;
    apply_stage_styles();
  }

  function apply_stage_styles() {
    document.body.style.background = STAGE_BACKGROUND_COLOR;
    stage.style.aspectRatio = `${stage_width_px} / ${stage_height_px}`;
    stage.style.width =
      `min(${stage_width_px}px, calc(100vw - var(--editor-panel-space, 0px) - 3rem), ` +
      `calc((100svh - 5.5rem) * ${stage_aspect_ratio}))`;
    stage.style.borderRadius = "0";
    stage.style.background = STAGE_BACKGROUND_COLOR;
    stage.style.borderColor = "transparent";
    stage.style.boxShadow = "none";
  }

  function clear_text_overlay() {
    if (!text_overlay_context || !text_overlay_canvas) {
      return;
    }

    text_overlay_context.save();
    text_overlay_context.setTransform(1, 0, 0, 1, 0, 0);
    text_overlay_context.clearRect(0, 0, text_overlay_canvas.width, text_overlay_canvas.height);
    text_overlay_context.restore();
  }

  function configure_text_overlay_canvas() {
    if (!text_overlay_context || !text_overlay_canvas) {
      return;
    }

    const pixel_width = Math.max(1, Math.round(stage_width_px * runtime.dpr));
    const pixel_height = Math.max(1, Math.round(stage_height_px * runtime.dpr));
    if (
      text_overlay_canvas.width !== pixel_width ||
      text_overlay_canvas.height !== pixel_height
    ) {
      text_overlay_canvas.width = pixel_width;
      text_overlay_canvas.height = pixel_height;
    }

    text_overlay_canvas.style.width = "";
    text_overlay_canvas.style.height = "";
    text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
    text_overlay_context.textAlign = "center";
    text_overlay_context.textBaseline = "middle";
    text_overlay_context.lineJoin = "miter";
    text_overlay_context.lineCap = "butt";
  }

  function get_mascot_draw_box() {
    const draw_size_px = config.mascot.base_width_px * config.mascot.scale;
    return {
      draw_size_px,
      center_x_px: config.composition.center_x_px + config.mascot.offset_x_px,
      center_y_px: config.composition.center_y_px + config.mascot.offset_y_px,
      left_px: config.composition.center_x_px + config.mascot.offset_x_px - draw_size_px * 0.5,
      top_px: config.composition.center_y_px + config.mascot.offset_y_px - draw_size_px * 0.5
    };
  }

  function get_mascot_asset_url(asset_path) {
    return new URL(asset_path, window.location.href).href;
  }

  function dispose_texture(texture) {
    if (texture) {
      texture.dispose();
    }
  }

  function get_render_pixel_ratio() {
    const max_dpr = Math.max(1, Number(config.performance?.max_device_pixel_ratio || 1));
    return clamp(window.devicePixelRatio || 1, 1, max_dpr);
  }

  function configure_texture(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    return texture;
  }

  function clear_mascot_textures() {
    dispose_texture(runtime.mascot_face_texture);
    dispose_texture(runtime.mascot_halo_texture);
    runtime.mascot_face_texture = null;
    runtime.mascot_halo_texture = null;
    face_material.map = null;
    halo_reference_material.map = null;
    face_material.needsUpdate = true;
    halo_reference_material.needsUpdate = true;
  }

  function get_mascot_texture_size_px() {
    const requested_size_px = Math.ceil(
      Math.max(1024, config.mascot.base_width_px * config.mascot.scale * MASCOT_TEXTURE_SCALE)
    );
    return Math.min(renderer.capabilities.maxTextureSize, requested_size_px);
  }

  async function load_svg_texture(texture_url, texture_size_px) {
    const response = await fetch(texture_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch texture: ${texture_url}`);
    }

    const svg_markup = normalize_svg_markup(await response.text());
    const svg_blob = new Blob([svg_markup], {
      type: "image/svg+xml;charset=utf-8"
    });
    const svg_object_url = URL.createObjectURL(svg_blob);

    try {
      const image = await load_image_element(svg_object_url);
      const raster_canvas = document.createElement("canvas");
      raster_canvas.width = texture_size_px;
      raster_canvas.height = texture_size_px;
      const raster_context = raster_canvas.getContext("2d", { alpha: true });
      if (!raster_context) {
        throw new Error("Mascot texture 2D context is unavailable.");
      }

      raster_context.imageSmoothingEnabled = true;
      raster_context.clearRect(0, 0, texture_size_px, texture_size_px);
      raster_context.drawImage(image, 0, 0, texture_size_px, texture_size_px);
      return configure_texture(new THREE.CanvasTexture(raster_canvas));
    } finally {
      URL.revokeObjectURL(svg_object_url);
    }
  }

  function load_bitmap_texture(texture_url) {
    return new Promise((resolve, reject) => {
      texture_loader.load(
        texture_url,
        (texture) => {
          resolve(configure_texture(texture));
        },
        undefined,
        () => {
          reject(new Error(`Failed to load texture: ${texture_url}`));
        }
      );
    });
  }

  function load_texture(texture_url, texture_size_px) {
    if (texture_url.toLowerCase().endsWith(".svg")) {
      return load_svg_texture(texture_url, texture_size_px);
    }

    return load_bitmap_texture(texture_url);
  }

  async function load_mascot_textures() {
    const texture_size_px = get_mascot_texture_size_px();
    const [face_texture, halo_texture] = await Promise.all([
      load_texture(get_mascot_asset_url(config.mascot.face_asset_path), texture_size_px),
      load_texture(get_mascot_asset_url(config.mascot.halo_asset_path), texture_size_px)
    ]);

    clear_mascot_textures();

    runtime.mascot_face_texture = face_texture;
    runtime.mascot_halo_texture = halo_texture;
    face_material.map = face_texture;
    halo_reference_material.map = halo_texture;
    face_material.needsUpdate = true;
    halo_reference_material.needsUpdate = true;
  }

  function get_full_frame_spoke_outer_radius(center_x_px, center_y_px) {
    const farthest_corner_dx_px = Math.max(center_x_px, stage_width_px - center_x_px);
    const farthest_corner_dy_px = Math.max(center_y_px, stage_height_px - center_y_px);
    return Math.hypot(farthest_corner_dx_px, farthest_corner_dy_px);
  }

  function get_layer_capacities() {
    const max_spoke_count = Math.max(1, Math.round(config.generator_wrangle.spoke_count || 1));
    const max_orbit_count = Math.max(1, Math.round(config.generator_wrangle.num_orbits || 1));
    const mascot_box = config.mascot.enabled ? get_mascot_draw_box() : null;
    const geometry_scale = mascot_box ? mascot_box.draw_size_px / MASCOT_VIEWBOX_SIZE : 1;
    const inner_radius_px =
      COMPOSITION_SIZE_PX *
      config.composition.radial_scale *
      config.generator_wrangle.inner_radius *
      geometry_scale;
    const outer_radius_px =
      COMPOSITION_SIZE_PX *
      config.composition.radial_scale *
      config.generator_wrangle.outer_radius *
      geometry_scale;
    const radius_span_px = Math.max(0, outer_radius_px - inner_radius_px);
    const orbit_step_px =
      max_orbit_count <= 1 || radius_span_px <= 0
        ? Math.max(1, radius_span_px)
        : radius_span_px / Math.max(0.0001, max_orbit_count - 1);
    const full_frame_outer_radius_px = get_full_frame_spoke_outer_radius(
      config.composition.center_x_px,
      config.composition.center_y_px
    );
    const max_full_frame_orbit_index = Math.max(
      0,
      Math.ceil((full_frame_outer_radius_px - inner_radius_px) / Math.max(0.0001, orbit_step_px))
    );

    return {
      background_spokes: Math.max(32, max_spoke_count),
      points: Math.max(512, max_spoke_count * max_orbit_count),
      halo_thin_spokes: Math.max(32, max_spoke_count),
      halo_thick_spokes: Math.max(32, max_spoke_count),
      halo_echo_dots: Math.max(512, max_spoke_count * (max_full_frame_orbit_index + 1)),
      halo_echo_marks: Math.max(1536, max_spoke_count * (max_full_frame_orbit_index + 1) * 3),
      debug_boundary: 1,
      debug_masks: DEBUG_MASK_SEGMENT_COUNT * 2 + 4,
      eyes: 2
    };
  }

  function dispose_layers() {
    if (!runtime.layers) {
      return;
    }

    world_group.remove(runtime.layers.backgroundSpokes.mesh);
    world_group.remove(runtime.layers.points.mesh);
    world_group.remove(runtime.layers.debugBoundary.mesh);
    world_group.remove(runtime.layers.debugMasks.mesh);
    mascot_group.remove(runtime.layers.haloThinSpokes.mesh);
    mascot_group.remove(runtime.layers.haloThickSpokes.mesh);
    mascot_group.remove(runtime.layers.haloEchoDots.mesh);
    mascot_group.remove(runtime.layers.haloEchoMarks.mesh);
    mascot_group.remove(runtime.layers.eyes.mesh);

    runtime.layers.backgroundSpokes.dispose();
    runtime.layers.points.dispose();
    runtime.layers.debugBoundary.dispose();
    runtime.layers.debugMasks.dispose();
    runtime.layers.haloThinSpokes.dispose();
    runtime.layers.haloThickSpokes.dispose();
    runtime.layers.haloEchoDots.dispose();
    runtime.layers.haloEchoMarks.dispose();
    runtime.layers.eyes.dispose();

    runtime.layers = null;
    runtime.layer_capacities = null;
  }

  function ensure_layers() {
    const next_capacities = get_layer_capacities();
    if (capacities_match(runtime.layer_capacities, next_capacities)) {
      return;
    }

    dispose_layers();

    runtime.layers = {
      backgroundSpokes: createSegmentLayer(
        next_capacities.background_spokes,
        config.spoke_lines.construction_color,
        WORLD_BACKGROUND_ORDER
      ),
      points: createCircleLayer(
        next_capacities.points,
        config.point_style.color,
        WORLD_POINTS_ORDER
      ),
      debugBoundary: createSegmentLayer(
        next_capacities.debug_boundary,
        DEBUG_BOUNDARY_COLOR,
        DEBUG_BOUNDARY_ORDER
      ),
      debugMasks: createSegmentLayer(
        next_capacities.debug_masks,
        DEBUG_MASK_COLOR,
        DEBUG_MASK_ORDER
      ),
      haloThinSpokes: createSegmentLayer(
        next_capacities.halo_thin_spokes,
        config.spoke_lines.reference_color,
        HALO_THIN_ORDER
      ),
      haloThickSpokes: createSegmentLayer(
        next_capacities.halo_thick_spokes,
        config.spoke_lines.color,
        HALO_THICK_ORDER
      ),
      haloEchoDots: createCircleLayer(
        next_capacities.halo_echo_dots,
        config.spoke_lines.color,
        HALO_ECHO_ORDER
      ),
      haloEchoMarks: createSegmentLayer(
        next_capacities.halo_echo_marks,
        config.spoke_lines.color,
        HALO_ECHO_ORDER
      ),
      eyes: createCircleLayer(next_capacities.eyes, "#ffffff", MASCOT_EYE_ORDER)
    };

    world_group.add(runtime.layers.backgroundSpokes.mesh);
    world_group.add(runtime.layers.points.mesh);
    world_group.add(runtime.layers.debugBoundary.mesh);
    world_group.add(runtime.layers.debugMasks.mesh);
    mascot_group.add(runtime.layers.haloThinSpokes.mesh);
    mascot_group.add(runtime.layers.haloThickSpokes.mesh);
    mascot_group.add(runtime.layers.haloEchoDots.mesh);
    mascot_group.add(runtime.layers.haloEchoMarks.mesh);
    mascot_group.add(runtime.layers.eyes.mesh);

    runtime.layer_capacities = next_capacities;
  }

  function invalidate_layer_caches() {}

  function build_scene_data() {
    const generator = config.generator_wrangle;
    const transition = config.transition_wrangle;
    const composition_size_px = COMPOSITION_SIZE_PX;
    const center_x_px = config.composition.center_x_px;
    const center_y_px = config.composition.center_y_px;
    const radial_scale = config.composition.radial_scale;
    const rotation_rad = radians(config.composition.global_rotation_deg);
    const mascot_box = config.mascot.enabled ? get_mascot_draw_box() : null;
    const geometry_scale = mascot_box ? mascot_box.draw_size_px / MASCOT_VIEWBOX_SIZE : 1;
    const inner_radius = composition_size_px * radial_scale * generator.inner_radius * geometry_scale;
    const outer_radius = composition_size_px * radial_scale * generator.outer_radius * geometry_scale;
    const radius_span = outer_radius - inner_radius;
    const base_pscale_px =
      transition.base_pscale * config.point_style.base_pscale_px_per_unit * geometry_scale;
    const fade_delay_sec = config.mascot_fade.enabled ? config.mascot_fade.duration_sec : 0;
    const head_turn_delay_sec = config.head_turn.enabled ? config.head_turn.duration_sec : 0;
    const head_turn_overlap_sec = config.head_turn.enabled
      ? clamp(config.head_turn.dot_overlap_sec ?? 0, 0, head_turn_delay_sec)
      : 0;
    const start_delay_sec = Math.max(
      fade_delay_sec,
      Math.max(0, head_turn_delay_sec - head_turn_overlap_sec)
    );
    const duration_sec = Math.max(0.001, transition.duration_sec);
    const emit_duration_sec = duration_sec * clamp(transition.emit_frac, 0.001, 1);
    const orbit_count_start_frac = clamp(transition.orbit_count_start_frac ?? 0, 0, 1);
    const orbit_count_end_frac = clamp(
      transition.orbit_count_end_frac ?? 1,
      orbit_count_start_frac,
      1
    );
    const orbit_count_start_sec = start_delay_sec + orbit_count_start_frac * duration_sec;
    const orbit_count_end_sec = start_delay_sec + orbit_count_end_frac * duration_sec;
    const dot_end_sec = start_delay_sec + duration_sec;
    const finale_start_sec = dot_end_sec + Math.max(0, config.finale.delay_after_dots_sec || 0);
    const finale_end_sec = config.finale.enabled
      ? finale_start_sec + Math.max(0.001, config.finale.duration_sec)
      : finale_start_sec;
    const blink_anchor_sec = config.finale.enabled ? finale_end_sec : dot_end_sec;
    const blink_start_sec = blink_anchor_sec + Math.max(0, config.blink.start_delay_sec || 0);
    const blink_end_sec = config.blink.enabled
      ? blink_start_sec + Math.max(0.0001, config.blink.duration_sec || 0)
      : blink_anchor_sec;
    const base_angle_rad = radians(generator.base_angle_deg) + rotation_rad;
    const spawn_angle_rad =
      radians(generator.anim_start_angle_deg + transition.spawn_angle_offset_deg) + rotation_rad;
    const phase_mask = get_phase_mask_geometry({
      box: mascot_box,
      center_x_px,
      center_y_px
    });
    const phase_mask_radius_px = phase_mask.radius_px;
    const phase_mask_center_offset_x_px = phase_mask.center_offset_x_px;
    const use_reference_phase_masks = generator.phase_count === 2;

    const spoke_specs = new Array(generator.spoke_count);
    const min_diameter_px =
      (config.point_style.min_diameter_px ?? config.point_style.min_rect_px ?? 0.9) * geometry_scale;

    for (let spoke_id = 0; spoke_id < generator.spoke_count; spoke_id += 1) {
      const spoke_pattern_id = wrap_positive(
        spoke_id - generator.pattern_offset_spokes,
        generator.spoke_count
      );
      const target_angle = base_angle_rad + TAU * spoke_id / generator.spoke_count;
      const phase_metrics = get_display_phase_metrics({
        angle_rad: target_angle,
        base_angle_rad,
        slot_count: generator.spoke_count,
        phase_count: generator.phase_count,
        spoke_pattern_id,
        center_x_px,
        phase_mask_center_offset_x_px
      });
      const fill_u = phase_metrics.fill_u;
      const continuous_active_orbits = clamp(
        generator.min_active_orbits +
          fill_u * (generator.num_orbits - generator.min_active_orbits),
        generator.min_active_orbits,
        generator.num_orbits
      );
      const reach_u = generator.num_orbits <= 1
        ? 1
        : (continuous_active_orbits - 1) / (generator.num_orbits - 1);
      const phase_frontier_scale = compute_frontier_scale(
        phase_metrics.phase_frontier_u,
        transition.phase_frontier_amount,
        transition.phase_frontier_width_u,
        transition.phase_frontier_bias,
        config.point_style.min_scale
      );

      spoke_specs[spoke_id] = {
        spoke_pattern_id,
        target_angle,
        fill_u,
        reach_u,
        fill_end_radius: inner_radius + radius_span * reach_u,
        phase_frontier_scale,
        phase_mask_center_x_px: phase_metrics.phase_mask_center_x_px,
        phase_mask_center_y_px: center_y_px,
        phase_mask_radius_px
      };
    }

    function get_spoke_point_metrics(spoke_spec, orbit_id) {
      const orbit_u = generator.num_orbits <= 1 ? 0 : orbit_id / (generator.num_orbits - 1);
      const radius = inner_radius + radius_span * orbit_u;
      const point_x = center_x_px + Math.cos(spoke_spec.target_angle) * radius;
      const point_y = center_y_px + Math.sin(spoke_spec.target_angle) * radius;
      const orbital_frontier_scale = compute_frontier_scale(
        Math.max(0, spoke_spec.reach_u - orbit_u),
        transition.orbital_frontier_amount,
        transition.orbital_frontier_width_u,
        transition.orbital_frontier_bias,
        config.point_style.min_scale
      );
      const diameter_px = Math.max(
        min_diameter_px,
        base_pscale_px * orbital_frontier_scale * spoke_spec.phase_frontier_scale
      );
      const radius_px = diameter_px * 0.5;
      const phase_mask_distance_px = Math.hypot(
        point_x - spoke_spec.phase_mask_center_x_px,
        point_y - spoke_spec.phase_mask_center_y_px
      );

      return {
        radius,
        diameter_px,
        radius_px,
        fits_within_spoke: use_reference_phase_masks
          ? phase_mask_distance_px + radius_px <= spoke_spec.phase_mask_radius_px + 0.01
          : radius + radius_px <= spoke_spec.fill_end_radius + 0.01
      };
    }

    const orbit_counts = new Array(generator.num_orbits).fill(0);
    for (let orbit_id = 0; orbit_id < generator.num_orbits; orbit_id += 1) {
      let count = 0;
      for (let spoke_id = 0; spoke_id < generator.spoke_count; spoke_id += 1) {
        if (get_spoke_point_metrics(spoke_specs[spoke_id], orbit_id).fits_within_spoke) {
          count += 1;
        }
      }
      orbit_counts[orbit_id] = count;
    }

    const max_orbit_count = Math.max(1, ...orbit_counts);
    const shot_interval_sec = max_orbit_count > 1
      ? emit_duration_sec / (max_orbit_count - 1)
      : emit_duration_sec;
    const base_speed_deg_per_sec = 360 * transition.spins / duration_sec;
    const capture_start_sec = start_delay_sec + transition.capture_start_frac * duration_sec;
    const orbit_count_from = clamp(generator.min_active_orbits, 1, generator.num_orbits);
    const orbit_count_to = clamp(generator.num_orbits, orbit_count_from, generator.num_orbits);

    runtime.dot_end_sec = dot_end_sec;
    runtime.finale_start_sec = finale_start_sec;
    runtime.finale_end_sec = finale_end_sec;
    runtime.playback_end_sec = Math.max(finale_end_sec, blink_end_sec);
    runtime.blink_start_sec = blink_start_sec;
    runtime.blink_end_sec = blink_end_sec;
    runtime.spawn_angle_rad = spawn_angle_rad;
    runtime.mascot_box = mascot_box;

    const points = [];
    const spokes = new Array(generator.spoke_count);
    const orbit_rank_counts = new Array(generator.num_orbits).fill(0);

    for (let spoke_id = 0; spoke_id < generator.spoke_count; spoke_id += 1) {
      const spoke_spec = spoke_specs[spoke_id];
      spokes[spoke_id] = {
        source_spoke_id: spoke_id,
        spoke_pattern_id: spoke_spec.spoke_pattern_id ?? spoke_id,
        angle: spoke_spec.target_angle,
        phase_u: spoke_spec.fill_u,
        start_radius: config.spoke_lines.start_radius_px * geometry_scale,
        end_radius: outer_radius + config.spoke_lines.end_radius_extra_px * geometry_scale,
        echo_dot_origin_radius: inner_radius,
        echo_dot_step_px: generator.num_orbits <= 1 ? 0 : radius_span / (generator.num_orbits - 1),
        echo_dots: [],
        inner_clip_offset_px: phase_mask_center_offset_x_px,
        inner_clip_center_x_px: spoke_spec.phase_mask_center_x_px,
        inner_clip_center_y_px: center_y_px,
        inner_clip_radius_px: phase_mask_radius_px
      };

      for (let orbit_id = 0; orbit_id < generator.num_orbits; orbit_id += 1) {
        const point_metrics = get_spoke_point_metrics(spoke_spec, orbit_id);
        if (!point_metrics.fits_within_spoke) {
          continue;
        }

        const orbit_rank = orbit_rank_counts[orbit_id];
        const speed_index = transition.inner_faster
          ? orbit_id
          : (generator.num_orbits - 1 - orbit_id);
        const speed_deg_per_sec =
          base_speed_deg_per_sec *
          Math.pow(Math.max(0.0001, transition.speed_mult_per_orbit), speed_index);
        const visible_delay_sec =
          transition.occlusion_arc_deg / Math.max(0.0001, speed_deg_per_sec);
        const raw_birth_sec =
          start_delay_sec +
          orbit_rank * shot_interval_sec +
          orbit_id * transition.orbit_stagger_frac * shot_interval_sec;
        let orbit_unlock_sec = start_delay_sec;
        if (transition.animate_orbit_count && orbit_count_to > orbit_count_from) {
          const orbit_target_index = orbit_id + 1;
          const orbit_unlock_u = clamp(
            (orbit_target_index - orbit_count_from) / (orbit_count_to - orbit_count_from),
            0,
            1
          );
          orbit_unlock_sec = lerp(orbit_count_start_sec, orbit_count_end_sec, orbit_unlock_u);
        }

        const birth_sec = Math.max(raw_birth_sec, orbit_unlock_sec);
        const visible_sec = birth_sec + visible_delay_sec;
        const point_capture_start_sec = Math.max(capture_start_sec, visible_sec);

        spokes[spoke_id].echo_dots.push({
          radius_px: point_metrics.radius_px
        });

        points.push({
          center_x_px,
          center_y_px,
          radius: point_metrics.radius,
          target_angle: spoke_spec.target_angle,
          orbit_id,
          speed_rad_per_sec: radians(speed_deg_per_sec),
          birth_sec,
          visible_sec,
          capture_start_sec: point_capture_start_sec,
          diameter_px: point_metrics.diameter_px,
          radius_px: point_metrics.radius_px
        });

        orbit_rank_counts[orbit_id] += 1;
      }
    }

    runtime.points = points;
    runtime.spokes = spokes;
  }

  function compute_mascot_fade_amount(playback_time_sec) {
    if (!config.mascot_fade.enabled) {
      return 1;
    }
    return smoothstep(0, Math.max(0.0001, config.mascot_fade.duration_sec), playback_time_sec);
  }

  function compute_head_turn_deg(local_time_sec) {
    if (!config.head_turn.enabled) {
      return 0;
    }

    const duration_sec = Math.max(0.0001, config.head_turn.duration_sec);
    if (local_time_sec <= 0 || local_time_sec >= duration_sec) {
      return 0;
    }

    const turn_u = clamp(local_time_sec / duration_sec, 0, 1);
    const peak_frac = clamp(config.head_turn.peak_frac, 0.05, 0.45);
    const reverse_frac = clamp(config.head_turn.reverse_frac ?? 0.56, peak_frac + 0.05, 0.85);
    const overshoot_frac = clamp(config.head_turn.overshoot_frac, reverse_frac + 0.05, 0.98);

    if (turn_u < peak_frac) {
      return lerp(0, config.head_turn.peak_angle_deg, smoothstep(0, peak_frac, turn_u));
    }

    if (turn_u < reverse_frac) {
      return lerp(
        config.head_turn.peak_angle_deg,
        config.head_turn.reverse_angle_deg,
        smoothstep(peak_frac, reverse_frac, turn_u)
      );
    }

    if (turn_u < overshoot_frac) {
      return lerp(
        config.head_turn.reverse_angle_deg,
        config.head_turn.overshoot_angle_deg,
        smoothstep(reverse_frac, overshoot_frac, turn_u)
      );
    }

    return lerp(
      config.head_turn.overshoot_angle_deg,
      0,
      smoothstep(overshoot_frac, 1, turn_u)
    );
  }

  function compute_blink_curve(blink_u) {
    const close_frac = clamp(config.blink.close_frac, 0.05, 0.9);
    const hold_end_frac = clamp(
      close_frac + config.blink.hold_closed_frac,
      close_frac,
      0.98
    );

    if (blink_u < close_frac) {
      return smoothstep(0, close_frac, blink_u);
    }

    if (blink_u < hold_end_frac) {
      return 1;
    }

    return 1 - smoothstep(hold_end_frac, 1, blink_u);
  }

  function compute_blink_amount(playback_time_sec) {
    if (
      !config.blink.enabled ||
      playback_time_sec < runtime.blink_start_sec ||
      playback_time_sec > runtime.blink_end_sec
    ) {
      return 0;
    }

    const blink_u = clamp(
      (playback_time_sec - runtime.blink_start_sec) /
        Math.max(0.0001, config.blink.duration_sec),
      0,
      1
    );
    return compute_blink_curve(blink_u);
  }

  function compute_head_turn_eye_squint_amount(playback_time_sec) {
    if (!config.head_turn.enabled) {
      return 0;
    }

    const duration_sec = Math.max(0.0001, config.head_turn.duration_sec);
    if (playback_time_sec <= 0 || playback_time_sec >= duration_sec) {
      return 0;
    }

    const ease_sec = Math.min(0.03, duration_sec * 0.18);
    const close_amount = smoothstep(0, ease_sec, playback_time_sec);
    const open_amount = 1 - smoothstep(duration_sec - ease_sec, duration_sec, playback_time_sec);
    return clamp(close_amount * open_amount, 0, 1);
  }

  function compute_finale_progress(playback_time_sec, force_final) {
    if (!config.finale.enabled) {
      return { halo_u: 0 };
    }

    return {
      halo_u: force_final
        ? 1
        : smoothstep(runtime.finale_start_sec, runtime.finale_end_sec, playback_time_sec)
    };
  }

  function get_screensaver_cycle_sec() {
    return Math.max(0, Number(config.screensaver?.cycle_sec || 0));
  }

  function get_phase_boundary_transition_sec() {
    return Math.max(0, Number(config.screensaver?.phase_boundary_transition_sec || 0));
  }

  function reset_spoke_width_transition_state() {
    runtime.spoke_width_phase_u_by_source.clear();
    runtime.spoke_clip_center_x_by_source.clear();
    runtime.spoke_width_transition_playback_time_sec = null;
  }

  function compute_screensaver_pulse_u(playback_time_sec) {
    const cycle_sec = get_screensaver_cycle_sec();
    if (cycle_sec <= 0 || playback_time_sec <= runtime.playback_end_sec) {
      return 1;
    }

    const loop_time_sec = playback_time_sec - runtime.playback_end_sec;
    const cycle_phase = TAU * loop_time_sec / cycle_sec;
    const raw_pulse_u = 0.5 + 0.5 * Math.cos(cycle_phase);
    const ramp_in_sec = Math.max(0, Number(config.screensaver?.ramp_in_sec || 0));
    if (ramp_in_sec <= 0) {
      return raw_pulse_u;
    }

    return lerp(1, raw_pulse_u, smoothstep(0, ramp_in_sec, loop_time_sec));
  }

  function has_post_finale_field_motion() {
    const cycle_sec = get_screensaver_cycle_sec();
    if (cycle_sec <= 0) {
      return false;
    }

    const max_orbits = Math.max(1, Number(config.generator_wrangle.num_orbits || 1));
    const min_orbits = clamp(
      Number(config.generator_wrangle.min_active_orbits || 1),
      1,
      max_orbits
    );
    const orbit_motion =
      config.screensaver?.pulse_orbits !== false &&
      max_orbits - min_orbits > 0.001;
    const max_spokes = Math.max(1, Number(config.generator_wrangle.spoke_count || 1));
    const min_spokes = clamp(
      Number(config.screensaver?.min_spoke_count || max_spokes),
      1,
      max_spokes
    );
    const spoke_motion =
      Boolean(config.screensaver?.pulse_spokes) && max_spokes - min_spokes > 0.001;
    return orbit_motion || spoke_motion;
  }

  function is_post_finale_dynamic_field_active(playback_time_sec) {
    return playback_time_sec > runtime.playback_end_sec && has_post_finale_field_motion();
  }

  function compute_effective_orbit_count(playback_time_sec) {
    const max_orbits = Math.max(1, Math.round(config.generator_wrangle.num_orbits || 1));
    if (
      !config.screensaver?.pulse_orbits ||
      !has_post_finale_field_motion() ||
      playback_time_sec <= runtime.playback_end_sec
    ) {
      return max_orbits;
    }

    const min_orbits = clamp(
      Math.round(config.generator_wrangle.min_active_orbits || 1),
      1,
      max_orbits
    );
    return lerp(min_orbits, max_orbits, compute_screensaver_pulse_u(playback_time_sec));
  }

  function compute_effective_spoke_count(playback_time_sec) {
    const max_spokes = Math.max(1, Number(config.generator_wrangle.spoke_count || 1));
    if (
      !config.screensaver?.pulse_spokes ||
      !has_post_finale_field_motion() ||
      playback_time_sec <= runtime.playback_end_sec
    ) {
      return max_spokes;
    }

    const min_spokes = clamp(
      Number(config.screensaver?.min_spoke_count || max_spokes),
      1,
      max_spokes
    );
    return lerp(min_spokes, max_spokes, compute_screensaver_pulse_u(playback_time_sec));
  }

  function build_post_finale_field_state(playback_time_sec) {
    const generator = config.generator_wrangle;
    const transition = config.transition_wrangle;
    const center_x_px = config.composition.center_x_px;
    const center_y_px = config.composition.center_y_px;
    const radial_scale = config.composition.radial_scale;
    const rotation_rad = radians(config.composition.global_rotation_deg || 0);
    const mascot_box = runtime.mascot_box;
    const geometry_scale = mascot_box ? mascot_box.draw_size_px / MASCOT_VIEWBOX_SIZE : 1;
    const inner_radius_px = COMPOSITION_SIZE_PX * radial_scale * generator.inner_radius * geometry_scale;
    const outer_radius_px = COMPOSITION_SIZE_PX * radial_scale * generator.outer_radius * geometry_scale;
    const radius_span_px = Math.max(0, outer_radius_px - inner_radius_px);
    const base_pscale_px =
      transition.base_pscale * config.point_style.base_pscale_px_per_unit * geometry_scale;
    const min_diameter_px =
      (config.point_style.min_diameter_px ?? config.point_style.min_rect_px ?? 0.9) * geometry_scale;
    const phase_mask = get_phase_mask_geometry({
      box: mascot_box,
      center_x_px,
      center_y_px
    });
    const phase_mask_radius_px = phase_mask.radius_px;
    const phase_mask_center_offset_x_px = phase_mask.center_offset_x_px;
    const use_reference_phase_masks = generator.phase_count === 2;
    const base_angle_rad = radians(generator.base_angle_deg) + rotation_rad;
    const effective_spoke_count = Math.max(1, compute_effective_spoke_count(playback_time_sec));
    const effective_orbit_count = Math.max(1, compute_effective_orbit_count(playback_time_sec));
    const max_spoke_count = Math.max(1, Math.round(generator.spoke_count || 1));
    const orbit_step_px =
      effective_orbit_count <= 1 || radius_span_px <= 0
        ? radius_span_px
        : radius_span_px / Math.max(0.0001, effective_orbit_count - 1);
    const full_frame_outer_radius_px = get_full_frame_spoke_outer_radius(center_x_px, center_y_px);
    const halo_outer_radius_px = mascot_box ? mascot_box.draw_size_px * 0.5 : outer_radius_px;
    const max_central_orbit_index = orbit_step_px > 0
      ? Math.max(0, Math.ceil(radius_span_px / orbit_step_px))
      : 0;
    const total_turns = max_spoke_count / Math.max(1, effective_spoke_count);
    const seam_display_u = 0.5;
    const width_transition_duration_sec = get_phase_boundary_transition_sec();
    const last_width_transition_time_sec = runtime.spoke_width_transition_playback_time_sec;
    const width_transition_delta_sec =
      last_width_transition_time_sec == null
        ? null
        : playback_time_sec - last_width_transition_time_sec;
    const should_snap_width_transition =
      width_transition_duration_sec <= 0 ||
      width_transition_delta_sec == null ||
      width_transition_delta_sec <= 0 ||
      width_transition_delta_sec > 0.25;
    const width_transition_lerp_u = should_snap_width_transition
      ? 1
      : 1 - Math.exp(-width_transition_delta_sec / width_transition_duration_sec);
    const next_spoke_width_phase_u_by_source = new Map();
    const next_spoke_clip_center_x_by_source = new Map();
    const points = [];
    const spokes = [];

    for (let source_index = 0; source_index < max_spoke_count; source_index += 1) {
      const strip_u = source_index / max_spoke_count;
      const wrapped_turn_position = strip_u * total_turns;
      if (wrapped_turn_position >= 1) {
        continue;
      }

      const display_u = wrap_positive(seam_display_u - wrapped_turn_position, 1);
      const angle = base_angle_rad + TAU * display_u;
      const spoke_pattern_id = wrap_positive(
        source_index - generator.pattern_offset_spokes,
        max_spoke_count
      );
      const phase_metrics = get_display_phase_metrics({
        angle_rad: angle,
        base_angle_rad,
        slot_count: max_spoke_count,
        phase_count: generator.phase_count,
        spoke_pattern_id,
        center_x_px,
        phase_mask_center_offset_x_px
      });
      const width_transition_phase_metrics = get_width_transition_phase_metrics({
        angle_rad: angle,
        base_angle_rad,
        slot_count: max_spoke_count,
        phase_count: generator.phase_count,
        spoke_pattern_id,
        center_x_px,
        phase_mask_center_offset_x_px
      });
      const fill_u = phase_metrics.fill_u;
      const previous_width_phase_u = runtime.spoke_width_phase_u_by_source.get(source_index);
      const previous_clip_center_x_px = runtime.spoke_clip_center_x_by_source.get(source_index);
      const target_width_phase_u = width_transition_phase_metrics.fill_u;
      const target_clip_center_x_px = width_transition_phase_metrics.phase_mask_center_x_px;
      const width_phase_u = previous_width_phase_u == null
        ? target_width_phase_u
        : lerp(previous_width_phase_u, target_width_phase_u, width_transition_lerp_u);
      const clip_center_x_px = previous_clip_center_x_px == null
        ? target_clip_center_x_px
        : lerp(previous_clip_center_x_px, target_clip_center_x_px, width_transition_lerp_u);
      next_spoke_width_phase_u_by_source.set(source_index, width_phase_u);
      next_spoke_clip_center_x_by_source.set(source_index, clip_center_x_px);
      const continuous_active_orbits = clamp(
        generator.min_active_orbits +
          fill_u * (effective_orbit_count - generator.min_active_orbits),
        generator.min_active_orbits,
        effective_orbit_count
      );
      const reach_u = effective_orbit_count <= 1
        ? 1
        : clamp(
          (continuous_active_orbits - 1) / Math.max(0.0001, effective_orbit_count - 1),
          0,
          1
        );
      const fill_end_radius_px = inner_radius_px + radius_span_px * reach_u;
      const phase_frontier_scale = compute_frontier_scale(
        phase_metrics.phase_frontier_u,
        transition.phase_frontier_amount,
        transition.phase_frontier_width_u,
        transition.phase_frontier_bias,
        config.point_style.min_scale
      );
      const spoke = {
        source_spoke_id: source_index,
        spoke_pattern_id,
        angle,
        alpha: 1,
        phase_u: fill_u,
        width_phase_u,
        seam_overlay_only: false,
        start_radius: config.spoke_lines.start_radius_px * geometry_scale,
        end_radius: outer_radius_px + config.spoke_lines.end_radius_extra_px * geometry_scale,
        echo_dot_origin_radius: inner_radius_px,
        echo_dot_step_px: orbit_step_px,
        echo_dots: [],
        inner_clip_offset_px: phase_mask_center_offset_x_px,
        inner_clip_center_x_px: clip_center_x_px,
        inner_clip_center_y_px: center_y_px,
        inner_clip_radius_px: phase_mask_radius_px
      };

      for (let orbit_index = 0; orbit_index <= max_central_orbit_index; orbit_index += 1) {
        const radius_px = inner_radius_px + orbit_index * orbit_step_px;
        if (radius_px > outer_radius_px + 0.01) {
          break;
        }

        const orbit_u = radius_span_px <= 0
          ? 0
          : clamp((radius_px - inner_radius_px) / Math.max(0.0001, radius_span_px), 0, 1);
        const point_x = center_x_px + Math.cos(angle) * radius_px;
        const point_y = center_y_px + Math.sin(angle) * radius_px;
        const orbital_frontier_scale = compute_frontier_scale(
          Math.max(0, reach_u - orbit_u),
          transition.orbital_frontier_amount,
          transition.orbital_frontier_width_u,
          transition.orbital_frontier_bias,
          config.point_style.min_scale
        );
        const dot_diameter_px = Math.max(
          min_diameter_px,
          base_pscale_px * orbital_frontier_scale * phase_frontier_scale
        );
        const dot_radius_px = dot_diameter_px * 0.5;
        const phase_mask_distance_px = Math.hypot(
          point_x - clip_center_x_px,
          point_y - center_y_px
        );
        const fits_within_spoke = use_reference_phase_masks
          ? phase_mask_distance_px + dot_radius_px <= phase_mask_radius_px + 0.01
          : radius_px + dot_radius_px <= fill_end_radius_px + 0.01;

        if (!fits_within_spoke) {
          continue;
        }

        spoke.echo_dots.push({
          radius_px: dot_radius_px
        });
        points.push({
          x: point_x,
          y: point_y,
          radius_px: dot_radius_px,
          alpha: 1
        });
      }

      spokes.push(spoke);
    }

    runtime.spoke_width_phase_u_by_source = next_spoke_width_phase_u_by_source;
    runtime.spoke_clip_center_x_by_source = next_spoke_clip_center_x_by_source;
    runtime.spoke_width_transition_playback_time_sec = playback_time_sec;

    return {
      box: mascot_box,
      points,
      spokes,
      halo_outer_radius_px,
      full_frame_outer_radius_px
    };
  }

  function clear_layers() {
    runtime.layers.backgroundSpokes.clear();
    runtime.layers.points.clear();
    runtime.layers.debugBoundary.clear();
    runtime.layers.debugMasks.clear();
    runtime.layers.haloThinSpokes.clear();
    runtime.layers.haloThickSpokes.clear();
    runtime.layers.haloEchoDots.clear();
    runtime.layers.haloEchoMarks.clear();
    runtime.layers.eyes.clear();
    clear_text_overlay();
  }

  function finalize_layers() {
    runtime.layers.backgroundSpokes.finalize();
    runtime.layers.points.finalize();
    runtime.layers.debugBoundary.finalize();
    runtime.layers.debugMasks.finalize();
    runtime.layers.haloThinSpokes.finalize();
    runtime.layers.haloThickSpokes.finalize();
    runtime.layers.haloEchoDots.finalize();
    runtime.layers.haloEchoMarks.finalize();
    runtime.layers.eyes.finalize();
  }

  function update_layer_colors() {
    runtime.layers.backgroundSpokes.setColor(config.spoke_lines.construction_color);
    runtime.layers.points.setColor(config.point_style.color);
    runtime.layers.debugBoundary.setColor(DEBUG_BOUNDARY_COLOR);
    runtime.layers.debugMasks.setColor(DEBUG_MASK_COLOR);
    runtime.layers.haloThinSpokes.setColor(config.spoke_lines.reference_color);
    runtime.layers.haloThickSpokes.setColor(config.spoke_lines.color);
    runtime.layers.haloEchoDots.setColor(get_echo_color());
    runtime.layers.haloEchoMarks.setColor(get_echo_color());
    runtime.layers.eyes.setColor("#ffffff");
    face_material.color.set(config.mascot.color);
    nose_material.color.set(config.mascot.color);
    nose_cutout_material.color.set(STAGE_BACKGROUND_COLOR);
    halo_reference_material.color.set(HALO_REFERENCE_COLOR);
  }

  function push_background_spokes(spokes, full_frame_outer_radius_px) {
    for (let spoke_index = 0; spoke_index < spokes.length; spoke_index += 1) {
      const spoke = spokes[spoke_index];
      if (spoke.seam_overlay_only) {
        continue;
      }
      const spoke_alpha = clamp(spoke.alpha ?? 1, 0, 1);
      if (spoke_alpha <= 0) {
        continue;
      }

      const start_x =
        config.composition.center_x_px + Math.cos(spoke.angle) * spoke.start_radius;
      const start_y =
        config.composition.center_y_px + Math.sin(spoke.angle) * spoke.start_radius;
      const end_x =
        config.composition.center_x_px + Math.cos(spoke.angle) * full_frame_outer_radius_px;
      const end_y =
        config.composition.center_y_px + Math.sin(spoke.angle) * full_frame_outer_radius_px;

      runtime.layers.backgroundSpokes.push(
        start_x,
        start_y,
        end_x,
        end_y,
        BACKGROUND_SPOKE_WIDTH_PX,
        spoke_alpha
      );
    }
  }

  function push_intro_points(time_sec, force_final) {
    const alpha_ramp_duration_sec = Math.max(
      0,
      config.transition_wrangle.alpha_ramp_duration_sec || 0
    );

    for (let point_index = 0; point_index < runtime.points.length; point_index += 1) {
      const point = runtime.points[point_index];

      if (!force_final && time_sec < point.birth_sec) {
        continue;
      }

      if (
        !force_final &&
        config.transition_wrangle.hide_invisible_by_pscale &&
        time_sec < point.visible_sec
      ) {
        continue;
      }

      let angle = point.target_angle;
      if (!force_final) {
        const live_age_sec = Math.max(0, time_sec - point.birth_sec);
        const live_angle = runtime.spawn_angle_rad - point.speed_rad_per_sec * live_age_sec;
        const capture_duration_sec = Math.max(0.0001, runtime.dot_end_sec - point.capture_start_sec);
        const raw_capture_u = clamp(
          (time_sec - point.capture_start_sec) / capture_duration_sec,
          0,
          1
        );
        const capture_u = raw_capture_u * raw_capture_u * (3 - 2 * raw_capture_u);
        const delta_angle = wrap_positive(live_angle - point.target_angle, TAU);
        angle = live_angle - delta_angle * capture_u;
      }

      const point_x = point.center_x_px + Math.cos(angle) * point.radius;
      const point_y = point.center_y_px + Math.sin(angle) * point.radius;

      let point_alpha = config.point_style.alpha;
      if (!force_final && alpha_ramp_duration_sec > 0) {
        const alpha_start_sec = Math.max(point.birth_sec, point.visible_sec);
        const alpha_u = smoothstep(
          alpha_start_sec,
          alpha_start_sec + alpha_ramp_duration_sec,
          time_sec
        );
        point_alpha *= alpha_u;
      }

      if (point_alpha <= 0) {
        continue;
      }

      runtime.layers.points.push(
        point_x,
        point_y,
        point.radius_px * 2,
        point.radius_px * 2,
        point_alpha
      );
    }
  }

  function push_post_finale_points(field_state) {
    for (let point_index = 0; point_index < field_state.points.length; point_index += 1) {
      const point = field_state.points[point_index];
      const point_alpha = config.point_style.alpha * point.alpha;
      if (point_alpha <= 0 || point.radius_px <= 0) {
        continue;
      }

      runtime.layers.points.push(
        point.x,
        point.y,
        point.radius_px * 2,
        point.radius_px * 2,
        point_alpha
      );
    }
  }

  function get_world_ray_circle_segment(
    ray_origin_x,
    ray_origin_y,
    angle,
    circle_center_x,
    circle_center_y,
    radius_px,
    ray_start_radius,
    ray_end_radius
  ) {
    const dir_x = Math.cos(angle);
    const dir_y = Math.sin(angle);
    const relative_center_x = circle_center_x - ray_origin_x;
    const relative_center_y = circle_center_y - ray_origin_y;
    const projection = dir_x * relative_center_x + dir_y * relative_center_y;
    const center_distance_sq =
      relative_center_x * relative_center_x + relative_center_y * relative_center_y;
    const discriminant = projection * projection - (center_distance_sq - radius_px * radius_px);

    if (discriminant <= 0) {
      return null;
    }

    const root = Math.sqrt(discriminant);
    const entry_radius = projection - root;
    const exit_radius = projection + root;
    const start_radius = Math.max(ray_start_radius, Math.min(entry_radius, exit_radius));
    const end_radius = Math.min(ray_end_radius, Math.max(entry_radius, exit_radius));

    if (end_radius <= start_radius) {
      return null;
    }

    return {
      start_x: ray_origin_x + dir_x * start_radius,
      start_y: ray_origin_y + dir_y * start_radius,
      end_x: ray_origin_x + dir_x * end_radius,
      end_y: ray_origin_y + dir_y * end_radius
    };
  }

  function get_phase_end_alpha(angle_rad) {
    void angle_rad;
    return 1;
  }

  function get_fold_seam_alpha(angle_rad) {
    const base_angle_rad = radians(config.generator_wrangle.base_angle_deg) +
      radians(config.composition.global_rotation_deg || 0);
    const display_u = wrap_positive(angle_rad - base_angle_rad, TAU) / TAU;
    const seam_display_u = 0.5;
    if (display_u <= seam_display_u) {
      return 1;
    }

    const fade_width_u = 3.5 / Math.max(1, Number(config.generator_wrangle.spoke_count || 1));
    return smoothstep(0, fade_width_u, display_u - seam_display_u);
  }

  function get_spoke_width_scale(spoke) {
    const phase_start_scale = clamp(config.spoke_lines.phase_start_scale ?? 1, 0.01, 1);
    return lerp(phase_start_scale, 1, clamp(spoke.width_phase_u ?? spoke.phase_u ?? 1, 0, 1));
  }

  function get_reveal_local_alpha(local_x, local_y, reveal_state) {
    if (!reveal_state) {
      return 1;
    }

    const radius = Math.hypot(local_x, local_y);
    if (radius < reveal_state.inner_radius_px - 0.01 || radius > reveal_state.outer_radius_px + 0.01) {
      return 0;
    }

    if (reveal_state.force_final || reveal_state.halo_u >= 0.999) {
      return 1;
    }

    if (reveal_state.halo_u <= 0) {
      return 0;
    }

    const point_angle = Math.atan2(local_y, local_x);
    const sweep_distance = wrap_positive(reveal_state.start_angle_rad - point_angle, TAU);
    const sweep_limit = TAU * reveal_state.halo_u;
    const reveal_softness_rad = TAU * 0.45 / Math.max(1, Number(config.generator_wrangle.spoke_count || 1));
    return 1 - smoothstep(sweep_limit, sweep_limit + reveal_softness_rad, sweep_distance);
  }

  function get_spoke_reveal_alpha(local_x, local_y, reveal_state) {
    if (!reveal_state) {
      return 1;
    }

    const radius = Math.hypot(local_x, local_y);
    if (radius < reveal_state.inner_radius_px - 0.01 || radius > reveal_state.outer_radius_px + 0.01) {
      return 0;
    }

    if (reveal_state.force_final || reveal_state.halo_u >= 0.999) {
      return 1;
    }

    if (reveal_state.halo_u <= 0) {
      return 0;
    }

    const point_angle = Math.atan2(local_y, local_x);
    const sweep_distance = wrap_positive(reveal_state.start_angle_rad - point_angle, TAU);
    const sweep_limit = TAU * reveal_state.halo_u;
    return sweep_distance <= sweep_limit ? 1 : 0;
  }

  function get_echo_style() {
    const echo_style = typeof config.spoke_lines.echo_style === "string"
      ? config.spoke_lines.echo_style
      : "dots";

    switch (echo_style) {
      case "plus":
      case "triangles":
      case "mixed":
      case "ubuntu_releases":
      case "dots":
        return echo_style;
      default:
        return "dots";
    }
  }

  function get_echo_color() {
    return config.spoke_lines.echo_color || config.spoke_lines.color;
  }

  function get_echo_marker_variant(echo_style, spoke_seed, marker_seed) {
    if (echo_style === "plus" || echo_style === "triangles" || echo_style === "ubuntu_releases") {
      return echo_style;
    }

    if (echo_style !== "mixed") {
      return "dots";
    }

    const replace_pct = clamp(config.spoke_lines.echo_mix_shape_pct ?? 0.35, 0, 1);
    if (hash_01(spoke_seed + 0.137, marker_seed + 0.271) >= replace_pct) {
      return "dots";
    }

    return hash_01(spoke_seed + 5.173, marker_seed + 8.411) < 0.5
      ? "plus"
      : "triangles";
  }

  function push_plus_marker(center_x, center_y, size_px, width_px, alpha) {
    const half_size = size_px * 0.5;
    runtime.layers.haloEchoMarks.push(
      center_x - half_size,
      center_y,
      center_x + half_size,
      center_y,
      width_px,
      alpha
    );
    runtime.layers.haloEchoMarks.push(
      center_x,
      center_y - half_size,
      center_x,
      center_y + half_size,
      width_px,
      alpha
    );
  }

  function push_triangle_marker(center_x, center_y, side_px, width_px, alpha, tip_angle_rad) {
    const circumradius_px = side_px / Math.sqrt(3);
    const base_center_offset_px = side_px / (2 * Math.sqrt(3));
    const dir_x = Math.cos(tip_angle_rad);
    const dir_y = Math.sin(tip_angle_rad);
    const perp_x = -dir_y;
    const perp_y = dir_x;
    const tip_x = center_x + dir_x * circumradius_px;
    const tip_y = center_y + dir_y * circumradius_px;
    const base_center_x = center_x - dir_x * base_center_offset_px;
    const base_center_y = center_y - dir_y * base_center_offset_px;
    const left_x = base_center_x + perp_x * side_px * 0.5;
    const left_y = base_center_y + perp_y * side_px * 0.5;
    const right_x = base_center_x - perp_x * side_px * 0.5;
    const right_y = base_center_y - perp_y * side_px * 0.5;

    runtime.layers.haloEchoMarks.push(tip_x, tip_y, left_x, left_y, width_px, alpha);
    runtime.layers.haloEchoMarks.push(left_x, left_y, right_x, right_y, width_px, alpha);
    runtime.layers.haloEchoMarks.push(right_x, right_y, tip_x, tip_y, width_px, alpha);
  }

  function draw_ubuntu_release_overlay({
    spokes,
    box,
    base_alpha,
    reveal_state
  }) {
    if (
      !text_overlay_context ||
      !text_overlay_canvas ||
      !box ||
      base_alpha <= 0 ||
      get_echo_style() !== "ubuntu_releases"
    ) {
      return;
    }

    const field_center_x = config.composition.center_x_px;
    const field_center_y = config.composition.center_y_px;
    const font_size_px = Math.max(
      ECHO_TEXT_BASE_FONT_SIZE_PX,
      Math.round(ECHO_TEXT_BASE_FONT_SIZE_PX * Math.min(stage_width_px, stage_height_px) / 1080)
    );
    const label_radius_px = Math.max(
      0,
      Math.min(stage_width_px, stage_height_px) * 0.5 - font_size_px
    );
    const label_count = UBUNTU_RELEASE_LABELS.length;

    text_overlay_context.save();
    text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
    text_overlay_context.fillStyle = get_echo_color();
    text_overlay_context.font =
      `${font_size_px}px "Ubuntu Sans", Ubuntu, "DejaVu Sans", sans-serif`;

    for (let spoke_index = 0; spoke_index < spokes.length; spoke_index += 1) {
      const spoke = spokes[spoke_index];
      if (spoke.seam_overlay_only) {
        continue;
      }

      const phase_end_alpha = get_phase_end_alpha(spoke.angle);
      const fold_seam_alpha = get_fold_seam_alpha(spoke.angle);
      const spoke_alpha =
        base_alpha * phase_end_alpha * fold_seam_alpha * clamp(spoke.alpha ?? 1, 0, 1);
      if (spoke_alpha <= 0) {
        continue;
      }

      const world_x = field_center_x + Math.cos(spoke.angle) * label_radius_px;
      const world_y = field_center_y + Math.sin(spoke.angle) * label_radius_px;
      const local_x = world_x - box.center_x_px;
      const local_y = world_y - box.center_y_px;
      const reveal_alpha = get_reveal_local_alpha(local_x, local_y, reveal_state);
      if (reveal_alpha <= 0) {
        continue;
      }

      const canvas_x = world_x;
      const canvas_y = stage_height_px - world_y;
      const label_index = (spoke.source_spoke_id ?? spoke_index) % label_count;
      const label = UBUNTU_RELEASE_LABELS[label_index];
      text_overlay_context.save();
      text_overlay_context.translate(canvas_x, canvas_y);
      text_overlay_context.globalAlpha = spoke_alpha * reveal_alpha;
      text_overlay_context.fillText(label, 0, 0);
      text_overlay_context.restore();
    }

    text_overlay_context.restore();
  }

  function set_reference_halo_visibility(box, base_alpha, reveal_state) {
    const should_show =
      Boolean(config.spoke_lines.show_reference_halo) &&
      Boolean(runtime.mascot_halo_texture) &&
      Boolean(box) &&
      base_alpha > 0;

    halo_reference_mesh.visible = should_show;
    if (!should_show) {
      return;
    }

    const reveal_amount = reveal_state ? clamp(reveal_state.halo_u, 0, 1) : 1;
    halo_reference_mesh.position.set(0, 0, 0);
    halo_reference_mesh.scale.set(box.draw_size_px, box.draw_size_px, 1);
    halo_reference_material.opacity = base_alpha * HALO_REFERENCE_OPACITY * reveal_amount;
  }

  function update_mascot(playback_time_sec, force_final, box) {
    if (!config.mascot.enabled || !runtime.mascot_face_texture || !box) {
      mascot_group.visible = false;
      face_mesh.visible = false;
      halo_reference_mesh.visible = false;
      nose_mesh.visible = false;
      nose_cutout_mesh.visible = false;
      return {
        base_alpha: 0,
        halo_u: 0
      };
    }

    const fade_amount = force_final ? 1 : compute_mascot_fade_amount(playback_time_sec);
    const base_alpha = clamp(config.mascot.opacity * fade_amount, 0, 1);

    mascot_group.visible = true;
    mascot_group.position.set(box.center_x_px, box.center_y_px, 0);
    mascot_group.rotation.z = radians(force_final ? 0 : compute_head_turn_deg(playback_time_sec));

    face_mesh.visible = base_alpha > 0;
    face_mesh.position.set(0, 0, 0);
    face_mesh.scale.set(box.draw_size_px, box.draw_size_px, 1);
    face_material.opacity = base_alpha;

    if (base_alpha <= 0) {
      halo_reference_mesh.visible = false;
      nose_mesh.visible = false;
      nose_cutout_mesh.visible = false;
      return {
        base_alpha: 0,
        halo_u: 0
      };
    }

    const blink_amount = force_final ? 0 : compute_blink_amount(playback_time_sec);
    const head_turn_eye_amount = force_final
      ? 0
      : compute_head_turn_eye_squint_amount(playback_time_sec);
    const combined_eye_amount = Math.max(blink_amount, head_turn_eye_amount);
    const nose_bob_px = config.sneeze.enabled
      ? config.sneeze.nose_bob_up_px * combined_eye_amount
      : 0;
    const closed_eye_scale_y = clamp(config.blink.eye_scale_y_closed, 0.02, 1);
    const eye_scale_y = lerp(1, closed_eye_scale_y, combined_eye_amount);

    nose_mesh.visible = true;
    nose_mesh.position.set(0, 0, 0);
    nose_mesh.scale.set(box.draw_size_px, box.draw_size_px, 1);
    nose_material.opacity = base_alpha;

    nose_cutout_mesh.visible = true;
    nose_cutout_mesh.position.set(0, nose_bob_px, 0);
    nose_cutout_mesh.scale.set(box.draw_size_px, box.draw_size_px, 1);
    nose_cutout_material.opacity = base_alpha;

    for (let eye_index = 0; eye_index < MASCOT_EYE_SPECS.length; eye_index += 1) {
      const eye = MASCOT_EYE_SPECS[eye_index];
      const local_center_x = box.draw_size_px * (eye.cx / MASCOT_VIEWBOX_SIZE - 0.5);
      const local_center_y = box.draw_size_px * (0.5 - eye.cy / MASCOT_VIEWBOX_SIZE);
      const radius_x_px = box.draw_size_px * (eye.radius / MASCOT_VIEWBOX_SIZE);
      const radius_y_px = Math.max(0.75, radius_x_px * eye_scale_y);

      runtime.layers.eyes.push(
        local_center_x,
        local_center_y,
        radius_x_px * 2,
        radius_y_px * 2,
        base_alpha
      );
    }

    return {
      base_alpha,
      halo_u: compute_finale_progress(playback_time_sec, force_final).halo_u
    };
  }

  function get_halo_reveal_state(
    playback_time_sec,
    force_final,
    box,
    full_frame_outer_radius_px,
    halo_u
  ) {
    if (!box) {
      return null;
    }

    return {
      force_final,
      halo_u,
      start_angle_rad:
        radians((config.finale.start_angle_deg || 0) + (config.finale.mask_angle_offset_deg || 0)) +
        radians(config.composition.global_rotation_deg || 0),
      inner_radius_px: box.draw_size_px * clamp(config.finale.halo_inner_radius_u, 0.01, 0.5),
      outer_radius_px: full_frame_outer_radius_px
    };
  }

  function push_halo_layers({
    spokes,
    box,
    halo_outer_radius_px,
    full_frame_outer_radius_px,
    base_alpha,
    reveal_state
  }) {
    if (!box || base_alpha <= 0) {
      halo_reference_mesh.visible = false;
      return;
    }

    set_reference_halo_visibility(box, base_alpha, reveal_state);

    const field_center_x = config.composition.center_x_px;
    const field_center_y = config.composition.center_y_px;
    const outer_width_px = Math.max(0, config.spoke_lines.width_px || 0);
    const inner_width_px = Math.max(0, config.spoke_lines.inner_width_px || 0);
    const echo_count = Math.max(0, Math.round(config.spoke_lines.echo_count || 0));
    const echo_dot_scale_mult = clamp(config.spoke_lines.echo_width_mult ?? 1, 0.01, 1);
    const echo_wave_count = Math.max(0, Number(config.spoke_lines.echo_wave_count || 0));
    const echo_fade_mult = clamp(config.spoke_lines.echo_opacity_mult ?? 1, 0, 1);
    const echo_style = get_echo_style();
    const echo_marker_width_px = Math.max(0.5, outer_width_px);
    const ripple_min_scale = 0.45;
    const ripple_max_scale = 1.55;
    const ripple_fade_start_u = lerp(0.2, 0.85, echo_fade_mult);

    for (let spoke_index = 0; spoke_index < spokes.length; spoke_index += 1) {
      const spoke = spokes[spoke_index];
      const phase_end_alpha = get_phase_end_alpha(spoke.angle);
      const fold_seam_alpha = get_fold_seam_alpha(spoke.angle);
      const spoke_alpha =
        base_alpha * phase_end_alpha * fold_seam_alpha * clamp(spoke.alpha ?? 1, 0, 1);
      if (spoke_alpha <= 0) {
        continue;
      }

      const world_start_x = field_center_x + Math.cos(spoke.angle) * spoke.start_radius;
      const world_start_y = field_center_y + Math.sin(spoke.angle) * spoke.start_radius;
      const world_halo_end_x = field_center_x + Math.cos(spoke.angle) * halo_outer_radius_px;
      const world_halo_end_y = field_center_y + Math.sin(spoke.angle) * halo_outer_radius_px;

      const local_start_x = world_start_x - box.center_x_px;
      const local_start_y = world_start_y - box.center_y_px;
      const local_halo_end_x = world_halo_end_x - box.center_x_px;
      const local_halo_end_y = world_halo_end_y - box.center_y_px;

      if (!spoke.seam_overlay_only && outer_width_px > 0) {
        const midpoint_x = (local_start_x + local_halo_end_x) * 0.5;
        const midpoint_y = (local_start_y + local_halo_end_y) * 0.5;
        const reveal_alpha = get_spoke_reveal_alpha(midpoint_x, midpoint_y, reveal_state);
        if (reveal_alpha > 0) {
          runtime.layers.haloThinSpokes.push(
            local_start_x,
            local_start_y,
            local_halo_end_x,
            local_halo_end_y,
            outer_width_px,
            spoke_alpha * reveal_alpha
          );
        }
      }

      if (inner_width_px <= 0) {
        continue;
      }

      const segment = get_world_ray_circle_segment(
        field_center_x,
        field_center_y,
        spoke.angle,
        spoke.inner_clip_center_x_px,
        spoke.inner_clip_center_y_px,
        spoke.inner_clip_radius_px,
        spoke.start_radius,
        full_frame_outer_radius_px
      );

      if (segment) {
        const local_segment_start_x = segment.start_x - box.center_x_px;
        const local_segment_start_y = segment.start_y - box.center_y_px;
        const local_segment_end_x = segment.end_x - box.center_x_px;
        const local_segment_end_y = segment.end_y - box.center_y_px;
        const midpoint_x = (local_segment_start_x + local_segment_end_x) * 0.5;
        const midpoint_y = (local_segment_start_y + local_segment_end_y) * 0.5;

        const reveal_alpha = get_spoke_reveal_alpha(midpoint_x, midpoint_y, reveal_state);
        if (reveal_alpha > 0) {
          runtime.layers.haloThickSpokes.push(
            local_segment_start_x,
            local_segment_start_y,
            local_segment_end_x,
            local_segment_end_y,
            inner_width_px * get_spoke_width_scale(spoke),
            spoke_alpha * reveal_alpha
          );
        }
      }

      const dot_templates = spoke.echo_dots;
      const orbit_step_px = spoke.echo_dot_step_px;
      if (
        spoke.seam_overlay_only ||
        !dot_templates.length ||
        orbit_step_px <= 0 ||
        (echo_style !== "ubuntu_releases" && echo_count <= 0) ||
        spoke.inner_clip_offset_px <= 0
      ) {
        continue;
      }

      if (echo_style === "ubuntu_releases") {
        continue;
      }

      const clip_center_local_x = spoke.inner_clip_center_x_px - box.center_x_px;
      const clip_center_local_y = spoke.inner_clip_center_y_px - box.center_y_px;
      const max_orbit_index = Math.ceil(
        (full_frame_outer_radius_px - spoke.echo_dot_origin_radius) / orbit_step_px
      );
      const ripple_span_px = Math.max(
        1,
        full_frame_outer_radius_px - spoke.echo_dot_origin_radius
      );

      for (let orbit_index = 0; orbit_index <= max_orbit_index; orbit_index += 1) {
        const template_dot = dot_templates[Math.min(orbit_index, dot_templates.length - 1)];
        const dot_radius = spoke.echo_dot_origin_radius + orbit_index * orbit_step_px;
        const world_dot_x = field_center_x + Math.cos(spoke.angle) * dot_radius;
        const world_dot_y = field_center_y + Math.sin(spoke.angle) * dot_radius;
        const local_dot_x = world_dot_x - box.center_x_px;
        const local_dot_y = world_dot_y - box.center_y_px;
        const clip_distance = Math.hypot(
          local_dot_x - clip_center_local_x,
          local_dot_y - clip_center_local_y
        );

        if (clip_distance <= spoke.inner_clip_radius_px + 0.01) {
          continue;
        }

        const echo_index = Math.ceil(
          (clip_distance - spoke.inner_clip_radius_px) / spoke.inner_clip_offset_px
        );
        if (echo_index < 1 || echo_index > echo_count) {
          continue;
        }

        const reveal_alpha = get_reveal_local_alpha(local_dot_x, local_dot_y, reveal_state);
        if (reveal_alpha <= 0) {
          continue;
        }

        const ripple_u = clamp(
          (dot_radius - spoke.echo_dot_origin_radius) / ripple_span_px,
          0,
          1
        );
        const ripple_phase = ripple_u * echo_wave_count * TAU;
        const ripple_scale = echo_wave_count > 0
          ? lerp(
            ripple_min_scale,
            ripple_max_scale,
            0.5 + 0.5 * Math.cos(ripple_phase)
          )
          : 1;
        const capped_scale_mult = Math.min(1, Math.pow(echo_dot_scale_mult, echo_index) * ripple_scale);
        const dot_radius_px = template_dot.radius_px * capped_scale_mult;
        if (dot_radius_px <= 0) {
          continue;
        }

        const dot_alpha =
          spoke_alpha *
          reveal_alpha *
          (1 - smoothstep(ripple_fade_start_u, 1, ripple_u));
        if (dot_alpha <= 0) {
          continue;
        }

        // Marker shape choice must stay stable across reveal/post-finale handoffs.
        // Seed it from source spoke identity plus radial orbit index, not from
        // the current clip-derived echo rank, which can shift when mask geometry changes.
        const echo_marker_variant = get_echo_marker_variant(
          echo_style,
          spoke.source_spoke_id ?? spoke_index,
          orbit_index
        );
        let marker_outer_extent_px = dot_radius_px;
        let plus_size_px = 0;
        let triangle_side_px = 0;

        if (echo_marker_variant === "plus") {
          plus_size_px =
            ECHO_PLUS_SIZE_PX *
            clamp(dot_radius_px / Math.max(0.0001, template_dot.radius_px), 0.25, 4);
          marker_outer_extent_px = plus_size_px * 0.5 + echo_marker_width_px * 0.5;
        } else if (echo_marker_variant === "triangles") {
          triangle_side_px = Math.max(6.4, dot_radius_px * 3.2);
          marker_outer_extent_px =
            triangle_side_px / Math.sqrt(3) + echo_marker_width_px * 0.5;
        }

        if (dot_radius - marker_outer_extent_px <= halo_outer_radius_px + 0.01) {
          continue;
        }

        if (echo_marker_variant === "plus") {
          push_plus_marker(local_dot_x, local_dot_y, plus_size_px, echo_marker_width_px, dot_alpha);
          continue;
        }

        if (echo_marker_variant === "triangles") {
          push_triangle_marker(
            local_dot_x,
            local_dot_y,
            triangle_side_px,
            echo_marker_width_px,
            dot_alpha,
            spoke.angle + Math.PI
          );
          continue;
        }

        runtime.layers.haloEchoDots.push(
          local_dot_x,
          local_dot_y,
          dot_radius_px * 2,
          dot_radius_px * 2,
          dot_alpha
        );
      }
    }

    draw_ubuntu_release_overlay({
      spokes,
      box,
      base_alpha,
      reveal_state
    });
  }

  function render_scene(time_sec, options = {}) {
    ensure_layers();
    clear_layers();
    update_layer_colors();

    const force_dot_final = Boolean(options.force_dot_final);
    const force_mascot_final = Boolean(options.force_mascot_final);
    const playback_time_sec = options.playback_time_sec ?? time_sec;
    const use_dynamic_post_finale_field = is_post_finale_dynamic_field_active(playback_time_sec);

    if (use_dynamic_post_finale_field) {
      const field_state = build_post_finale_field_state(playback_time_sec);
      const mascot_state = update_mascot(playback_time_sec, true, field_state.box);
      const reveal_state = get_halo_reveal_state(
        playback_time_sec,
        true,
        field_state.box,
        field_state.full_frame_outer_radius_px,
        mascot_state.halo_u
      );

      push_background_spokes(field_state.spokes, field_state.full_frame_outer_radius_px);
      push_post_finale_points(field_state);
      push_halo_layers({
        spokes: field_state.spokes,
        box: field_state.box,
        halo_outer_radius_px: field_state.halo_outer_radius_px,
        full_frame_outer_radius_px: field_state.full_frame_outer_radius_px,
        base_alpha: mascot_state.base_alpha,
        reveal_state
      });
      push_phase_debug_overlay(field_state.box);
      finalize_layers();
      renderer.render(scene, camera);
      return;
    }

    reset_spoke_width_transition_state();

    const full_frame_outer_radius_px = get_full_frame_spoke_outer_radius(
      config.composition.center_x_px,
      config.composition.center_y_px
    );
    const mascot_state = update_mascot(
      playback_time_sec,
      force_mascot_final,
      runtime.mascot_box
    );
    const reveal_state = get_halo_reveal_state(
      playback_time_sec,
      force_mascot_final,
      runtime.mascot_box,
      full_frame_outer_radius_px,
      mascot_state.halo_u
    );

    push_background_spokes(runtime.spokes, full_frame_outer_radius_px);
    push_intro_points(time_sec, force_dot_final);
    push_halo_layers({
      spokes: runtime.spokes,
      box: runtime.mascot_box,
      halo_outer_radius_px: runtime.mascot_box ? runtime.mascot_box.draw_size_px * 0.5 : 0,
      full_frame_outer_radius_px,
      base_alpha: mascot_state.base_alpha,
      reveal_state
    });
    push_phase_debug_overlay(runtime.mascot_box);

    finalize_layers();
    renderer.render(scene, camera);
  }

  function render_playback_frame(playback_time_sec) {
    const effective_playback_time_sec = Math.max(0, playback_time_sec);
    const dot_time_sec = Math.min(effective_playback_time_sec, runtime.dot_end_sec);
    const is_dot_animation_complete = effective_playback_time_sec >= runtime.dot_end_sec;
    const is_playback_complete = effective_playback_time_sec >= runtime.playback_end_sec;
    runtime.playback_time_sec = effective_playback_time_sec;

    render_scene(dot_time_sec, {
      force_dot_final: is_dot_animation_complete,
      force_mascot_final: is_playback_complete,
      playback_time_sec: effective_playback_time_sec
    });

    return {
      playback_time_sec: effective_playback_time_sec,
      is_playback_complete
    };
  }

  function render_current_frame(now_ms = performance.now(), skip_schedule = false) {
    const elapsed_sec = Math.max(0, (now_ms - runtime.animation_start_ms) / 1000);
    const { is_playback_complete } = render_playback_frame(elapsed_sec);
    const should_keep_running = !is_playback_complete || has_post_finale_field_motion();

    if (!skip_schedule && should_keep_running) {
      runtime.animation_frame_id = requestAnimationFrame((frame_now_ms) => {
        render_current_frame(frame_now_ms, false);
      });
    } else if (!skip_schedule) {
      stop_animation();
    }
  }

  function stop_animation() {
    if (runtime.animation_frame_id) {
      cancelAnimationFrame(runtime.animation_frame_id);
      runtime.animation_frame_id = 0;
    }
  }

  function push_circle_outline(layer, center_x, center_y, radius_px, width_px, alpha) {
    if (radius_px <= 0 || alpha <= 0 || width_px <= 0) {
      return;
    }

    for (let segment_index = 0; segment_index < DEBUG_MASK_SEGMENT_COUNT; segment_index += 1) {
      const start_angle = TAU * segment_index / DEBUG_MASK_SEGMENT_COUNT;
      const end_angle = TAU * (segment_index + 1) / DEBUG_MASK_SEGMENT_COUNT;
      layer.push(
        center_x + Math.cos(start_angle) * radius_px,
        center_y + Math.sin(start_angle) * radius_px,
        center_x + Math.cos(end_angle) * radius_px,
        center_y + Math.sin(end_angle) * radius_px,
        width_px,
        alpha
      );
    }
  }

  function push_crosshair(layer, center_x, center_y, half_size_px, width_px, alpha) {
    if (half_size_px <= 0 || alpha <= 0 || width_px <= 0) {
      return;
    }

    layer.push(
      center_x - half_size_px,
      center_y,
      center_x + half_size_px,
      center_y,
      width_px,
      alpha
    );
    layer.push(
      center_x,
      center_y - half_size_px,
      center_x,
      center_y + half_size_px,
      width_px,
      alpha
    );
  }

  function push_phase_debug_overlay(box) {
    if (!config.spoke_lines.show_debug_masks) {
      return;
    }

    const phase_mask = get_phase_mask_geometry({
      box,
      center_x_px: config.composition.center_x_px,
      center_y_px: config.composition.center_y_px
    });
    const boundary_width_px = 2;
    const mask_width_px = 1.5;
    const crosshair_half_size_px = Math.max(10, phase_mask.center_offset_x_px * 0.16);

    runtime.layers.debugBoundary.push(
      0,
      phase_mask.center_y_px,
      stage_width_px,
      phase_mask.center_y_px,
      boundary_width_px,
      0.9
    );

    push_circle_outline(
      runtime.layers.debugMasks,
      phase_mask.left_center_x_px,
      phase_mask.center_y_px,
      phase_mask.radius_px,
      mask_width_px,
      0.78
    );
    push_circle_outline(
      runtime.layers.debugMasks,
      phase_mask.right_center_x_px,
      phase_mask.center_y_px,
      phase_mask.radius_px,
      mask_width_px,
      0.78
    );

    push_crosshair(
      runtime.layers.debugMasks,
      phase_mask.left_center_x_px,
      phase_mask.center_y_px,
      crosshair_half_size_px,
      mask_width_px,
      0.92
    );
    push_crosshair(
      runtime.layers.debugMasks,
      phase_mask.right_center_x_px,
      phase_mask.center_y_px,
      crosshair_half_size_px,
      mask_width_px,
      0.92
    );
  }

  function toggle_pause() {
    if (runtime.is_paused) {
      runtime.is_paused = false;
      runtime.animation_start_ms += performance.now() - runtime.pause_time_ms;
      runtime.animation_frame_id = requestAnimationFrame((frame_now_ms) => {
        render_current_frame(frame_now_ms, false);
      });
      return;
    }

    runtime.is_paused = true;
    runtime.pause_time_ms = performance.now();
    if (runtime.animation_frame_id) {
      cancelAnimationFrame(runtime.animation_frame_id);
      runtime.animation_frame_id = 0;
    }
  }

  function start_animation() {
    runtime.is_paused = false;
    stop_animation();
    reset_spoke_width_transition_state();
    runtime.animation_start_ms = performance.now();
    runtime.animation_frame_id = requestAnimationFrame((frame_now_ms) => {
      render_current_frame(frame_now_ms, false);
    });
  }

  function get_current_playback_time_sec(now_ms = performance.now()) {
    if (runtime.animation_frame_id) {
      const elapsed_sec = Math.max(0, (now_ms - runtime.animation_start_ms) / 1000);
      return has_post_finale_field_motion()
        ? elapsed_sec
        : clamp(elapsed_sec, 0, runtime.playback_end_sec);
    }

    return has_post_finale_field_motion()
      ? Math.max(0, runtime.playback_time_sec)
      : clamp(runtime.playback_time_sec, 0, runtime.playback_end_sec);
  }

  function resize_canvas(playback_time_sec = runtime.playback_time_sec, rebuild_scene = true) {
    renderer.setPixelRatio(get_render_pixel_ratio());
    renderer.setSize(stage_width_px, stage_height_px, false);
    renderer.setViewport(0, 0, stage_width_px, stage_height_px);
    camera.left = 0;
    camera.right = stage_width_px;
    camera.top = stage_height_px;
    camera.bottom = 0;
    camera.updateProjectionMatrix();

    runtime.dpr = get_render_pixel_ratio();
    configure_text_overlay_canvas();

    if (rebuild_scene) {
      build_scene_data();
    }

    render_playback_frame(playback_time_sec);
  }

  function handle_viewport_resize() {
    apply_stage_styles();
    render_playback_frame(get_current_playback_time_sec());
  }

  async function refresh_scene(options = {}) {
    const refresh_id = ++runtime.refresh_serial;
    const preserved_playback_time_sec = options.playback_time_sec ?? get_current_playback_time_sec();
    const restart_animation = options.restart_animation !== false;
    const rebuild_scene = options.rebuild_scene !== false;
    const invalidate_layers = options.invalidate_layers !== false;

    stop_animation();
    apply_stage_styles();

    if (!config.mascot.enabled) {
      clear_mascot_textures();
      runtime.mascot_box = null;
      invalidate_layer_caches();
    } else if (
      options.reload_mascot ||
      !runtime.mascot_face_texture ||
      !runtime.mascot_halo_texture
    ) {
      await load_mascot_textures();
      if (refresh_id !== runtime.refresh_serial) {
        return;
      }
    } else if (invalidate_layers) {
      invalidate_layer_caches();
    }

    if (rebuild_scene) {
      resize_canvas(restart_animation ? 0 : preserved_playback_time_sec, true);
    } else {
      render_playback_frame(restart_animation ? 0 : preserved_playback_time_sec);
    }

    if (restart_animation) {
      start_animation();
    }
  }

  function canvas_to_blob(type = "image/png") {
    return new Promise((resolve, reject) => {
      if (
        export_canvas.width !== stage_width_px ||
        export_canvas.height !== stage_height_px
      ) {
        export_canvas.width = stage_width_px;
        export_canvas.height = stage_height_px;
      }

      const export_context = export_canvas.getContext("2d", { alpha: false });
      if (!export_context) {
        reject(new Error("Export canvas 2D context is unavailable."));
        return;
      }

      export_context.clearRect(0, 0, export_canvas.width, export_canvas.height);
      export_context.drawImage(canvas, 0, 0, export_canvas.width, export_canvas.height);
      if (text_overlay_canvas) {
        export_context.drawImage(
          text_overlay_canvas,
          0,
          0,
          export_canvas.width,
          export_canvas.height
        );
      }

      const source_canvas = export_canvas;

      if (!source_canvas) {
        return;
      }

      source_canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Canvas export failed."));
      }, type);
    });
  }

  return {
    applyStageStyles: apply_stage_styles,
    canvasToBlob: canvas_to_blob,
    getCurrentPlaybackTimeSec: get_current_playback_time_sec,
    getOutputProfileKey() {
      return current_output_profile_key;
    },
    getPlaybackEndSec() {
      return runtime.playback_end_sec;
    },
    handleViewportResize: handle_viewport_resize,
    invalidateLayerCaches: invalidate_layer_caches,
    refreshScene: refresh_scene,
    renderCurrentFrame: render_current_frame,
    renderPlaybackFrame: render_playback_frame,
    setOutputProfile: set_output_profile,
    startAnimation: start_animation,
    stopAnimation: stop_animation,
    togglePause: toggle_pause,
    isPaused: () => runtime.is_paused
  };
}
