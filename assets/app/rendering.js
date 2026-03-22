import {
  TAU,
  STAGE_WIDTH_PX,
  STAGE_HEIGHT_PX,
  STAGE_ASPECT_RATIO,
  COMPOSITION_SIZE_PX,
  STAGE_BACKGROUND_COLOR,
  BACKGROUND_SPOKE_WIDTH_PX,
  MASCOT_VIEWBOX_SIZE,
  MASCOT_EYE_SPECS,
  MASCOT_NOSE_PATH_DATA,
  HALO_REFERENCE_OPACITY,
  HALO_REFERENCE_COLOR,
  clamp,
  lerp,
  smoothstep,
  radians,
  wrap_positive,
  compute_frontier_scale,
  compute_phase_frontier_dist_u
} from "./config-schema.js";

const MASCOT_NOSE_PATH = new Path2D(MASCOT_NOSE_PATH_DATA);

function create_layer_canvas(width_px, height_px) {
  const layer_canvas = document.createElement("canvas");
  layer_canvas.width = width_px;
  layer_canvas.height = height_px;
  const layer_context = layer_canvas.getContext("2d", { alpha: true });
  if (!layer_context) {
    throw new Error("Layer canvas 2D context is unavailable.");
  }
  return {
    canvas: layer_canvas,
    context: layer_context
  };
}

export function createRenderer({ stage, canvas, config }) {
  const context = canvas.getContext("2d", {
    alpha: false,
    desynchronized: config.performance.desynchronized
  });
  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

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
    mascot_face_image: null,
    mascot_halo_image: null,
    halo_reference_canvas: null,
    halo_reference_canvas_size_px: 0,
    halo_layer_canvas: null,
    halo_layer_canvas_draw_size_px: 0,
    background_spoke_canvas: null,
    mascot_box: null,
    animation_frame_id: 0,
    animation_start_ms: performance.now(),
    refresh_serial: 0
  };

  function invalidate_layer_caches() {
    runtime.halo_reference_canvas = null;
    runtime.halo_reference_canvas_size_px = 0;
    runtime.halo_layer_canvas = null;
    runtime.halo_layer_canvas_draw_size_px = 0;
    runtime.background_spoke_canvas = null;
  }

  function apply_stage_styles() {
    document.body.style.background = STAGE_BACKGROUND_COLOR;
    stage.style.aspectRatio = `${STAGE_WIDTH_PX} / ${STAGE_HEIGHT_PX}`;
    stage.style.width =
      `min(${STAGE_WIDTH_PX}px, calc(100vw - var(--editor-panel-space, 0px) - 3rem), ` +
      `calc((100svh - 5.5rem) * ${STAGE_ASPECT_RATIO}))`;
    stage.style.borderRadius = "0";
    stage.style.background = STAGE_BACKGROUND_COLOR;
    stage.style.borderColor = "transparent";
    stage.style.boxShadow = "none";
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

  function load_image(image_url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => {
        resolve(image);
      });
      image.addEventListener("error", () => {
        reject(new Error(`Failed to load image: ${image_url}`));
      });
      image.src = image_url;
    });
  }

  async function load_mascot_images() {
    const [face_image, halo_image] = await Promise.all([
      load_image(get_mascot_asset_url(config.mascot.face_asset_path)),
      load_image(get_mascot_asset_url(config.mascot.halo_asset_path))
    ]);

    runtime.mascot_face_image = face_image;
    runtime.mascot_halo_image = halo_image;
    invalidate_layer_caches();
  }

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
    const phase_mask_radius_px = 250 * geometry_scale;
    const phase_mask_center_offset_x_px = 50 * geometry_scale;
    const use_reference_phase_masks = generator.phase_count === 2;

    const spoke_specs = new Array(generator.spoke_count);
    const min_diameter_px =
      (config.point_style.min_diameter_px ?? config.point_style.min_rect_px ?? 0.9) * geometry_scale;

    for (let spoke_id = 0; spoke_id < generator.spoke_count; spoke_id += 1) {
      const spoke_pattern_id = wrap_positive(
        spoke_id - generator.pattern_offset_spokes,
        generator.spoke_count
      );

      const segment_id = Math.min(
        generator.phase_count - 1,
        Math.floor(spoke_pattern_id * generator.phase_count / generator.spoke_count)
      );
      const segment_start = Math.floor(segment_id * generator.spoke_count / generator.phase_count);
      const segment_end =
        Math.floor((segment_id + 1) * generator.spoke_count / generator.phase_count) - 1;
      const segment_length = Math.max(1, segment_end - segment_start + 1);
      const segment_index = spoke_pattern_id - segment_start;
      const fill_u = segment_length <= 1 ? 1 : segment_index / (segment_length - 1);
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
        compute_phase_frontier_dist_u(
          spoke_pattern_id,
          generator.spoke_count,
          generator.phase_count
        ),
        transition.phase_frontier_amount,
        transition.phase_frontier_width_u,
        transition.phase_frontier_bias,
        config.point_style.min_scale
      );
      const target_angle = base_angle_rad - TAU * spoke_id / generator.spoke_count;
      const phase_mask_center_x_px = segment_id === 0
        ? center_x_px - phase_mask_center_offset_x_px
        : center_x_px + phase_mask_center_offset_x_px;

      spoke_specs[spoke_id] = {
        target_angle,
        fill_u,
        reach_u,
        fill_end_radius: inner_radius + radius_span * reach_u,
        phase_frontier_scale,
        phase_mask_center_x_px,
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
      const is_upper_half = Math.sin(spoke_spec.target_angle) < 0;

      spokes[spoke_id] = {
        angle: spoke_spec.target_angle,
        phase_u: spoke_spec.fill_u,
        start_radius: config.spoke_lines.start_radius_px * geometry_scale,
        end_radius: outer_radius + config.spoke_lines.end_radius_extra_px * geometry_scale,
        echo_dot_origin_radius: inner_radius,
        echo_dot_step_px: generator.num_orbits <= 1 ? 0 : radius_span / (generator.num_orbits - 1),
        echo_dots: [],
        inner_clip_offset_px: phase_mask_center_offset_x_px,
        inner_clip_center_x_px: is_upper_half
          ? center_x_px - phase_mask_center_offset_x_px
          : center_x_px + phase_mask_center_offset_x_px,
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
          radius: point_metrics.radius,
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
    invalidate_layer_caches();
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

  function compute_screensaver_pulse_u(playback_time_sec) {
    const cycle_sec = get_screensaver_cycle_sec();
    if (cycle_sec <= 0 || playback_time_sec <= runtime.playback_end_sec) {
      return 1;
    }

    const cycle_phase = TAU * (playback_time_sec - runtime.playback_end_sec) / cycle_sec;
    return 0.5 + 0.5 * Math.cos(cycle_phase);
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
    const spoke_motion = Boolean(config.screensaver?.pulse_spokes) && max_spokes - min_spokes > 0.001;
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
    const phase_mask_radius_px = 250 * geometry_scale;
    const phase_mask_center_offset_x_px = 50 * geometry_scale;
    const use_reference_phase_masks = generator.phase_count === 2;
    const base_angle_rad = radians(generator.base_angle_deg) + rotation_rad;
    const effective_spoke_count = Math.max(1, compute_effective_spoke_count(playback_time_sec));
    const effective_orbit_count = Math.max(1, compute_effective_orbit_count(playback_time_sec));
    const orbit_step_px =
      effective_orbit_count <= 1 || radius_span_px <= 0
        ? radius_span_px
        : radius_span_px / Math.max(0.0001, effective_orbit_count - 1);
    const spoke_slots = Math.max(1, Math.ceil(effective_spoke_count));
    const full_frame_outer_radius_px = get_full_frame_spoke_outer_radius(center_x_px, center_y_px);
    const halo_outer_radius_px = mascot_box ? mascot_box.draw_size_px * 0.5 : outer_radius_px;
    const max_central_orbit_index = orbit_step_px > 0
      ? Math.max(0, Math.ceil(radius_span_px / orbit_step_px))
      : 0;
    const points = [];
    const spokes = [];

    for (let spoke_id = 0; spoke_id < spoke_slots; spoke_id += 1) {
      const spoke_alpha = smoothstep(0, 1, clamp(effective_spoke_count - spoke_id, 0, 1));
      if (spoke_alpha <= 0) {
        continue;
      }

      const spoke_pattern_id = wrap_positive(
        spoke_id - generator.pattern_offset_spokes,
        spoke_slots
      );
      const segment_id = Math.min(
        generator.phase_count - 1,
        Math.floor(spoke_pattern_id * generator.phase_count / spoke_slots)
      );
      const segment_start = Math.floor(segment_id * spoke_slots / generator.phase_count);
      const segment_end = Math.floor((segment_id + 1) * spoke_slots / generator.phase_count) - 1;
      const segment_length = Math.max(1, segment_end - segment_start + 1);
      const segment_index = spoke_pattern_id - segment_start;
      const fill_u = segment_length <= 1 ? 1 : segment_index / (segment_length - 1);
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
        compute_phase_frontier_dist_u(
          spoke_pattern_id,
          spoke_slots,
          generator.phase_count
        ),
        transition.phase_frontier_amount,
        transition.phase_frontier_width_u,
        transition.phase_frontier_bias,
        config.point_style.min_scale
      );
      const angle = base_angle_rad - TAU * spoke_id / spoke_slots;
      const phase_mask_center_x_px = segment_id === 0
        ? center_x_px - phase_mask_center_offset_x_px
        : center_x_px + phase_mask_center_offset_x_px;
      const spoke = {
        angle,
        alpha: spoke_alpha,
        phase_u: fill_u,
        start_radius: config.spoke_lines.start_radius_px * geometry_scale,
        end_radius: outer_radius_px + config.spoke_lines.end_radius_extra_px * geometry_scale,
        echo_dot_origin_radius: inner_radius_px,
        echo_dot_step_px: orbit_step_px,
        echo_dots: [],
        inner_clip_offset_px: phase_mask_center_offset_x_px,
        inner_clip_center_x_px: phase_mask_center_x_px,
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
          point_x - phase_mask_center_x_px,
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
          alpha: spoke_alpha
        });
      }

      spokes.push(spoke);
    }

    return {
      box: mascot_box,
      points,
      spokes,
      orbit_step_px,
      halo_outer_radius_px,
      full_frame_outer_radius_px
    };
  }

  function draw_annulus_sector(
    drawing_context,
    center_x_px,
    center_y_px,
    inner_radius_px,
    outer_radius_px,
    start_angle_rad,
    end_angle_rad,
    anticlockwise = false
  ) {
    drawing_context.beginPath();
    drawing_context.arc(
      center_x_px,
      center_y_px,
      outer_radius_px,
      start_angle_rad,
      end_angle_rad,
      anticlockwise
    );
    drawing_context.arc(
      center_x_px,
      center_y_px,
      inner_radius_px,
      end_angle_rad,
      start_angle_rad,
      !anticlockwise
    );
    drawing_context.closePath();
  }

  function draw_full_annulus(
    drawing_context,
    center_x_px,
    center_y_px,
    inner_radius_px,
    outer_radius_px
  ) {
    drawing_context.beginPath();
    drawing_context.arc(center_x_px, center_y_px, outer_radius_px, 0, TAU);
    drawing_context.arc(center_x_px, center_y_px, inner_radius_px, TAU, 0, true);
    drawing_context.closePath();
  }

  function draw_circle_band(
    drawing_context,
    center_x_px,
    center_y_px,
    inner_radius_px,
    outer_radius_px
  ) {
    drawing_context.beginPath();
    drawing_context.arc(center_x_px, center_y_px, outer_radius_px, 0, TAU);
    if (inner_radius_px > 0) {
      drawing_context.arc(center_x_px, center_y_px, inner_radius_px, TAU, 0, true);
    }
    drawing_context.closePath();
  }

  function get_full_frame_spoke_outer_radius(center_x_px, center_y_px) {
    const farthest_corner_dx_px = Math.max(center_x_px, STAGE_WIDTH_PX - center_x_px);
    const farthest_corner_dy_px = Math.max(center_y_px, STAGE_HEIGHT_PX - center_y_px);
    return Math.hypot(farthest_corner_dx_px, farthest_corner_dy_px);
  }

  function clip_finale_halo_region(
    drawing_context,
    box,
    halo_u,
    mask_start_angle_rad,
    sweep_end_angle_rad,
    halo_inner_radius_px,
    halo_outer_radius_px,
    force_final
  ) {
    if (halo_u <= 0) {
      return false;
    }

    if (force_final || halo_u >= 0.999) {
      draw_full_annulus(
        drawing_context,
        box.center_x_px,
        box.center_y_px,
        halo_inner_radius_px,
        halo_outer_radius_px
      );
    } else {
      draw_annulus_sector(
        drawing_context,
        box.center_x_px,
        box.center_y_px,
        halo_inner_radius_px,
        halo_outer_radius_px,
        mask_start_angle_rad,
        sweep_end_angle_rad,
        true
      );
    }

    drawing_context.clip();
    return true;
  }

  function trace_spoke_path(
    drawing_context,
    spoke,
    start_radius_px = spoke.start_radius,
    end_radius_px = spoke.end_radius
  ) {
    const x0 = config.composition.center_x_px + Math.cos(spoke.angle) * start_radius_px;
    const y0 = config.composition.center_y_px + Math.sin(spoke.angle) * start_radius_px;
    const x1 = config.composition.center_x_px + Math.cos(spoke.angle) * end_radius_px;
    const y1 = config.composition.center_y_px + Math.sin(spoke.angle) * end_radius_px;
    drawing_context.moveTo(x0, y0);
    drawing_context.lineTo(x1, y1);
  }

  function get_spoke_width_scale(spoke) {
    const phase_start_scale = clamp(config.spoke_lines.phase_start_scale ?? 1, 0.01, 1);
    return lerp(phase_start_scale, 1, clamp(spoke.phase_u ?? 1, 0, 1));
  }

  function get_spoke_echo_mask(spoke, echo_index) {
    return {
      center_x_px: spoke.inner_clip_center_x_px,
      center_y_px: spoke.inner_clip_center_y_px,
      radius_px: spoke.inner_clip_radius_px + spoke.inner_clip_offset_px * echo_index
    };
  }

  function get_background_spoke_canvas() {
    if (runtime.background_spoke_canvas || runtime.spokes.length === 0) {
      return runtime.background_spoke_canvas;
    }

    const { canvas: layer_canvas, context: layer_context } = create_layer_canvas(
      STAGE_WIDTH_PX,
      STAGE_HEIGHT_PX
    );
    const full_frame_outer_radius_px = get_full_frame_spoke_outer_radius(
      config.composition.center_x_px,
      config.composition.center_y_px
    );

    layer_context.clearRect(0, 0, STAGE_WIDTH_PX, STAGE_HEIGHT_PX);
    layer_context.globalAlpha = 1;
    layer_context.strokeStyle = config.spoke_lines.construction_color;
    layer_context.lineWidth = BACKGROUND_SPOKE_WIDTH_PX;

    for (let spoke_index = 0; spoke_index < runtime.spokes.length; spoke_index += 1) {
      const spoke = runtime.spokes[spoke_index];
      layer_context.beginPath();
      trace_spoke_path(layer_context, spoke, spoke.start_radius, full_frame_outer_radius_px);
      layer_context.stroke();
    }

    runtime.background_spoke_canvas = layer_canvas;
    return runtime.background_spoke_canvas;
  }

  function get_reference_halo_canvas(draw_size_px) {
    if (!runtime.mascot_halo_image) {
      return null;
    }

    const halo_size_px = Math.max(1, Math.round(draw_size_px));
    if (
      runtime.halo_reference_canvas &&
      runtime.halo_reference_canvas_size_px === halo_size_px
    ) {
      return runtime.halo_reference_canvas;
    }

    const { canvas: halo_canvas, context: halo_context } = create_layer_canvas(
      halo_size_px,
      halo_size_px
    );
    halo_context.clearRect(0, 0, halo_size_px, halo_size_px);
    halo_context.drawImage(runtime.mascot_halo_image, 0, 0, halo_size_px, halo_size_px);
    halo_context.globalCompositeOperation = "source-in";
    halo_context.fillStyle = HALO_REFERENCE_COLOR;
    halo_context.fillRect(0, 0, halo_size_px, halo_size_px);
    halo_context.globalCompositeOperation = "source-over";

    runtime.halo_reference_canvas = halo_canvas;
    runtime.halo_reference_canvas_size_px = halo_size_px;
    return halo_canvas;
  }

  function get_halo_layer_canvas(box) {
    if (
      runtime.halo_layer_canvas &&
      runtime.halo_layer_canvas_draw_size_px === box.draw_size_px
    ) {
      return runtime.halo_layer_canvas;
    }

    const { canvas: layer_canvas, context: layer_context } = create_layer_canvas(
      STAGE_WIDTH_PX,
      STAGE_HEIGHT_PX
    );
    const halo_outer_radius_px = box.draw_size_px * 0.5;
    const full_frame_spoke_outer_radius_px = get_full_frame_spoke_outer_radius(
      box.center_x_px,
      box.center_y_px
    );

    layer_context.clearRect(0, 0, STAGE_WIDTH_PX, STAGE_HEIGHT_PX);

    if (config.spoke_lines.show_reference_halo) {
      const halo_reference_canvas = get_reference_halo_canvas(box.draw_size_px);
      if (halo_reference_canvas) {
        layer_context.save();
        layer_context.globalAlpha = HALO_REFERENCE_OPACITY;
        layer_context.drawImage(
          halo_reference_canvas,
          box.left_px,
          box.top_px,
          box.draw_size_px,
          box.draw_size_px
        );
        layer_context.restore();
      }
    }

    const outer_width_px = Math.max(0, config.spoke_lines.width_px || 0);
    if (outer_width_px > 0) {
      layer_context.save();
      layer_context.strokeStyle = config.spoke_lines.reference_color;
      layer_context.globalAlpha = 1;
      layer_context.lineWidth = outer_width_px;
      for (let spoke_index = 0; spoke_index < runtime.spokes.length; spoke_index += 1) {
        const spoke = runtime.spokes[spoke_index];
        layer_context.beginPath();
        trace_spoke_path(layer_context, spoke, spoke.start_radius, halo_outer_radius_px);
        layer_context.stroke();
      }
      layer_context.restore();
    }

    const inner_width_px = Math.max(0, config.spoke_lines.inner_width_px || 0);
    if (inner_width_px > 0) {
      const echo_count = Math.max(0, Math.round(config.spoke_lines.echo_count || 0));
      const echo_dot_scale_mult = clamp(config.spoke_lines.echo_width_mult ?? 1, 0.01, 1);
      const echo_wave_count = Math.max(0, Number(config.spoke_lines.echo_wave_count || 0));
      const echo_fade_mult = clamp(config.spoke_lines.echo_opacity_mult ?? 1, 0, 1);
      const ripple_min_scale = 0.45;
      const ripple_max_scale = 1.55;
      const ripple_fade_start_u = lerp(0.2, 0.85, echo_fade_mult);

      for (let echo_index = 0; echo_index <= echo_count; echo_index += 1) {
        const dot_scale_mult = echo_index === 0 ? 1 : Math.pow(echo_dot_scale_mult, echo_index);
        if (dot_scale_mult <= 0) {
          continue;
        }

        for (let spoke_index = 0; spoke_index < runtime.spokes.length; spoke_index += 1) {
          const spoke = runtime.spokes[spoke_index];
          const clip_mask = get_spoke_echo_mask(spoke, echo_index);
          const previous_clip_radius_px = echo_index === 0
            ? 0
            : get_spoke_echo_mask(spoke, echo_index - 1).radius_px;

          layer_context.save();
          draw_circle_band(
            layer_context,
            clip_mask.center_x_px,
            clip_mask.center_y_px,
            previous_clip_radius_px,
            clip_mask.radius_px
          );
          layer_context.clip();

          if (echo_index === 0) {
            layer_context.strokeStyle = config.spoke_lines.color;
            layer_context.lineWidth = inner_width_px * get_spoke_width_scale(spoke);
            layer_context.beginPath();
            trace_spoke_path(
              layer_context,
              spoke,
              spoke.start_radius,
              full_frame_spoke_outer_radius_px
            );
            layer_context.stroke();
            layer_context.restore();
            continue;
          }

          layer_context.fillStyle = config.spoke_lines.color;
          const dot_templates = spoke.echo_dots;
          const orbit_step_px = spoke.echo_dot_step_px;
          if (!dot_templates.length || orbit_step_px <= 0) {
            layer_context.restore();
            continue;
          }

          const max_orbit_index = Math.ceil(
            (full_frame_spoke_outer_radius_px - spoke.echo_dot_origin_radius) / orbit_step_px
          );
          const ripple_span_px = Math.max(
            1,
            full_frame_spoke_outer_radius_px - spoke.echo_dot_origin_radius
          );
          for (let orbit_index = 0; orbit_index <= max_orbit_index; orbit_index += 1) {
            const template_dot = dot_templates[Math.min(orbit_index, dot_templates.length - 1)];
            const dot_radius = spoke.echo_dot_origin_radius + orbit_index * orbit_step_px;
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
            const capped_dot_scale_mult = Math.min(1, dot_scale_mult * ripple_scale);
            const dot_radius_px = template_dot.radius_px * capped_dot_scale_mult;
            if (dot_radius_px <= 0) {
              continue;
            }

            const dot_alpha = 1 - smoothstep(ripple_fade_start_u, 1, ripple_u);
            if (dot_alpha <= 0) {
              continue;
            }

            const dot_x = config.composition.center_x_px + Math.cos(spoke.angle) * dot_radius;
            const dot_y = config.composition.center_y_px + Math.sin(spoke.angle) * dot_radius;
            layer_context.globalAlpha = dot_alpha;
            layer_context.beginPath();
            layer_context.arc(dot_x, dot_y, dot_radius_px, 0, TAU);
            layer_context.fill();
          }
          layer_context.restore();
        }
      }
    }

    runtime.halo_layer_canvas = layer_canvas;
    runtime.halo_layer_canvas_draw_size_px = box.draw_size_px;
    return runtime.halo_layer_canvas;
  }

  function draw_mascot_nose(box, nose_offset_px, base_alpha) {
    if (base_alpha <= 0) {
      return;
    }

    const scale = box.draw_size_px / MASCOT_VIEWBOX_SIZE;
    if (scale <= 0) {
      return;
    }

    context.save();
    context.translate(box.left_px, box.top_px);
    context.scale(scale, scale);
    context.globalAlpha = base_alpha;
    context.fillStyle = config.mascot.color;
    context.fill(MASCOT_NOSE_PATH);
    context.translate(0, -nose_offset_px / scale);
    context.fillStyle = STAGE_BACKGROUND_COLOR;
    context.fill(MASCOT_NOSE_PATH);
    context.restore();
  }

  function draw_mascot_eyes(box, eye_amount, base_alpha) {
    const closed_eye_scale_y = clamp(config.blink.eye_scale_y_closed, 0.02, 1);
    const eye_scale_y = lerp(1, closed_eye_scale_y, eye_amount);

    context.save();
    context.fillStyle = "#ffffff";
    context.globalAlpha = base_alpha;

    for (let eye_index = 0; eye_index < MASCOT_EYE_SPECS.length; eye_index += 1) {
      const eye = MASCOT_EYE_SPECS[eye_index];
      const center_x_px = box.left_px + box.draw_size_px * (eye.cx / MASCOT_VIEWBOX_SIZE);
      const center_y_px = box.top_px + box.draw_size_px * (eye.cy / MASCOT_VIEWBOX_SIZE);
      const radius_x_px = box.draw_size_px * (eye.radius / MASCOT_VIEWBOX_SIZE);
      const radius_y_px = Math.max(0.75, radius_x_px * eye_scale_y);

      context.beginPath();
      context.ellipse(center_x_px, center_y_px, radius_x_px, radius_y_px, 0, 0, TAU);
      context.fill();
    }

    context.restore();
  }

  function draw_background_spokes() {
    const layer_canvas = get_background_spoke_canvas();
    if (!layer_canvas) {
      return;
    }
    context.drawImage(layer_canvas, 0, 0);
  }

  function draw_post_finale_background_spokes(field_state) {
    if (!field_state || field_state.spokes.length === 0) {
      return;
    }

    context.save();
    context.strokeStyle = config.spoke_lines.construction_color;
    context.lineWidth = BACKGROUND_SPOKE_WIDTH_PX;

    for (let spoke_index = 0; spoke_index < field_state.spokes.length; spoke_index += 1) {
      const spoke = field_state.spokes[spoke_index];
      if (spoke.alpha <= 0) {
        continue;
      }
      context.globalAlpha = spoke.alpha;
      context.beginPath();
      trace_spoke_path(context, spoke, spoke.start_radius, field_state.full_frame_outer_radius_px);
      context.stroke();
    }

    context.restore();
  }

  function draw_post_finale_points(field_state) {
    if (!field_state || field_state.points.length === 0) {
      return;
    }

    context.save();
    context.fillStyle = config.point_style.color;

    for (let point_index = 0; point_index < field_state.points.length; point_index += 1) {
      const point = field_state.points[point_index];
      const point_alpha = config.point_style.alpha * point.alpha;
      if (point_alpha <= 0 || point.radius_px <= 0) {
        continue;
      }

      context.globalAlpha = point_alpha;
      context.beginPath();
      context.moveTo(point.x + point.radius_px, point.y);
      context.arc(point.x, point.y, point.radius_px, 0, TAU);
      context.fill();
    }

    context.restore();
  }

  function draw_post_finale_halo(field_state) {
    if (!field_state || !field_state.box) {
      return;
    }

    const box = field_state.box;

    if (config.spoke_lines.show_reference_halo) {
      const halo_reference_canvas = get_reference_halo_canvas(box.draw_size_px);
      if (halo_reference_canvas) {
        context.save();
        context.globalAlpha = HALO_REFERENCE_OPACITY;
        context.drawImage(
          halo_reference_canvas,
          box.left_px,
          box.top_px,
          box.draw_size_px,
          box.draw_size_px
        );
        context.restore();
      }
    }

    const outer_width_px = Math.max(0, config.spoke_lines.width_px || 0);
    if (outer_width_px > 0) {
      context.save();
      context.strokeStyle = config.spoke_lines.reference_color;
      context.lineWidth = outer_width_px;
      for (let spoke_index = 0; spoke_index < field_state.spokes.length; spoke_index += 1) {
        const spoke = field_state.spokes[spoke_index];
        if (spoke.alpha <= 0) {
          continue;
        }
        context.globalAlpha = spoke.alpha;
        context.beginPath();
        trace_spoke_path(context, spoke, spoke.start_radius, field_state.halo_outer_radius_px);
        context.stroke();
      }
      context.restore();
    }

    const inner_width_px = Math.max(0, config.spoke_lines.inner_width_px || 0);
    if (inner_width_px <= 0) {
      return;
    }

    const echo_count = Math.max(0, Math.round(config.spoke_lines.echo_count || 0));
    const echo_dot_scale_mult = clamp(config.spoke_lines.echo_width_mult ?? 1, 0.01, 1);
    const echo_wave_count = Math.max(0, Number(config.spoke_lines.echo_wave_count || 0));
    const echo_fade_mult = clamp(config.spoke_lines.echo_opacity_mult ?? 1, 0, 1);
    const ripple_min_scale = 0.45;
    const ripple_max_scale = 1.55;
    const ripple_fade_start_u = lerp(0.2, 0.85, echo_fade_mult);

    for (let echo_index = 0; echo_index <= echo_count; echo_index += 1) {
      const dot_scale_mult = echo_index === 0 ? 1 : Math.pow(echo_dot_scale_mult, echo_index);
      if (dot_scale_mult <= 0) {
        continue;
      }

      for (let spoke_index = 0; spoke_index < field_state.spokes.length; spoke_index += 1) {
        const spoke = field_state.spokes[spoke_index];
        if (spoke.alpha <= 0) {
          continue;
        }

        const clip_mask = get_spoke_echo_mask(spoke, echo_index);
        const previous_clip_radius_px = echo_index === 0
          ? 0
          : get_spoke_echo_mask(spoke, echo_index - 1).radius_px;

        context.save();
        draw_circle_band(
          context,
          clip_mask.center_x_px,
          clip_mask.center_y_px,
          previous_clip_radius_px,
          clip_mask.radius_px
        );
        context.clip();

        if (echo_index === 0) {
          context.globalAlpha = spoke.alpha;
          context.strokeStyle = config.spoke_lines.color;
          context.lineWidth = inner_width_px * get_spoke_width_scale(spoke);
          context.beginPath();
          trace_spoke_path(
            context,
            spoke,
            spoke.start_radius,
            field_state.full_frame_outer_radius_px
          );
          context.stroke();
          context.restore();
          continue;
        }

        const dot_templates = spoke.echo_dots;
        const orbit_step_px = spoke.echo_dot_step_px;
        if (!dot_templates.length || orbit_step_px <= 0) {
          context.restore();
          continue;
        }

        context.fillStyle = config.spoke_lines.color;
        const max_orbit_index = Math.ceil(
          (field_state.full_frame_outer_radius_px - spoke.echo_dot_origin_radius) / orbit_step_px
        );
        const ripple_span_px = Math.max(
          1,
          field_state.full_frame_outer_radius_px - spoke.echo_dot_origin_radius
        );

        for (let orbit_index = 0; orbit_index <= max_orbit_index; orbit_index += 1) {
          const template_dot = dot_templates[Math.min(orbit_index, dot_templates.length - 1)];
          const dot_radius = spoke.echo_dot_origin_radius + orbit_index * orbit_step_px;
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
          const capped_dot_scale_mult = Math.min(1, dot_scale_mult * ripple_scale);
          const dot_radius_px = template_dot.radius_px * capped_dot_scale_mult;
          if (dot_radius_px <= 0) {
            continue;
          }

          const dot_alpha = spoke.alpha * (1 - smoothstep(ripple_fade_start_u, 1, ripple_u));
          if (dot_alpha <= 0) {
            continue;
          }

          const dot_x = config.composition.center_x_px + Math.cos(spoke.angle) * dot_radius;
          const dot_y = config.composition.center_y_px + Math.sin(spoke.angle) * dot_radius;
          context.globalAlpha = dot_alpha;
          context.beginPath();
          context.arc(dot_x, dot_y, dot_radius_px, 0, TAU);
          context.fill();
        }

        context.restore();
      }
    }
  }

  function draw_mascot(playback_time_sec, force_final, options = {}) {
    if (!config.mascot.enabled || !runtime.mascot_face_image || !runtime.mascot_box) {
      return;
    }

    const box = runtime.mascot_box;
    const draw_halo_layer = options.draw_halo_layer !== false;
    const fade_amount = force_final ? 1 : compute_mascot_fade_amount(playback_time_sec);
    const base_alpha = clamp(config.mascot.opacity * fade_amount, 0, 1);
    if (base_alpha <= 0) {
      return;
    }

    const head_turn_deg = force_final ? 0 : compute_head_turn_deg(playback_time_sec);
    const blink_amount = force_final ? 0 : compute_blink_amount(playback_time_sec);
    const head_turn_eye_amount = force_final
      ? 0
      : compute_head_turn_eye_squint_amount(playback_time_sec);
    const combined_eye_amount = Math.max(blink_amount, head_turn_eye_amount);
    const nose_bob_px = config.sneeze.enabled
      ? config.sneeze.nose_bob_up_px * combined_eye_amount
      : 0;
    const { halo_u } = compute_finale_progress(playback_time_sec, force_final);
    const pattern_angle_offset_rad =
      -TAU * (config.generator_wrangle.pattern_offset_spokes || 0) /
      Math.max(1, config.generator_wrangle.spoke_count || 1);
    const mask_start_angle_rad =
      radians((config.finale.start_angle_deg || 0) + (config.finale.mask_angle_offset_deg || 0)) +
      pattern_angle_offset_rad +
      radians(config.composition.global_rotation_deg || 0);
    const sweep_end_angle_rad = mask_start_angle_rad - TAU * halo_u;
    const halo_inner_radius_px =
      box.draw_size_px * clamp(config.finale.halo_inner_radius_u, 0.01, 0.5);
    const halo_outer_radius_px = box.draw_size_px * 0.5;
    const full_frame_spoke_outer_radius_px = get_full_frame_spoke_outer_radius(
      box.center_x_px,
      box.center_y_px
    );
    const halo_layer_canvas = get_halo_layer_canvas(box);

    context.save();
    context.imageSmoothingEnabled = true;
    context.translate(box.center_x_px, box.center_y_px);
    context.rotate(radians(head_turn_deg));
    context.translate(-box.center_x_px, -box.center_y_px);

    if (draw_halo_layer && halo_layer_canvas && halo_u > 0) {
      context.save();
      if (
        clip_finale_halo_region(
          context,
          box,
          halo_u,
          mask_start_angle_rad,
          sweep_end_angle_rad,
          halo_inner_radius_px,
          full_frame_spoke_outer_radius_px,
          force_final
        )
      ) {
        context.globalAlpha = base_alpha;
        context.drawImage(halo_layer_canvas, 0, 0);
      }
      context.restore();
    }

    context.globalAlpha = base_alpha;
    context.drawImage(
      runtime.mascot_face_image,
      box.left_px,
      box.top_px,
      box.draw_size_px,
      box.draw_size_px
    );
    draw_mascot_nose(box, nose_bob_px, base_alpha);
    draw_mascot_eyes(box, combined_eye_amount, base_alpha);
    context.restore();
  }

  function draw_points(time_sec, force_final) {
    if (runtime.points.length === 0) {
      return;
    }

    context.save();
    context.fillStyle = config.point_style.color;
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

      context.globalAlpha = point_alpha;
      context.beginPath();
      context.moveTo(point_x + point.radius_px, point_y);
      context.arc(point_x, point_y, point.radius_px, 0, TAU);
      context.fill();
    }

    context.restore();
  }

  function render_scene(time_sec, options = {}) {
    const force_dot_final = Boolean(options.force_dot_final);
    const force_mascot_final = Boolean(options.force_mascot_final);
    const playback_time_sec = options.playback_time_sec ?? time_sec;
    const use_dynamic_post_finale_field = is_post_finale_dynamic_field_active(playback_time_sec);

    context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = STAGE_BACKGROUND_COLOR;
    context.fillRect(0, 0, STAGE_WIDTH_PX, STAGE_HEIGHT_PX);

    if (use_dynamic_post_finale_field) {
      const field_state = build_post_finale_field_state(playback_time_sec);
      draw_post_finale_background_spokes(field_state);
      draw_post_finale_points(field_state);
      draw_post_finale_halo(field_state);
      draw_mascot(playback_time_sec, true, { draw_halo_layer: false });
      return;
    }

    draw_background_spokes();
    draw_points(time_sec, force_dot_final);
    draw_mascot(playback_time_sec, force_mascot_final);
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

  function start_animation() {
    stop_animation();
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
    canvas.width = STAGE_WIDTH_PX;
    canvas.height = STAGE_HEIGHT_PX;

    runtime.dpr = 1;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.imageSmoothingEnabled = false;

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
      runtime.mascot_face_image = null;
      runtime.mascot_halo_image = null;
      runtime.mascot_box = null;
      invalidate_layer_caches();
    } else if (
      options.reload_mascot ||
      !runtime.mascot_face_image ||
      !runtime.mascot_halo_image
    ) {
      await load_mascot_images();
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
      canvas.toBlob((blob) => {
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
    getPlaybackEndSec() {
      return runtime.playback_end_sec;
    },
    handleViewportResize: handle_viewport_resize,
    invalidateLayerCaches: invalidate_layer_caches,
    refreshScene: refresh_scene,
    renderCurrentFrame: render_current_frame,
    renderPlaybackFrame: render_playback_frame,
    startAnimation: start_animation,
    stopAnimation: stop_animation
  };
}
