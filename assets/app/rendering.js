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
  hash_01
} from "./config-schema.js";
import {
  build_intro_halo_field_state,
  build_post_finale_halo_field_state,
  get_phase_mask_geometry
} from "./halo-field.js";
import { createCircleLayer, createSegmentLayer } from "./three-primitives.js";

const WORLD_BACKGROUND_ORDER = 10;
const SAFE_AREA_FILL_ORDER = 15;
const SAFE_AREA_FILL_OVERLAY_ORDER = 50;
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
const ECHO_MARKER_HALO_GAP_PX = 16;
const TEXT_LABEL_MARGIN_PX = 16;
const ECHO_TEXT_BASE_FONT_SIZE_PX = 6;
const TEXT_LABEL_WIDTH_CACHE = new Map();
const TEXT_LABEL_MEASURE_CACHE = new Map();
const TEXT_LABEL_FONT_FAMILY = "\"Ubuntu Sans\", Ubuntu, sans-serif";
const LINKED_TITLE_BASE_FONT_SIZE_PX = 63;
const OVERLAY_GRID_COLOR = "rgba(255,0,0,0.2)";
const OVERLAY_COMPOSITION_COLOR = "rgba(0,255,255,0.2)";
const OVERLAY_CONTENT_FIELD_ALIASES = Object.freeze({
  generic_social: Object.freeze({
    text_1: Object.freeze(["text_1", "headline", "kicker", "body_top"]),
    text_2: Object.freeze(["text_2", "footer_1", "date_line", "body_mid"]),
    text_3: Object.freeze(["text_3", "footer_2", "summary", "body_bottom"])
  }),
  speaker_highlight: Object.freeze({
    text_1: Object.freeze(["session_title", "title", "headline", "text_1"]),
    text_2: Object.freeze(["speaker_name", "name", "speaker", "text_2"]),
    text_3: Object.freeze(["speaker_role", "role", "speaker_title", "text_3"])
  })
});
const UBUNTU_RELEASE_LABELS = Object.freeze([
  "26.04 Resolute Raccoon",
  "25.10 Questing Quokka",
  "25.04 Plucky Puffin",
  "24.10 Oracular Oriole",
  "24.04 Noble Numbat",
  "23.10 Mantic Minotaur",
  "23.04 Lunar Lobster",
  "22.10 Kinetic Kudu",
  "22.04 Jammy Jellyfish",
  "21.10 Impish Indri",
  "21.04 Hirsute Hippo",
  "20.10 Groovy Gorilla",
  "20.04 Focal Fossa",
  "19.10 Eoan Ermine",
  "19.04 Disco Dingo",
  "18.10 Cosmic Cuttlefish",
  "18.04 Bionic Beaver",
  "17.10 Artful Aardvark",
  "17.04 Zesty Zapus",
  "16.10 Yakkety Yak",
  "16.04 Xenial Xerus",
  "15.10 Wily Werewolf",
  "15.04 Vivid Vervet",
  "14.10 Utopic Unicorn",
  "14.04 Trusty Tahr",
  "13.10 Saucy Salamander",
  "13.04 Raring Ringtail",
  "12.10 Quantal Quetzal",
  "12.04 Precise Pangolin",
  "11.10 Oneiric Ocelot",
  "11.04 Natty Narwhal",
  "10.10 Maverick Meerkat",
  "10.04 Lucid Lynx",
  "9.10 Karmic Koala",
  "9.04 Jaunty Jackalope",
  "8.10 Intrepid Ibex",
  "8.04 Hardy Heron",
  "7.10 Gutsy Gibbon",
  "7.04 Feisty Fawn",
  "6.10 Edgy Eft",
  "6.06 Dapper Drake",
  "5.10 Breezy Badger",
  "5.04 Hoary Hedgehog",
  "4.10 Warty Warthog"
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

function load_text_asset(asset_url) {
  return fetch(asset_url, { cache: "no-store" }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load text asset: ${asset_url}`);
    }
    return response.text();
  });
}

function normalize_overlay_copy(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function parse_csv_records(csv_text) {
  const rows = [];
  let current_row = [];
  let current_value = "";
  let in_quotes = false;

  for (let index = 0; index < csv_text.length; index += 1) {
    const char = csv_text[index];
    const next_char = csv_text[index + 1];

    if (char === "\"") {
      if (in_quotes && next_char === "\"") {
        current_value += "\"";
        index += 1;
      } else {
        in_quotes = !in_quotes;
      }
      continue;
    }

    if (char === "," && !in_quotes) {
      current_row.push(current_value);
      current_value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !in_quotes) {
      if (char === "\r" && next_char === "\n") {
        index += 1;
      }
      current_row.push(current_value);
      rows.push(current_row);
      current_row = [];
      current_value = "";
      continue;
    }

    current_value += char;
  }

  if (current_value.length > 0 || current_row.length > 0) {
    current_row.push(current_value);
    rows.push(current_row);
  }

  if (!rows.length) {
    return [];
  }

  const [header_row, ...data_rows] = rows;
  const header = header_row.map((cell) => String(cell || "").trim());
  return data_rows
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => {
      const record = {};
      for (let column_index = 0; column_index < header.length; column_index += 1) {
        const key = header[column_index];
        if (!key) {
          continue;
        }
        record[key] = normalize_overlay_copy(row[column_index] ?? "");
      }
      return record;
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
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(get_render_pixel_ratio());
  renderer.setSize(stage_width_px, stage_height_px, false);
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

  const safe_area_fill_material = new THREE.MeshBasicMaterial({
    transparent: false,
    color: STAGE_BACKGROUND_COLOR,
    depthTest: false,
    depthWrite: false
  });
  safe_area_fill_material.toneMapped = false;
  const safe_area_fill_mesh = new THREE.Mesh(mascot_plane_geometry, safe_area_fill_material);
  safe_area_fill_mesh.renderOrder = SAFE_AREA_FILL_ORDER;
  safe_area_fill_mesh.visible = false;

  world_group.add(safe_area_fill_mesh);
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
    overlay_logo_image: null,
    overlay_logo_path: "",
    overlay_logo_load_serial: 0,
    overlay_content_rows: [],
    overlay_content_path: "",
    overlay_content_load_serial: 0,
    overlay_content_loading: false,
    overlay_content_failed_path: "",
    mascot_box: null,
    animation_frame_id: 0,
    is_paused: false,
    pause_time_ms: 0,
    animation_start_ms: performance.now(),
    refresh_serial: 0,
    export_transparent_background: false,
    export_hide_overlay_guides: false,
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

  function get_background_color() {
    return config.composition?.background_color || STAGE_BACKGROUND_COLOR;
  }

  function get_color_rgba(hex_color, alpha = 1) {
    const hex = String(hex_color || "").replace("#", "").trim();
    const normalized_hex = hex.length === 3
      ? hex.split("").map((char) => char + char).join("")
      : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized_hex)) {
      return `rgba(38, 38, 38, ${alpha})`;
    }

    const red = Number.parseInt(normalized_hex.slice(0, 2), 16);
    const green = Number.parseInt(normalized_hex.slice(2, 4), 16);
    const blue = Number.parseInt(normalized_hex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function get_background_rgba(alpha = 1) {
    return get_color_rgba(get_background_color(), alpha);
  }

  function get_safe_area_fill_color() {
    return config.layout_grid?.safe_area_fill_color || get_background_color();
  }

  function get_safe_area_fill_rgba(alpha = 1) {
    return get_color_rgba(get_safe_area_fill_color(), alpha);
  }

  function is_overlay_enabled() {
    return Boolean(config.layout_grid?.show_composition_grid);
  }

  function apply_renderer_clear_color() {
    renderer.setClearColor(
      get_background_color(),
      runtime.export_transparent_background ? 0 : 1
    );
  }

  function apply_stage_styles() {
    const background_color = get_background_color();
    document.body.style.background = background_color;
    stage.style.aspectRatio = `${stage_width_px} / ${stage_height_px}`;
    stage.style.width =
      `min(${stage_width_px}px, calc(100vw - var(--editor-panel-space, 0px) - 3rem), ` +
      `calc((100svh - 5.5rem) * ${stage_aspect_ratio}))`;
    stage.style.borderRadius = "0";
    stage.style.background = background_color;
    stage.style.borderColor = "transparent";
    stage.style.boxShadow = "none";
    apply_renderer_clear_color();
  }

  function update_safe_area_fill_mesh() {
    const use_safe_area = Boolean(config.layout_grid?.fit_within_safe_area);
    const draw_above_animation = Boolean(config.layout_grid?.safe_area_fill_above_animation);
    if (!is_overlay_enabled() || !use_safe_area || draw_above_animation) {
      safe_area_fill_mesh.visible = false;
      return;
    }

    const grid = get_layout_grid_metrics();
    const width_px = Math.max(0, grid.layout_right_px - grid.layout_left_px);
    const height_px = Math.max(0, grid.layout_bottom_px - grid.layout_top_px);
    if (width_px <= 0 || height_px <= 0) {
      safe_area_fill_mesh.visible = false;
      return;
    }

    safe_area_fill_material.color.set(get_safe_area_fill_color());
    safe_area_fill_mesh.renderOrder = config.layout_grid?.safe_area_fill_above_animation
      ? SAFE_AREA_FILL_OVERLAY_ORDER
      : SAFE_AREA_FILL_ORDER;
    safe_area_fill_mesh.visible = true;
    safe_area_fill_mesh.position.set(
      grid.layout_left_px + width_px * 0.5,
      stage_height_px - grid.layout_top_px - height_px * 0.5,
      0
    );
    safe_area_fill_mesh.scale.set(width_px, height_px, 1);
  }

  function draw_safe_area_fill_overlay() {
    const use_safe_area = Boolean(config.layout_grid?.fit_within_safe_area);
    const draw_above_animation = Boolean(config.layout_grid?.safe_area_fill_above_animation);
    if (
      !text_overlay_context ||
      !text_overlay_canvas ||
      !is_overlay_enabled() ||
      !use_safe_area ||
      !draw_above_animation
    ) {
      return;
    }

    const grid = get_layout_grid_metrics();
    const width_px = Math.max(0, grid.layout_right_px - grid.layout_left_px);
    const height_px = Math.max(0, grid.layout_bottom_px - grid.layout_top_px);
    if (width_px <= 0 || height_px <= 0) {
      return;
    }

    text_overlay_context.save();
    text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
    text_overlay_context.fillStyle = get_safe_area_fill_color();
    text_overlay_context.fillRect(
      grid.layout_left_px,
      grid.layout_top_px,
      width_px,
      height_px
    );
    text_overlay_context.restore();
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

  function get_baseline_step_px() {
    return Math.max(1, Math.round(Number(config.layout_grid?.baseline_step_px ?? 8)));
  }

  function snap_up_to_baseline(value_px) {
    const baseline_step_px = get_baseline_step_px();
    return Math.ceil(value_px / baseline_step_px) * baseline_step_px;
  }

  function get_layout_grid_metrics() {
    const baseline_step_px = get_baseline_step_px();
    const row_count = Math.max(1, Math.round(Number(config.layout_grid?.row_count ?? 4)));
    const column_count = Math.max(1, Math.round(Number(config.layout_grid?.column_count ?? 4)));
    const use_safe_area = Boolean(config.layout_grid?.fit_within_safe_area);
    const safe_top_px = use_safe_area ? Math.max(0, Number(config.layout_grid?.safe_top_px ?? 0)) : 0;
    const safe_right_px = use_safe_area ? Math.max(0, Number(config.layout_grid?.safe_right_px ?? 0)) : 0;
    const safe_bottom_px = use_safe_area ? Math.max(0, Number(config.layout_grid?.safe_bottom_px ?? 0)) : 0;
    const safe_left_px = use_safe_area ? Math.max(0, Number(config.layout_grid?.safe_left_px ?? 0)) : 0;
    const layout_left_px = safe_left_px;
    const layout_top_px = safe_top_px;
    const layout_right_px = Math.max(layout_left_px, stage_width_px - safe_right_px);
    const layout_bottom_px = Math.max(layout_top_px, stage_height_px - safe_bottom_px);
    const layout_width_px = Math.max(0, layout_right_px - layout_left_px);
    const layout_height_px = Math.max(0, layout_bottom_px - layout_top_px);
    const side_margin_px =
      Math.max(
        0,
        Number(config.layout_grid?.margin_side_baselines ?? 8)
      ) * baseline_step_px;
    const top_margin_px =
      Math.max(
        0,
        Number(config.layout_grid?.margin_top_baselines ?? 3)
      ) * baseline_step_px;
    const minimum_bottom_margin_px =
      Math.max(
        0,
        Number(config.layout_grid?.margin_bottom_baselines ?? 0)
      ) * baseline_step_px;
    const row_gutter_baselines = Math.max(
      0,
      Math.round(Number(config.layout_grid?.row_gutter_baselines ?? 2))
    );
    const column_gutter_baselines = Math.max(
      0,
      Math.round(Number(config.layout_grid?.column_gutter_baselines ?? 2))
    );
    const row_gutter_px = row_gutter_baselines * baseline_step_px;
    const column_gutter_px = column_gutter_baselines * baseline_step_px;
    const max_row_height_space =
      layout_height_px -
      top_margin_px -
      minimum_bottom_margin_px -
      row_gutter_px * Math.max(0, row_count - 1);
    const row_height_px = Math.max(
      0,
      Math.floor(Math.max(0, max_row_height_space) / (row_count * baseline_step_px)) * baseline_step_px
    );
    const bottom_margin_px = minimum_bottom_margin_px + Math.max(
      0,
      layout_height_px -
      top_margin_px -
      minimum_bottom_margin_px -
      row_height_px * row_count -
      row_gutter_px * Math.max(0, row_count - 1)
    );
    const content_width_px = Math.max(
      0,
      layout_width_px - side_margin_px * 2 - column_gutter_px * Math.max(0, column_count - 1)
    );
    const column_width_px = column_count <= 0 ? 0 : content_width_px / column_count;
    const column_keyline_positions_px = Array.from({ length: column_count }, (_, index) => (
      layout_left_px + side_margin_px + index * (column_width_px + column_gutter_px)
    ));

    return {
      baseline_step_px,
      row_count,
      column_count,
      side_margin_px,
      top_margin_px,
      minimum_bottom_margin_px,
      bottom_margin_px,
      row_gutter_px,
      column_gutter_px,
      row_height_px,
      column_width_px,
      layout_left_px,
      layout_top_px,
      layout_right_px,
      layout_bottom_px,
      content_left_px: layout_left_px + side_margin_px,
      content_top_px: layout_top_px + top_margin_px,
      content_right_px: layout_right_px - side_margin_px,
      content_bottom_px: layout_bottom_px - bottom_margin_px,
      column_keyline_positions_px
    };
  }

  function get_overlay_text_keyline_x_px(keyline_index) {
    const grid = get_layout_grid_metrics();
    const safe_index = clamp(
      Math.round(Number.isFinite(Number(keyline_index)) ? Number(keyline_index) : 1),
      1,
      Math.max(1, grid.column_count)
    );
    return grid.column_keyline_positions_px[safe_index - 1] ?? grid.content_left_px;
  }

  function get_overlay_text_color() {
    return config.overlay_text?.color || "#ffffff";
  }

  function get_overlay_text_font(font_size_px, weight = 400) {
    return `${weight} ${Math.max(1, font_size_px)}px ${TEXT_LABEL_FONT_FAMILY}`;
  }

  function wrap_overlay_text_lines(text, max_width_px, font) {
    const safe_text = String(text || "").trim();
    if (!safe_text || !text_overlay_context) {
      return [];
    }

    text_overlay_context.save();
    text_overlay_context.font = font;
    const paragraphs = safe_text.split(/\r?\n/);
    const lines = [];

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push("");
        continue;
      }

      let current_line = words[0];
      for (let word_index = 1; word_index < words.length; word_index += 1) {
        const next_line = `${current_line} ${words[word_index]}`;
        if (max_width_px > 0 && text_overlay_context.measureText(next_line).width > max_width_px) {
          lines.push(current_line);
          current_line = words[word_index];
        } else {
          current_line = next_line;
        }
      }
      lines.push(current_line);
    }

    text_overlay_context.restore();
    return lines;
  }

  function ensure_overlay_logo_image() {
    const asset_path = String(config.overlay_logo?.asset_path || "").trim();
    if (!asset_path) {
      runtime.overlay_logo_image = null;
      runtime.overlay_logo_path = "";
      return;
    }

    if (runtime.overlay_logo_path === asset_path && runtime.overlay_logo_image) {
      return;
    }

    if (runtime.overlay_logo_path === asset_path && !runtime.overlay_logo_image) {
      return;
    }

    runtime.overlay_logo_path = asset_path;
    runtime.overlay_logo_image = null;
    const load_serial = ++runtime.overlay_logo_load_serial;
    load_image_element(asset_path)
      .then((image) => {
        if (load_serial !== runtime.overlay_logo_load_serial) {
          return;
        }
        runtime.overlay_logo_image = image;
        render_playback_frame(get_current_playback_time_sec());
      })
      .catch((error) => {
        if (load_serial !== runtime.overlay_logo_load_serial) {
          return;
        }
        runtime.overlay_logo_image = null;
        console.error(error);
      });
  }

  function ensure_overlay_content_rows() {
    const asset_path = String(config.overlay_text?.content_csv_path || "").trim();
    if (!asset_path) {
      runtime.overlay_content_rows = [];
      runtime.overlay_content_path = "";
      runtime.overlay_content_loading = false;
      runtime.overlay_content_failed_path = "";
      return;
    }

    if (runtime.overlay_content_path === asset_path && runtime.overlay_content_rows.length) {
      return;
    }

    if (runtime.overlay_content_failed_path === asset_path) {
      return;
    }

    if (runtime.overlay_content_path === asset_path && runtime.overlay_content_loading) {
      return;
    }

    runtime.overlay_content_path = asset_path;
    runtime.overlay_content_rows = [];
    runtime.overlay_content_loading = true;
    runtime.overlay_content_failed_path = "";
    const load_serial = ++runtime.overlay_content_load_serial;
    load_text_asset(asset_path)
      .then((csv_text) => {
        if (load_serial !== runtime.overlay_content_load_serial) {
          return;
        }
        runtime.overlay_content_loading = false;
        runtime.overlay_content_failed_path = "";
        runtime.overlay_content_rows = parse_csv_records(csv_text);
        render_playback_frame(get_current_playback_time_sec());
      })
      .catch((error) => {
        if (load_serial !== runtime.overlay_content_load_serial) {
          return;
        }
        runtime.overlay_content_loading = false;
        runtime.overlay_content_rows = [];
        runtime.overlay_content_failed_path = asset_path;
        console.error(error);
      });
  }

  function get_overlay_content_format_key() {
    const format_key = String(config.overlay_text?.content_format || "").trim();
    return OVERLAY_CONTENT_FIELD_ALIASES[format_key] ? format_key : "generic_social";
  }

  function pick_overlay_record_value(record, candidates) {
    for (const candidate of candidates) {
      const value = normalize_overlay_copy(record?.[candidate]);
      if (value) {
        return value;
      }
    }
    return "";
  }

  function get_overlay_content_record() {
    ensure_overlay_content_rows();
    const first_record = runtime.overlay_content_rows[0];
    if (first_record && typeof first_record === "object") {
      const format_key = get_overlay_content_format_key();
      const aliases = OVERLAY_CONTENT_FIELD_ALIASES[format_key] || OVERLAY_CONTENT_FIELD_ALIASES.generic_social;
      return {
        main_heading: normalize_overlay_copy(config.overlay_text?.title_text),
        text_1: pick_overlay_record_value(first_record, aliases.text_1),
        text_2: pick_overlay_record_value(first_record, aliases.text_2),
        text_3: pick_overlay_record_value(first_record, aliases.text_3)
      };
    }

    return {
      main_heading: normalize_overlay_copy(config.overlay_text?.title_text),
      text_1: "",
      text_2: "",
      text_3: normalize_overlay_copy(config.overlay_text?.subtitle_text)
    };
  }

  function get_mascot_draw_box() {
    const composition_scale = Math.max(0.01, Number(config.composition?.scale || 1));
    const draw_size_px = config.mascot.base_width_px * config.mascot.scale * composition_scale;
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

  function get_halo_geometry_scale(box = runtime.mascot_box) {
    if (box) {
      return box.draw_size_px / MASCOT_VIEWBOX_SIZE;
    }

    return Math.max(0.01, Number(config.composition?.scale || 1));
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
    const rotation_rad = radians(config.composition.global_rotation_deg);
    const mascot_box = config.mascot.enabled ? get_mascot_draw_box() : null;
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
    const spawn_angle_rad =
      radians(generator.anim_start_angle_deg + transition.spawn_angle_offset_deg) + rotation_rad;
    const intro_halo_field = build_intro_halo_field_state({
      config,
      mascot_box
    });
    const shot_interval_sec = intro_halo_field.max_orbit_count > 1
      ? emit_duration_sec / (intro_halo_field.max_orbit_count - 1)
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
    const orbit_rank_counts = new Array(generator.num_orbits).fill(0);

    for (let point_index = 0; point_index < intro_halo_field.point_specs.length; point_index += 1) {
      const point_spec = intro_halo_field.point_specs[point_index];
      const orbit_id = point_spec.orbit_id;
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

      points.push({
        center_x_px: config.composition.center_x_px,
        center_y_px: config.composition.center_y_px,
        radius: point_spec.radius,
        target_angle: point_spec.target_angle,
        orbit_id,
        speed_rad_per_sec: radians(speed_deg_per_sec),
        birth_sec,
        visible_sec,
        capture_start_sec: point_capture_start_sec,
        diameter_px: point_spec.diameter_px,
        radius_px: point_spec.radius_px
      });

      orbit_rank_counts[orbit_id] += 1;
    }

    runtime.points = points;
    runtime.spokes = intro_halo_field.spokes;
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

  function compute_timed_sneeze_amount(playback_time_sec) {
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

  function compute_loop_sneeze_amount(playback_time_sec) {
    if (
      !config.sneeze.enabled ||
      !config.blink.enabled ||
      playback_time_sec <= runtime.playback_end_sec ||
      !has_post_finale_field_motion()
    ) {
      return 0;
    }

    const cycle_sec = get_screensaver_cycle_sec();
    if (cycle_sec <= 0) {
      return 0;
    }

    const sneeze_duration_sec = Math.max(0.0001, Number(config.blink.duration_sec || 0));
    const event_spacing_sec = cycle_sec * 0.5;
    if (event_spacing_sec <= 0) {
      return 0;
    }

    const loop_time_sec = playback_time_sec - runtime.playback_end_sec;
    const nearest_event_index = Math.round(loop_time_sec / event_spacing_sec);
    const nearest_event_time_sec = nearest_event_index * event_spacing_sec;
    const event_offset_sec = loop_time_sec - nearest_event_time_sec;
    const half_duration_sec = sneeze_duration_sec * 0.5;
    if (Math.abs(event_offset_sec) > half_duration_sec) {
      return 0;
    }

    const sneeze_u = clamp(
      (event_offset_sec + half_duration_sec) / sneeze_duration_sec,
      0,
      1
    );
    return compute_blink_curve(sneeze_u);
  }

  function compute_sneeze_amount(playback_time_sec, force_final) {
    if (force_final) {
      return compute_loop_sneeze_amount(playback_time_sec);
    }

    return Math.max(
      compute_timed_sneeze_amount(playback_time_sec),
      compute_loop_sneeze_amount(playback_time_sec)
    );
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
    const effective_spoke_count = Math.max(1, compute_effective_spoke_count(playback_time_sec));
    const effective_orbit_count = Math.max(1, compute_effective_orbit_count(playback_time_sec));
    const field_state = build_post_finale_halo_field_state({
      config,
      mascot_box: runtime.mascot_box,
      playback_time_sec,
      effective_spoke_count,
      effective_orbit_count,
      previous_width_phase_u_by_source: runtime.spoke_width_phase_u_by_source,
      previous_clip_center_x_by_source: runtime.spoke_clip_center_x_by_source,
      last_width_transition_time_sec: runtime.spoke_width_transition_playback_time_sec,
      full_frame_outer_radius_px: get_full_frame_spoke_outer_radius(
        config.composition.center_x_px,
        config.composition.center_y_px
      )
    });

    runtime.spoke_width_phase_u_by_source = field_state.next_spoke_width_phase_u_by_source;
    runtime.spoke_clip_center_x_by_source = field_state.next_spoke_clip_center_x_by_source;
    runtime.spoke_width_transition_playback_time_sec =
      field_state.spoke_width_transition_playback_time_sec;

    return {
      box: field_state.box,
      points: field_state.points,
      spokes: field_state.spokes,
      visible_spoke_count: field_state.visible_spoke_count,
      halo_outer_radius_px: field_state.halo_outer_radius_px,
      full_frame_outer_radius_px: field_state.full_frame_outer_radius_px
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
    nose_cutout_material.color.set(get_background_color());
    halo_reference_material.color.set(HALO_REFERENCE_COLOR);
  }

  function push_background_spokes(spokes, full_frame_outer_radius_px) {
    const background_spoke_width_px = BACKGROUND_SPOKE_WIDTH_PX * get_halo_geometry_scale();
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
        background_spoke_width_px,
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

      // Flash-on-capture: brief alpha spike as the dot locks into its target spoke position.
      // Applies a sine-bell envelope over the last 20% of the capture window.
      if (!force_final) {
        const _flash_cap_dur = Math.max(0.0001, runtime.dot_end_sec - point.capture_start_sec);
        const _flash_raw_u = clamp((time_sec - point.capture_start_sec) / _flash_cap_dur, 0, 1);
        if (_flash_raw_u >= 0.8) {
          const flash_u = (_flash_raw_u - 0.8) / 0.2;
          point_alpha = Math.min(1, point_alpha * (1 + 1.8 * Math.sin(flash_u * Math.PI)));
        }
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
    const width_phase_u = clamp(spoke.width_phase_u ?? spoke.phase_u ?? 1, 0, 1);
    const remapped_phase_u = config.spoke_lines.reverse_inner_spoke_thickness_scale
      ? 1 - width_phase_u
      : width_phase_u;
    return lerp(phase_start_scale, 1, remapped_phase_u);
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
      case "dots":
        return echo_style;
      default:
        return "dots";
    }
  }

  function get_echo_color() {
    return config.spoke_lines.echo_color || config.spoke_lines.color;
  }

  function get_echo_shape_seed() {
    return Math.trunc(Number(config.spoke_lines.echo_shape_seed ?? 1)) || 0;
  }

  function get_release_label_index(spoke, fallback_spoke_index = 0, slot_count = null) {
    const total_slots = Math.max(
      1,
      Math.round(
        slot_count ??
        config.generator_wrangle?.spoke_count ??
        0
      ) || 1
    );
    const label_slot_id = wrap_positive(
      Math.round(Number(
        spoke?.label_slot_id ??
        spoke?.display_slot_id ??
        fallback_spoke_index
      )),
      total_slots
    );
    return label_slot_id < UBUNTU_RELEASE_LABELS.length ? label_slot_id : -1;
  }

  function get_text_label_font_size_px() {
    const base_font_size_px = Math.max(
      3,
      Number(config.spoke_text?.font_size_px ?? ECHO_TEXT_BASE_FONT_SIZE_PX)
    );
    const responsive_stage_scale = Math.max(0.01, Math.min(stage_width_px, stage_height_px) / 1080);
    const composition_scale = Math.max(0.01, Number(config.composition?.scale || 1));
    return Math.max(
      3,
      Math.round(base_font_size_px * responsive_stage_scale * composition_scale)
    );
  }

  function get_text_label_width_px(label, font_size_px) {
    return get_text_label_measurements(label, font_size_px).width;
  }

  function get_text_label_measurements(label, font_size_px) {
    const safe_label = String(label || "");
    const cache_key = `${font_size_px}:${safe_label}`;
    const cached_metrics = TEXT_LABEL_MEASURE_CACHE.get(cache_key);
    if (cached_metrics) {
      return cached_metrics;
    }

    let measured_width = font_size_px * 0.58 * safe_label.length;
    let measured_ascent = font_size_px * 0.38;
    let measured_descent = font_size_px * 0.18;
    if (text_overlay_context && safe_label) {
      text_overlay_context.save();
      text_overlay_context.font = `${font_size_px}px ${TEXT_LABEL_FONT_FAMILY}`;
      const metrics = text_overlay_context.measureText(safe_label);
      measured_width = metrics.width;
      measured_ascent = metrics.actualBoundingBoxAscent || measured_ascent;
      measured_descent = metrics.actualBoundingBoxDescent || measured_descent;
      text_overlay_context.restore();
    }

    const measured_metrics = {
      width: measured_width,
      ascent: measured_ascent,
      descent: measured_descent,
      height: measured_ascent + measured_descent
    };
    TEXT_LABEL_WIDTH_CACHE.set(cache_key, measured_width);
    TEXT_LABEL_MEASURE_CACHE.set(cache_key, measured_metrics);
    return measured_metrics;
  }

  function get_text_label_fill_color() {
    if (is_overlay_enabled() && config.layout_grid?.fit_within_safe_area) {
      return get_safe_area_fill_color();
    }
    return get_background_color();
  }

  function get_text_label_radius_metrics(
    spoke,
    halo_outer_radius_px,
    full_frame_outer_radius_px,
    font_size_px,
    label_text = ""
  ) {
    const radial_u = clamp(Number(config.spoke_text?.radial_u ?? 0.55), 0, 1);
    const origin_radius = Math.max(0, Number(spoke?.echo_dot_origin_radius ?? halo_outer_radius_px));
    const max_orbit_count = Math.max(1, Math.round(config.generator_wrangle?.num_orbits || 1));
    const current_orbit_step_px = Math.max(0, Number(spoke?.echo_dot_step_px ?? 0));
    const base_orbit_step_px = max_orbit_count <= 1
      ? 0
      : Math.max(0, (full_frame_outer_radius_px - origin_radius) / (max_orbit_count - 1));
    const base_start_radius = lerp(halo_outer_radius_px, full_frame_outer_radius_px, radial_u);
    const pulsed_orbit_index = base_orbit_step_px <= 0
      ? 0
      : Math.max(0, (base_start_radius - origin_radius) / base_orbit_step_px);
    const thick_segment = spoke
      ? get_world_ray_circle_segment(
        config.composition.center_x_px,
        config.composition.center_y_px,
        spoke.angle,
        spoke.inner_clip_center_x_px,
        spoke.inner_clip_center_y_px,
        spoke.phase_clip_radius_px ?? spoke.phase_field_radius_px,
        spoke.start_radius,
        halo_outer_radius_px
      )
      : null;
    const thick_segment_end_radius = thick_segment
      ? Math.hypot(
        thick_segment.end_x - config.composition.center_x_px,
        thick_segment.end_y - config.composition.center_y_px
      )
      : halo_outer_radius_px;
    const min_start_radius = halo_outer_radius_px + ECHO_MARKER_HALO_GAP_PX + TEXT_LABEL_MARGIN_PX;
    const start_radius = clamp(
      Math.max(
        current_orbit_step_px > 0
          ? origin_radius + pulsed_orbit_index * current_orbit_step_px
          : base_start_radius,
        thick_segment_end_radius + TEXT_LABEL_MARGIN_PX
      ),
      min_start_radius,
      full_frame_outer_radius_px
    );
    const estimated_length_px = get_text_label_width_px(label_text, font_size_px);
    const end_radius = clamp(
      start_radius + estimated_length_px,
      start_radius,
      full_frame_outer_radius_px
    );
    return {
      start_radius,
      end_radius,
      clear_start_r: Math.max(
        halo_outer_radius_px + ECHO_MARKER_HALO_GAP_PX,
        start_radius - TEXT_LABEL_MARGIN_PX
      ),
      clear_end_r: Math.min(full_frame_outer_radius_px, end_radius + TEXT_LABEL_MARGIN_PX)
    };
  }

  function get_echo_marker_variant(echo_style, spoke_seed, marker_seed) {
    if (echo_style === "plus" || echo_style === "triangles") {
      return echo_style;
    }

    if (echo_style !== "mixed") {
      return "dots";
    }

    const replace_pct = clamp(config.spoke_lines.echo_mix_shape_pct ?? 0.35, 0, 1);
    const shape_seed = get_echo_shape_seed();
    if (hash_01(shape_seed + spoke_seed + 0.137, marker_seed + 0.271) >= replace_pct) {
      return "dots";
    }

    const shape_h = hash_01(shape_seed + spoke_seed + 5.173, marker_seed + 8.411);
    if (shape_h < 1 / 6) return "plus";
    if (shape_h < 2 / 6) return "triangles";
    if (shape_h < 3 / 6) return "diamond";
    if (shape_h < 4 / 6) return "radial_dash";
    if (shape_h < 5 / 6) return "star";
    return "hexagon";
  }

  function push_plus_marker(center_x, center_y, size_px, width_px, alpha, axis_angle_rad) {
    const half_size = size_px * 0.5;
    const dir_x = Math.cos(axis_angle_rad);
    const dir_y = Math.sin(axis_angle_rad);
    const perp_x = -dir_y;
    const perp_y = dir_x;
    runtime.layers.haloEchoMarks.push(
      center_x - dir_x * half_size,
      center_y - dir_y * half_size,
      center_x + dir_x * half_size,
      center_y + dir_y * half_size,
      width_px,
      alpha
    );
    runtime.layers.haloEchoMarks.push(
      center_x - perp_x * half_size,
      center_y - perp_y * half_size,
      center_x + perp_x * half_size,
      center_y + perp_y * half_size,
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

  function push_diamond_marker(center_x, center_y, size_px, width_px, alpha, axis_angle_rad) {
    const half = size_px * 0.5;
    const dir_x = Math.cos(axis_angle_rad);
    const dir_y = Math.sin(axis_angle_rad);
    const perp_x = -dir_y;
    const perp_y = dir_x;
    const top_x = center_x + dir_x * half;
    const top_y = center_y + dir_y * half;
    const right_x = center_x + perp_x * half;
    const right_y = center_y + perp_y * half;
    const bot_x = center_x - dir_x * half;
    const bot_y = center_y - dir_y * half;
    const left_x = center_x - perp_x * half;
    const left_y = center_y - perp_y * half;
    runtime.layers.haloEchoMarks.push(top_x, top_y, right_x, right_y, width_px, alpha);
    runtime.layers.haloEchoMarks.push(right_x, right_y, bot_x, bot_y, width_px, alpha);
    runtime.layers.haloEchoMarks.push(bot_x, bot_y, left_x, left_y, width_px, alpha);
    runtime.layers.haloEchoMarks.push(left_x, left_y, top_x, top_y, width_px, alpha);
  }

  function push_radial_dash_marker(center_x, center_y, length_px, width_px, alpha, axis_angle_rad) {
    const half = length_px * 0.5;
    const dir_x = Math.cos(axis_angle_rad);
    const dir_y = Math.sin(axis_angle_rad);
    runtime.layers.haloEchoMarks.push(
      center_x - dir_x * half,
      center_y - dir_y * half,
      center_x + dir_x * half,
      center_y + dir_y * half,
      width_px,
      alpha
    );
  }

  function push_star_marker(center_x, center_y, size_px, width_px, alpha, axis_angle_rad) {
    push_plus_marker(center_x, center_y, size_px, width_px, alpha, axis_angle_rad);
    push_plus_marker(center_x, center_y, size_px * 0.62, width_px, alpha, axis_angle_rad + Math.PI * 0.25);
  }

  function push_hexagon_marker(center_x, center_y, size_px, width_px, alpha, axis_angle_rad) {
    const circumradius = size_px * 0.5;
    const vx = [];
    const vy = [];
    for (let i = 0; i < 6; i++) {
      const a = axis_angle_rad + (i * Math.PI) / 3;
      vx.push(center_x + Math.cos(a) * circumradius);
      vy.push(center_y + Math.sin(a) * circumradius);
    }
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      runtime.layers.haloEchoMarks.push(vx[i], vy[i], vx[j], vy[j], width_px, alpha);
    }
  }

  function draw_ubuntu_release_overlay({
    spokes,
    box,
    base_alpha,
    reveal_state,
    halo_outer_radius_px,
    full_frame_outer_radius_px
  }) {
    if (
      !text_overlay_context ||
      !text_overlay_canvas ||
      !box ||
      base_alpha <= 0 ||
      !config.spoke_text?.enabled
    ) {
      return;
    }

    const field_center_x = config.composition.center_x_px;
    const field_center_y = config.composition.center_y_px;
    const font_size_px = get_text_label_font_size_px();
    const label_count = UBUNTU_RELEASE_LABELS.length;
    const label_fill_color = get_text_label_fill_color();
    const label_pad_x = Math.max(4, Math.round(font_size_px * 0.28));
    const label_pad_y = Math.max(2, Math.round(font_size_px * 0.18));

    text_overlay_context.save();
    text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
    text_overlay_context.fillStyle = config.spoke_lines.reference_color || "#ffffff";
    text_overlay_context.font = `${font_size_px}px ${TEXT_LABEL_FONT_FAMILY}`;
    text_overlay_context.textBaseline = "middle";

    for (let spoke_index = 0; spoke_index < spokes.length; spoke_index += 1) {
      const spoke = spokes[spoke_index];
      if (spoke.seam_overlay_only) {
        continue;
      }

      // Spokes 44–59 carry geometric shapes only – no text label.
      const label_index = get_release_label_index(spoke, spoke_index);
      if (label_index < 0 || label_index >= label_count) {
        continue;
      }

      const phase_end_alpha = get_phase_end_alpha(spoke.angle);
      const fold_seam_alpha = get_fold_seam_alpha(spoke.angle);
      const spoke_alpha =
        base_alpha * phase_end_alpha * fold_seam_alpha * clamp(spoke.alpha ?? 1, 0, 1);
      if (spoke_alpha <= 0) {
        continue;
      }

      const label = UBUNTU_RELEASE_LABELS[label_index];
      const label_measure = get_text_label_measurements(label, font_size_px);
      const text_metrics = get_text_label_radius_metrics(
        spoke,
        halo_outer_radius_px,
        full_frame_outer_radius_px,
        font_size_px,
        label
      );
      const world_x = field_center_x + Math.cos(spoke.angle) * text_metrics.start_radius;
      const world_y = field_center_y + Math.sin(spoke.angle) * text_metrics.start_radius;
      const local_x = world_x - box.center_x_px;
      const local_y = world_y - box.center_y_px;
      const reveal_alpha = get_reveal_local_alpha(local_x, local_y, reveal_state);
      if (reveal_alpha <= 0) {
        continue;
      }

      // Convert from world space (Y-up, CCW angles) to canvas space (Y-down, CW angles).
      const canvas_x = world_x;
      const canvas_y = stage_height_px - world_y;
      text_overlay_context.save();
      text_overlay_context.translate(canvas_x, canvas_y);
      let label_rotation = -spoke.angle;
      const normalized_rotation = wrap_positive(label_rotation + Math.PI, TAU) - Math.PI;
      const should_flip = normalized_rotation > Math.PI * 0.5 || normalized_rotation < -Math.PI * 0.5;
      if (should_flip) {
        label_rotation += Math.PI;
      }
      text_overlay_context.rotate(label_rotation);
      text_overlay_context.textAlign = should_flip ? "right" : "left";
      text_overlay_context.globalAlpha = spoke_alpha * reveal_alpha;
      text_overlay_context.fillStyle = label_fill_color;
      text_overlay_context.fillRect(
        should_flip ? -label_measure.width - label_pad_x : -label_pad_x,
        -label_measure.ascent - label_pad_y,
        label_measure.width + label_pad_x * 2,
        label_measure.height + label_pad_y * 2
      );
      text_overlay_context.fillStyle = config.spoke_lines.reference_color || "#ffffff";
      text_overlay_context.fillText(label, 0, 0);
      text_overlay_context.restore();
    }

    text_overlay_context.restore();
  }

  function draw_vignette_overlay() {
    if (
      !text_overlay_context ||
      !text_overlay_canvas ||
      !config.vignette?.enabled
    ) {
      return;
    }

    const center_x_px = config.composition.center_x_px;
    const center_y_px = config.composition.center_y_px;
    const use_safe_area = is_overlay_enabled() && config.layout_grid?.fit_within_safe_area;
    const safe_area_fill_above_animation = Boolean(config.layout_grid?.safe_area_fill_above_animation);
    const apply_outside_safe_area_vignette = Boolean(
      config.vignette?.apply_outside_safe_area ?? true
    );
    const fill_flat_vignette = (fill_style, clip_mode = "full") => {
      text_overlay_context.save();
      text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
      if (use_safe_area && clip_mode !== "full") {
        const grid = get_layout_grid_metrics();
        const safe_area_width_px = Math.max(0, grid.layout_right_px - grid.layout_left_px);
        const safe_area_height_px = Math.max(0, grid.layout_bottom_px - grid.layout_top_px);
        if (safe_area_width_px > 0 && safe_area_height_px > 0) {
          text_overlay_context.beginPath();
          if (clip_mode === "outside-safe-area") {
            text_overlay_context.rect(0, 0, stage_width_px, stage_height_px);
          }
          text_overlay_context.rect(
            grid.layout_left_px,
            grid.layout_top_px,
            safe_area_width_px,
            safe_area_height_px
          );
          text_overlay_context.clip(clip_mode === "outside-safe-area" ? "evenodd" : "nonzero");
        }
      }
      text_overlay_context.fillStyle = fill_style;
      text_overlay_context.fillRect(0, 0, stage_width_px, stage_height_px);
      text_overlay_context.restore();
    };
    const fill_configured_vignette = (rgba_fn, clip_mode, radius_px, feather_px, choke) => {
      const outer_radius_px = Math.max(0, Number(radius_px || 0));
      const safe_feather_px = Math.max(0, Number(feather_px || 0));
      const safe_choke = clamp(Number(choke ?? 0.5), 0, 1);
      if (outer_radius_px <= 0) {
        fill_flat_vignette(rgba_fn(1), clip_mode);
        return;
      }

      const clear_radius_px = Math.max(0, outer_radius_px - safe_feather_px);
      const safe_outer_radius_px = Math.max(1, outer_radius_px);
      const inner_stop = safe_feather_px <= 0
        ? 0.999
        : clamp(clear_radius_px / safe_outer_radius_px, 0, 0.999);
      const midpoint_stop = lerp(inner_stop, 1, safe_choke);
      const gradient = text_overlay_context.createRadialGradient(
        center_x_px,
        center_y_px,
        0,
        center_x_px,
        center_y_px,
        outer_radius_px
      );
      gradient.addColorStop(0, rgba_fn(0));
      gradient.addColorStop(inner_stop, rgba_fn(0));
      gradient.addColorStop(midpoint_stop, rgba_fn(0.5));
      gradient.addColorStop(1, rgba_fn(1));

      text_overlay_context.save();
      text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
      if (use_safe_area && clip_mode !== "full") {
        const grid = get_layout_grid_metrics();
        const safe_area_width_px = Math.max(0, grid.layout_right_px - grid.layout_left_px);
        const safe_area_height_px = Math.max(0, grid.layout_bottom_px - grid.layout_top_px);
        if (safe_area_width_px > 0 && safe_area_height_px > 0) {
          text_overlay_context.beginPath();
          if (clip_mode === "outside-safe-area") {
            text_overlay_context.rect(0, 0, stage_width_px, stage_height_px);
          }
          text_overlay_context.rect(
            grid.layout_left_px,
            grid.layout_top_px,
            safe_area_width_px,
            safe_area_height_px
          );
          text_overlay_context.clip(clip_mode === "outside-safe-area" ? "evenodd" : "nonzero");
        }
      }
      text_overlay_context.fillStyle = gradient;
      text_overlay_context.fillRect(0, 0, stage_width_px, stage_height_px);
      text_overlay_context.restore();
    };

    if (use_safe_area) {
      if (apply_outside_safe_area_vignette) {
        fill_configured_vignette(
          get_background_rgba,
          "outside-safe-area",
          config.vignette?.outside_radius_px ?? config.vignette?.radius_px,
          config.vignette?.outside_feather_px ?? config.vignette?.feather_px,
          config.vignette?.outside_choke ?? config.vignette?.choke
        );
      }
      if (!safe_area_fill_above_animation) {
        fill_configured_vignette(
          get_safe_area_fill_rgba,
          "inside-safe-area",
          config.vignette?.radius_px,
          config.vignette?.feather_px,
          config.vignette?.choke
        );
      }
    } else {
      fill_configured_vignette(
        get_background_rgba,
        "full",
        config.vignette?.radius_px,
        config.vignette?.feather_px,
        config.vignette?.choke
      );
    }
  }

  function draw_baseline_grid_overlay() {
    if (
      !text_overlay_context ||
      !is_overlay_enabled() ||
      !config.layout_grid?.show_baseline_grid ||
      runtime.export_hide_overlay_guides
    ) {
      return;
    }

    const baseline_step_px = get_baseline_step_px();
    text_overlay_context.save();
    text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
    text_overlay_context.strokeStyle = OVERLAY_GRID_COLOR;
    text_overlay_context.lineWidth = 1;

    const grid = get_layout_grid_metrics();
    for (
      let y_px = grid.layout_top_px + baseline_step_px;
      y_px <= grid.layout_bottom_px;
      y_px += baseline_step_px
    ) {
      text_overlay_context.beginPath();
      text_overlay_context.moveTo(grid.layout_left_px, y_px + 0.5);
      text_overlay_context.lineTo(grid.layout_right_px, y_px + 0.5);
      text_overlay_context.stroke();
    }

    text_overlay_context.restore();
  }

  function draw_composition_grid_overlay() {
    if (
      !text_overlay_context ||
      !is_overlay_enabled() ||
      !config.layout_grid?.show_baseline_grid ||
      runtime.export_hide_overlay_guides
    ) {
      return;
    }

    const grid = get_layout_grid_metrics();
    text_overlay_context.save();
    text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
    text_overlay_context.strokeStyle = OVERLAY_COMPOSITION_COLOR;
    text_overlay_context.lineWidth = 1;

    for (let row_index = 0; row_index < grid.row_count; row_index += 1) {
      const y_px =
        grid.content_top_px + row_index * (grid.row_height_px + grid.row_gutter_px);

      for (let column_index = 0; column_index < grid.column_count; column_index += 1) {
        const x_px =
          grid.content_left_px +
          column_index * (grid.column_width_px + grid.column_gutter_px);

        text_overlay_context.strokeRect(
          x_px + 0.5,
          y_px + 0.5,
          Math.max(0, grid.column_width_px),
          Math.max(0, grid.row_height_px)
        );
      }
    }

    text_overlay_context.restore();
  }

  function draw_overlay_logo() {
    if (!text_overlay_context || !is_overlay_enabled() || !config.overlay_logo?.enabled) {
      return;
    }

    ensure_overlay_logo_image();
    const image = runtime.overlay_logo_image;
    if (!image) {
      return;
    }

    const base_height_px = Math.max(1, Number(config.overlay_logo.height_px ?? 108));
    const title_font_size_px = Math.max(
      1,
      Number(config.overlay_text?.title_font_size_px ?? LINKED_TITLE_BASE_FONT_SIZE_PX)
    );
    const linked_scale = Boolean(config.overlay_text?.link_title_size_to_logo_height)
      ? title_font_size_px / LINKED_TITLE_BASE_FONT_SIZE_PX
      : 1;
    const target_height_px = base_height_px * linked_scale;
    const aspect_ratio = image.naturalWidth > 0 && image.naturalHeight > 0
      ? image.naturalWidth / image.naturalHeight
      : 1;
    const target_width_px = target_height_px * aspect_ratio;
    const grid = get_layout_grid_metrics();
    const x_px = grid.layout_left_px + Number(config.overlay_logo.x_px ?? 0);
    const y_px = grid.layout_top_px + Number(config.overlay_logo.y_px ?? 0);

    text_overlay_context.save();
    text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
    text_overlay_context.drawImage(image, x_px, y_px, target_width_px, target_height_px);
    text_overlay_context.restore();
  }

  function draw_overlay_text_field({
    text,
    keyline_index,
    y_baselines,
    max_width_px,
    font,
    line_height_px
  }) {
    const safe_text = normalize_overlay_copy(text);
    if (!safe_text) {
      return;
    }

    const baseline_step_px = get_baseline_step_px();
    const grid = get_layout_grid_metrics();
    const wrapped_lines = wrap_overlay_text_lines(safe_text, max_width_px, font);
    if (!wrapped_lines.length) {
      return;
    }

    let baseline_y_px = grid.layout_top_px + Number(y_baselines ?? 0) * baseline_step_px;
    const draw_x_px = get_overlay_text_keyline_x_px(keyline_index);

    text_overlay_context.font = font;
    for (const line of wrapped_lines) {
      text_overlay_context.fillText(line, draw_x_px, baseline_y_px, max_width_px || undefined);
      baseline_y_px += line_height_px;
    }
  }

  function draw_overlay_text_block() {
    if (!text_overlay_context || !is_overlay_enabled() || !config.overlay_text?.enabled) {
      return;
    }

    const content = get_overlay_content_record();
    if (!content.main_heading && !content.text_1 && !content.text_2 && !content.text_3) {
      return;
    }

    const baseline_step_px = get_baseline_step_px();
    const title_font_size_px = Math.max(
      1,
      Number(config.overlay_text.title_font_size_px ?? LINKED_TITLE_BASE_FONT_SIZE_PX)
    );
    const b_head_font_size_px = Math.max(1, Number(config.overlay_text.b_head_font_size_px ?? 32));
    const paragraph_font_size_px = Math.max(1, Number(config.overlay_text.paragraph_font_size_px ?? 32));
    const title_font_weight = clamp(
      Math.round(Number(config.overlay_text.title_font_weight ?? 400)),
      100,
      900
    );
    const b_head_font_weight = clamp(
      Math.round(Number(config.overlay_text.b_head_font_weight ?? 400)),
      100,
      900
    );
    const title_font = get_overlay_text_font(title_font_size_px, title_font_weight);
    const b_head_font = get_overlay_text_font(b_head_font_size_px, b_head_font_weight);
    const paragraph_font = get_overlay_text_font(paragraph_font_size_px, 400);
    const title_line_height_px = Math.max(
      baseline_step_px,
      snap_up_to_baseline(Number(config.overlay_text.title_line_height_px ?? title_font_size_px))
    );
    const b_head_line_height_px = Math.max(
      baseline_step_px,
      snap_up_to_baseline(
        Number(config.overlay_text.b_head_line_height_px ?? b_head_font_size_px)
      )
    );
    const paragraph_line_height_px = Math.max(
      baseline_step_px,
      snap_up_to_baseline(
        Number(config.overlay_text.paragraph_line_height_px ?? paragraph_font_size_px)
      )
    );

    text_overlay_context.save();
    text_overlay_context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
    text_overlay_context.fillStyle = get_overlay_text_color();
    text_overlay_context.textAlign = "left";
    text_overlay_context.textBaseline = "alphabetic";
    draw_overlay_text_field({
      text: content.main_heading,
      keyline_index: config.overlay_text.main_heading_keyline_index,
      y_baselines: config.overlay_text.main_heading_y_baselines,
      max_width_px: Math.max(0, Number(config.overlay_text.main_heading_max_width_px ?? 0)),
      font: title_font,
      line_height_px: title_line_height_px
    });
    draw_overlay_text_field({
      text: content.text_1,
      keyline_index: config.overlay_text.text_1_keyline_index,
      y_baselines: config.overlay_text.text_1_y_baselines,
      max_width_px: Math.max(0, Number(config.overlay_text.text_1_max_width_px ?? 0)),
      font: b_head_font,
      line_height_px: b_head_line_height_px
    });
    draw_overlay_text_field({
      text: content.text_2,
      keyline_index: config.overlay_text.text_2_keyline_index,
      y_baselines: config.overlay_text.text_2_y_baselines,
      max_width_px: Math.max(0, Number(config.overlay_text.text_2_max_width_px ?? 0)),
      font: paragraph_font,
      line_height_px: paragraph_line_height_px
    });
    draw_overlay_text_field({
      text: content.text_3,
      keyline_index: config.overlay_text.text_3_keyline_index,
      y_baselines: config.overlay_text.text_3_y_baselines,
      max_width_px: Math.max(0, Number(config.overlay_text.text_3_max_width_px ?? 0)),
      font: paragraph_font,
      line_height_px: paragraph_line_height_px
    });

    text_overlay_context.restore();
  }

  function draw_overlay_guides_and_content() {
    draw_safe_area_fill_overlay();
    draw_baseline_grid_overlay();
    draw_composition_grid_overlay();
    draw_overlay_logo();
    draw_overlay_text_block();
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

    const sneeze_amount = compute_sneeze_amount(playback_time_sec, force_final);
    const head_turn_eye_amount = force_final
      ? 0
      : compute_head_turn_eye_squint_amount(playback_time_sec);
    const combined_eye_amount = Math.max(sneeze_amount, head_turn_eye_amount);
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
    visible_spoke_count,
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
    const halo_geometry_scale = get_halo_geometry_scale(box);
    const outer_width_px = Math.max(0, config.spoke_lines.width_px || 0) * halo_geometry_scale;
    const inner_width_px =
      Math.max(0, config.spoke_lines.inner_width_px || 0) * halo_geometry_scale;
    const echo_count = Math.max(0, Math.round(config.spoke_lines.echo_count || 0));
    const echo_dot_scale_mult = clamp(config.spoke_lines.echo_width_mult ?? 1, 0.01, 1);
    const echo_wave_count = Math.max(0, Number(config.spoke_lines.echo_wave_count || 0));
    const echo_fade_mult = clamp(config.spoke_lines.echo_opacity_mult ?? 1, 0, 1);
    const echo_style = get_echo_style();
    const echo_marker_scale_mult = Math.max(
      0.1,
      Number(config.spoke_lines.echo_marker_scale_mult ?? 1)
    );
    const max_spoke_count = Math.max(1, Number(config.generator_wrangle.spoke_count || 1));
    const min_spoke_count = clamp(
      Number(config.screensaver?.min_spoke_count || max_spoke_count),
      1,
      max_spoke_count
    );
    const current_visible_spoke_count = clamp(
      Number(visible_spoke_count || max_spoke_count),
      1,
      max_spoke_count
    );
    const sparse_scale_boost = Math.max(
      0,
      Number(config.spoke_lines.echo_sparse_scale_boost ?? 0)
    );
    const sparse_scale_u = max_spoke_count <= min_spoke_count
      ? 0
      : clamp(
        (max_spoke_count - current_visible_spoke_count) /
          Math.max(0.0001, max_spoke_count - min_spoke_count),
        0,
        1
      );
    const echo_sparse_scale_mult = 1 + sparse_scale_boost * sparse_scale_u;
    const echo_marker_width_px = Math.max(
      0.5 * halo_geometry_scale,
      Math.max(0, config.spoke_lines.echo_marker_stroke_px ?? config.spoke_lines.width_px ?? 0) *
        halo_geometry_scale
    );
    const ripple_min_scale = 0.45;
    const ripple_max_scale = 1.55;
    const ripple_fade_start_u = lerp(0.2, 0.85, echo_fade_mult);

    const text_labels_active = Boolean(config.spoke_text?.enabled);
    const text_label_font_px = get_text_label_font_size_px();

    for (let spoke_index = 0; spoke_index < spokes.length; spoke_index += 1) {
      const spoke = spokes[spoke_index];
      const spoke_label_index = get_release_label_index(spoke, spoke_index);
      const text_label = UBUNTU_RELEASE_LABELS[spoke_label_index];
      const text_label_metrics =
        text_labels_active && text_label
          ? get_text_label_radius_metrics(
            spoke,
            halo_outer_radius_px,
            full_frame_outer_radius_px,
            text_label_font_px,
            text_label
          )
          : null;
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
        spoke.phase_clip_radius_px ?? spoke.phase_field_radius_px,
        spoke.start_radius,
        halo_outer_radius_px
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
        echo_count <= 0 ||
        spoke.inner_clip_offset_px <= 0
      ) {
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

        if (clip_distance <= spoke.phase_field_radius_px + 0.01) {
          continue;
        }

        const echo_index = Math.ceil(
          (clip_distance - spoke.phase_field_radius_px) / spoke.inner_clip_offset_px
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

        // Suppress shapes in the text-label clearance zone for spokes that carry a label.
        if (
          text_label_metrics &&
          dot_radius >= text_label_metrics.clear_start_r &&
          dot_radius <= text_label_metrics.clear_end_r
        ) {
          continue;
        }

        // Marker shape choice must stay stable across reveal/post-finale handoffs.
        // Seed it from source spoke identity plus radial orbit index, not from
        // the current clip-derived echo rank, which can shift when mask geometry changes.
        const echo_marker_variant = get_echo_marker_variant(
          echo_style,
          spoke.source_spoke_id ?? spoke.display_slot_id ?? spoke_index,
          orbit_index
        );
        let marker_outer_extent_px = dot_radius_px;
        let plus_size_px = 0;
        let triangle_side_px = 0;
        let diamond_size_px = 0;
        let dash_length_px = 0;
        let star_size_px = 0;
        let hexagon_size_px = 0;
        const _echo_scale_factor =
          ECHO_PLUS_SIZE_PX *
          halo_geometry_scale *
          clamp(dot_radius_px / Math.max(0.0001, template_dot.radius_px), 0.25, 4) *
          echo_marker_scale_mult *
          echo_sparse_scale_mult;

        if (echo_marker_variant === "plus") {
          plus_size_px = _echo_scale_factor;
          marker_outer_extent_px = plus_size_px * 0.5 + echo_marker_width_px * 0.5;
        } else if (echo_marker_variant === "triangles") {
          triangle_side_px = Math.max(
            6.4 * halo_geometry_scale,
            dot_radius_px * 3.2 * echo_marker_scale_mult * echo_sparse_scale_mult
          );
          marker_outer_extent_px =
            triangle_side_px / Math.sqrt(3) + echo_marker_width_px * 0.5;
        } else if (echo_marker_variant === "diamond") {
          diamond_size_px = _echo_scale_factor;
          marker_outer_extent_px = diamond_size_px * 0.5 + echo_marker_width_px * 0.5;
        } else if (echo_marker_variant === "radial_dash") {
          dash_length_px = _echo_scale_factor * 0.75;
          marker_outer_extent_px = dash_length_px * 0.5 + echo_marker_width_px * 0.5;
        } else if (echo_marker_variant === "star") {
          star_size_px = _echo_scale_factor;
          marker_outer_extent_px = star_size_px * 0.5 + echo_marker_width_px * 0.5;
        } else if (echo_marker_variant === "hexagon") {
          hexagon_size_px = _echo_scale_factor * 1.1;
          marker_outer_extent_px = hexagon_size_px * 0.5 + echo_marker_width_px * 0.5;
        }

        if (
          dot_radius - marker_outer_extent_px <=
          halo_outer_radius_px + ECHO_MARKER_HALO_GAP_PX + 0.01
        ) {
          continue;
        }

        if (echo_marker_variant === "plus") {
          push_plus_marker(
            local_dot_x,
            local_dot_y,
            plus_size_px,
            echo_marker_width_px,
            dot_alpha,
            spoke.angle
          );
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

        if (echo_marker_variant === "diamond") {
          push_diamond_marker(
            local_dot_x,
            local_dot_y,
            diamond_size_px,
            echo_marker_width_px,
            dot_alpha,
            spoke.angle
          );
          continue;
        }

        if (echo_marker_variant === "radial_dash") {
          push_radial_dash_marker(
            local_dot_x,
            local_dot_y,
            dash_length_px,
            echo_marker_width_px,
            dot_alpha,
            spoke.angle
          );
          continue;
        }

        if (echo_marker_variant === "star") {
          push_star_marker(
            local_dot_x,
            local_dot_y,
            star_size_px,
            echo_marker_width_px,
            dot_alpha,
            spoke.angle
          );
          continue;
        }

        if (echo_marker_variant === "hexagon") {
          push_hexagon_marker(
            local_dot_x,
            local_dot_y,
            hexagon_size_px,
            echo_marker_width_px,
            dot_alpha,
            spoke.angle
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
      reveal_state,
      halo_outer_radius_px,
      full_frame_outer_radius_px
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
        visible_spoke_count: field_state.visible_spoke_count,
        box: field_state.box,
        halo_outer_radius_px: field_state.halo_outer_radius_px,
        full_frame_outer_radius_px: field_state.full_frame_outer_radius_px,
        base_alpha: mascot_state.base_alpha,
        reveal_state
      });
      push_phase_debug_overlay(field_state.box);
      update_safe_area_fill_mesh();
      finalize_layers();
      renderer.render(scene, camera);
      draw_vignette_overlay();
      draw_overlay_guides_and_content();
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
      visible_spoke_count: runtime.spokes.length,
      box: runtime.mascot_box,
      halo_outer_radius_px: runtime.mascot_box ? runtime.mascot_box.draw_size_px * 0.5 : 0,
      full_frame_outer_radius_px,
      base_alpha: mascot_state.base_alpha,
      reveal_state
    });
    push_phase_debug_overlay(runtime.mascot_box);

    update_safe_area_fill_mesh();
    finalize_layers();
    renderer.render(scene, camera);
    draw_vignette_overlay();
    draw_overlay_guides_and_content();
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

    const geometry_scale = get_halo_geometry_scale(box);
    const halo_outer_radius_px =
      COMPOSITION_SIZE_PX *
      Number(config.composition?.radial_scale || 1) *
      Number(config.generator_wrangle?.outer_radius || 0) *
      geometry_scale;
    const phase_mask = get_phase_mask_geometry({
      box,
      center_x_px: config.composition.center_x_px,
      center_y_px: config.composition.center_y_px,
      outer_radius_px: halo_outer_radius_px
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
      phase_mask.field_radius_px,
      mask_width_px,
      0.78
    );
    push_circle_outline(
      runtime.layers.debugMasks,
      phase_mask.right_center_x_px,
      phase_mask.center_y_px,
      phase_mask.field_radius_px,
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

  function start_animation(playback_time_sec = 0) {
    runtime.is_paused = false;
    stop_animation();
    reset_spoke_width_transition_state();
    runtime.playback_time_sec = Math.max(0, playback_time_sec);
    runtime.animation_start_ms = performance.now() - runtime.playback_time_sec * 1000;
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

  async function canvas_to_blob(type = "image/png", options = {}) {
    const transparent_background = Boolean(options.transparent_background);
    const previous_transparent_background = runtime.export_transparent_background;
    const should_restore_transparent_flag =
      previous_transparent_background !== transparent_background;
    const previous_hide_overlay_guides = runtime.export_hide_overlay_guides;
    const hide_overlay_guides = options.hide_overlay_guides !== false;

    try {
      runtime.export_hide_overlay_guides = hide_overlay_guides;
      if (should_restore_transparent_flag) {
        runtime.export_transparent_background = transparent_background;
        apply_renderer_clear_color();
      }
      render_playback_frame(runtime.playback_time_sec);

      return await new Promise((resolve, reject) => {
      if (
        export_canvas.width !== stage_width_px ||
        export_canvas.height !== stage_height_px
      ) {
        export_canvas.width = stage_width_px;
        export_canvas.height = stage_height_px;
      }

      const export_context = export_canvas.getContext("2d", { alpha: true });
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
    } finally {
      runtime.export_hide_overlay_guides = previous_hide_overlay_guides;
      if (should_restore_transparent_flag) {
        runtime.export_transparent_background = previous_transparent_background;
        apply_renderer_clear_color();
      }
      render_playback_frame(runtime.playback_time_sec);
    }
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
    isAnimating: () => runtime.animation_frame_id !== 0,
    setOutputProfile: set_output_profile,
    startAnimation: start_animation,
    stopAnimation: stop_animation,
    togglePause: toggle_pause,
    isPaused: () => runtime.is_paused
  };
}
