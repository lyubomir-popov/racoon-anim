import {
  TAU,
  COMPOSITION_SIZE_PX,
  MASCOT_VIEWBOX_SIZE,
  clamp,
  compute_frontier_scale,
  lerp,
  radians,
  smoothstep,
  wrap_positive
} from "./config-schema.js";

export function get_display_phase_metrics({
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

export function get_phase_mask_geometry({
  box,
  center_x_px,
  center_y_px,
  outer_radius_px = 0
}) {
  const geometry_scale = box ? box.draw_size_px / MASCOT_VIEWBOX_SIZE : 1;
  const legacy_radius_px = 250 * geometry_scale;
  const halo_clear_radius_px = Math.max(
    0,
    Number(outer_radius_px || 0),
    box ? box.draw_size_px * 0.5 : 0
  );
  const field_radius_px = Math.max(legacy_radius_px, halo_clear_radius_px + 4 * geometry_scale);
  const center_offset_x_px = 50 * geometry_scale;
  return {
    legacy_radius_px,
    field_radius_px,
    center_offset_x_px,
    center_y_px,
    left_center_x_px: center_x_px - center_offset_x_px,
    right_center_x_px: center_x_px + center_offset_x_px
  };
}

export function get_width_transition_phase_metrics({
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

function create_field_base({
  config,
  mascot_box
}) {
  const generator = config.generator_wrangle;
  const transition = config.transition_wrangle;
  const center_x_px = config.composition.center_x_px;
  const center_y_px = config.composition.center_y_px;
  const radial_scale = config.composition.radial_scale;
  const rotation_rad = radians(config.composition.global_rotation_deg || 0);
  const geometry_scale = mascot_box ? mascot_box.draw_size_px / MASCOT_VIEWBOX_SIZE : 1;
  const inner_radius_px = COMPOSITION_SIZE_PX * radial_scale * generator.inner_radius * geometry_scale;
  const outer_radius_px = COMPOSITION_SIZE_PX * radial_scale * generator.outer_radius * geometry_scale;
  const radius_span_px = Math.max(0, outer_radius_px - inner_radius_px);
  const base_pscale_px =
    transition.base_pscale * config.point_style.base_pscale_px_per_unit * geometry_scale;
  const min_diameter_px =
    (config.point_style.min_diameter_px ?? config.point_style.min_rect_px ?? 0.9) * geometry_scale;
  const point_style_min_scale = config.point_style.min_scale;
  const phase_mask = get_phase_mask_geometry({
    box: mascot_box,
    center_x_px,
    center_y_px,
    outer_radius_px
  });

  return {
    generator,
    transition,
    center_x_px,
    center_y_px,
    geometry_scale,
    inner_radius_px,
    outer_radius_px,
    radius_span_px,
    base_pscale_px,
    min_diameter_px,
    point_style_min_scale,
    phase_mask_legacy_radius_px: phase_mask.legacy_radius_px,
    phase_mask_field_radius_px: phase_mask.field_radius_px,
    phase_mask_center_offset_x_px: phase_mask.center_offset_x_px,
    use_reference_phase_masks: generator.phase_count === 2,
    base_angle_rad: radians(generator.base_angle_deg) + rotation_rad
  };
}

function get_phase_state_for_angle({
  angle_rad,
  base_angle_rad,
  slot_count,
  phase_count,
  spoke_pattern_id,
  center_x_px,
  phase_mask_center_offset_x_px,
  transition,
  min_scale
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

  return {
    fill_u: phase_metrics.fill_u,
    phase_frontier_scale: compute_frontier_scale(
      phase_metrics.phase_frontier_u,
      transition.phase_frontier_amount,
      transition.phase_frontier_width_u,
      transition.phase_frontier_bias,
      min_scale
    ),
    phase_mask_center_x_px: phase_metrics.phase_mask_center_x_px
  };
}

function build_spoke_orbit_points({
  context,
  angle_rad,
  clip_center_x_px,
  fill_end_radius_px,
  reach_u,
  phase_frontier_scale,
  orbit_count,
  orbit_step_px,
  max_orbit_index
}) {
  const {
    transition,
    center_x_px,
    center_y_px,
    inner_radius_px,
    outer_radius_px,
    radius_span_px,
    base_pscale_px,
    min_diameter_px,
    point_style_min_scale,
    phase_mask_field_radius_px,
    use_reference_phase_masks
  } = context;
  const point_specs = [];
  const echo_dots = [];

  for (let orbit_index = 0; orbit_index <= max_orbit_index; orbit_index += 1) {
    const radius_px = inner_radius_px + orbit_index * orbit_step_px;
    if (radius_px > outer_radius_px + 0.01) {
      break;
    }

    const orbit_u = radius_span_px <= 0
      ? 0
      : clamp((radius_px - inner_radius_px) / Math.max(0.0001, radius_span_px), 0, 1);
    const point_x = center_x_px + Math.cos(angle_rad) * radius_px;
    const point_y = center_y_px + Math.sin(angle_rad) * radius_px;
    const orbital_frontier_scale = compute_frontier_scale(
      Math.max(0, reach_u - orbit_u),
      transition.orbital_frontier_amount,
      transition.orbital_frontier_width_u,
      transition.orbital_frontier_bias,
      point_style_min_scale
    );
    const diameter_px = Math.max(
      min_diameter_px,
      base_pscale_px * orbital_frontier_scale * phase_frontier_scale
    );
    const radius_px_dot = diameter_px * 0.5;
    const phase_mask_distance_px = Math.hypot(
      point_x - clip_center_x_px,
      point_y - center_y_px
    );
    const fits_within_spoke = use_reference_phase_masks
      ? phase_mask_distance_px + radius_px_dot <= phase_mask_field_radius_px + 0.01
      : radius_px + radius_px_dot <= fill_end_radius_px + 0.01;

    if (!fits_within_spoke) {
      continue;
    }

    echo_dots.push({
      radius_px: radius_px_dot
    });
    point_specs.push({
      orbit_id: orbit_index,
      radius: radius_px,
      x: point_x,
      y: point_y,
      diameter_px,
      radius_px: radius_px_dot
    });
  }

  return {
    point_specs,
    echo_dots
  };
}

export function build_intro_halo_field_state({
  config,
  mascot_box
}) {
  const context = create_field_base({ config, mascot_box });
  const {
    generator,
    transition,
    center_x_px,
    center_y_px,
    geometry_scale,
    inner_radius_px,
    outer_radius_px,
    radius_span_px,
    phase_mask_field_radius_px,
    phase_mask_center_offset_x_px,
    base_angle_rad
  } = context;
  const orbit_step_px = generator.num_orbits <= 1 ? 0 : radius_span_px / (generator.num_orbits - 1);
  const max_orbit_index = Math.max(0, generator.num_orbits - 1);
  const spokes = new Array(generator.spoke_count);
  const point_specs = [];
  const orbit_counts = new Array(generator.num_orbits).fill(0);
  const label_anchor_slot_id = Math.floor(generator.spoke_count * 0.5);

  for (let spoke_id = 0; spoke_id < generator.spoke_count; spoke_id += 1) {
    const spoke_pattern_id = wrap_positive(
      spoke_id - generator.pattern_offset_spokes,
      generator.spoke_count
    );
    const target_angle = base_angle_rad + TAU * spoke_id / generator.spoke_count;
    const phase_state = get_phase_state_for_angle({
      angle_rad: target_angle,
      base_angle_rad,
      slot_count: generator.spoke_count,
      phase_count: generator.phase_count,
      spoke_pattern_id,
      center_x_px,
      phase_mask_center_offset_x_px,
      transition,
      min_scale: config.point_style.min_scale
    });
    const continuous_active_orbits = clamp(
      generator.min_active_orbits +
        phase_state.fill_u * (generator.num_orbits - generator.min_active_orbits),
      generator.min_active_orbits,
      generator.num_orbits
    );
    const reach_u = generator.num_orbits <= 1
      ? 1
      : (continuous_active_orbits - 1) / (generator.num_orbits - 1);
    const fill_end_radius_px = inner_radius_px + radius_span_px * reach_u;
    const spoke_points = build_spoke_orbit_points({
      context,
      angle_rad: target_angle,
      clip_center_x_px: phase_state.phase_mask_center_x_px,
      fill_end_radius_px,
      reach_u,
      phase_frontier_scale: phase_state.phase_frontier_scale,
      orbit_count: generator.num_orbits,
      orbit_step_px,
      max_orbit_index
    });

    spokes[spoke_id] = {
      source_spoke_id: spoke_id,
      display_slot_id: spoke_id,
      label_slot_id: wrap_positive(label_anchor_slot_id - spoke_id, generator.spoke_count),
      spoke_pattern_id,
      angle: target_angle,
      phase_u: phase_state.fill_u,
      start_radius: config.spoke_lines.start_radius_px * geometry_scale,
      end_radius: outer_radius_px + config.spoke_lines.end_radius_extra_px * geometry_scale,
      echo_dot_origin_radius: inner_radius_px,
      echo_dot_step_px: orbit_step_px,
      echo_dots: spoke_points.echo_dots,
      inner_clip_offset_px: phase_mask_center_offset_x_px,
      inner_clip_center_x_px: phase_state.phase_mask_center_x_px,
      inner_clip_center_y_px: center_y_px,
      phase_field_radius_px: phase_mask_field_radius_px
    };

    for (const point_spec of spoke_points.point_specs) {
      orbit_counts[point_spec.orbit_id] += 1;
      point_specs.push({
        spoke_id,
        target_angle,
        ...point_spec
      });
    }
  }

  return {
    box: mascot_box,
    geometry_scale,
    orbit_counts,
    max_orbit_count: Math.max(1, ...orbit_counts),
    point_specs,
    spokes,
    visible_spoke_count: generator.spoke_count
  };
}

export function build_post_finale_halo_field_state({
  config,
  mascot_box,
  playback_time_sec,
  effective_spoke_count,
  effective_orbit_count,
  previous_width_phase_u_by_source,
  previous_clip_center_x_by_source,
  last_width_transition_time_sec,
  full_frame_outer_radius_px
}) {
  const context = create_field_base({ config, mascot_box });
  const {
    generator,
    transition,
    center_x_px,
    center_y_px,
    geometry_scale,
    inner_radius_px,
    outer_radius_px,
    radius_span_px,
    phase_mask_field_radius_px,
    phase_mask_center_offset_x_px,
    base_angle_rad
  } = context;
  const orbit_step_px =
    effective_orbit_count <= 1 || radius_span_px <= 0
      ? radius_span_px
      : radius_span_px / Math.max(0.0001, effective_orbit_count - 1);
  const max_central_orbit_index = orbit_step_px > 0
    ? Math.max(0, Math.ceil(radius_span_px / orbit_step_px))
    : 0;
  const max_spoke_count = Math.max(1, Math.round(generator.spoke_count || 1));
  const total_turns = max_spoke_count / Math.max(1, effective_spoke_count);
  const seam_display_u = 0.5;
  const width_transition_duration_sec = Math.max(
    0,
    Number(config.screensaver?.phase_boundary_transition_sec || 0)
  );
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
  const halo_outer_radius_px = mascot_box ? mascot_box.draw_size_px * 0.5 : outer_radius_px;
  const points = [];
  const spokes = [];

  for (let source_index = 0; source_index < max_spoke_count; source_index += 1) {
    const strip_u = source_index / max_spoke_count;
    const wrapped_turn_position = strip_u * total_turns;
    if (wrapped_turn_position >= 1) {
      continue;
    }

    const display_u = wrap_positive(seam_display_u - wrapped_turn_position, 1);
    const display_slot_id = wrap_positive(
      Math.round(display_u * max_spoke_count),
      max_spoke_count
    );
    const angle = base_angle_rad + TAU * display_u;
    const spoke_pattern_id = wrap_positive(
      source_index - generator.pattern_offset_spokes,
      max_spoke_count
    );
    const phase_state = get_phase_state_for_angle({
      angle_rad: angle,
      base_angle_rad,
      slot_count: max_spoke_count,
      phase_count: generator.phase_count,
      spoke_pattern_id,
      center_x_px,
      phase_mask_center_offset_x_px,
      transition,
      min_scale: config.point_style.min_scale
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
    const previous_width_phase_u = previous_width_phase_u_by_source.get(source_index);
    const previous_clip_center_x_px = previous_clip_center_x_by_source.get(source_index);
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
        phase_state.fill_u * (effective_orbit_count - generator.min_active_orbits),
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
    const spoke_points = build_spoke_orbit_points({
      context,
      angle_rad: angle,
      clip_center_x_px,
      fill_end_radius_px,
      reach_u,
      phase_frontier_scale: phase_state.phase_frontier_scale,
      orbit_count: effective_orbit_count,
      orbit_step_px,
      max_orbit_index: max_central_orbit_index
    });

    const spoke = {
      source_spoke_id: source_index,
      display_slot_id,
      label_slot_id: source_index,
      spoke_pattern_id,
      angle,
      alpha: 1,
      phase_u: phase_state.fill_u,
      width_phase_u,
      seam_overlay_only: false,
      start_radius: config.spoke_lines.start_radius_px * geometry_scale,
      end_radius: outer_radius_px + config.spoke_lines.end_radius_extra_px * geometry_scale,
      echo_dot_origin_radius: inner_radius_px,
      echo_dot_step_px: orbit_step_px,
      echo_dots: spoke_points.echo_dots,
      inner_clip_offset_px: phase_mask_center_offset_x_px,
      inner_clip_center_x_px: clip_center_x_px,
      inner_clip_center_y_px: center_y_px,
      phase_field_radius_px: phase_mask_field_radius_px
    };

    for (const point_spec of spoke_points.point_specs) {
      points.push({
        x: point_spec.x,
        y: point_spec.y,
        radius_px: point_spec.radius_px,
        alpha: 1
      });
    }

    spokes.push(spoke);
  }

  return {
    box: mascot_box,
    points,
    spokes,
    visible_spoke_count: effective_spoke_count,
    halo_outer_radius_px,
    full_frame_outer_radius_px,
    next_spoke_width_phase_u_by_source,
    next_spoke_clip_center_x_by_source,
    spoke_width_transition_playback_time_sec: playback_time_sec
  };
}
