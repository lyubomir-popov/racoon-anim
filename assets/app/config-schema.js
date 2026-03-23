import SOURCE_DEFAULT_CONFIG from "./default-config-source.js";

export const TAU = Math.PI * 2;
export const OUTPUT_PROFILES = Object.freeze({
  authoring_full_hd: Object.freeze({
    key: "authoring_full_hd",
    label: "Authoring Full HD",
    width_px: 1920,
    height_px: 1080,
    kind: "authoring"
  }),
  led_wall_7680x2160: Object.freeze({
    key: "led_wall_7680x2160",
    label: "LED Wall 7680 x 2160",
    width_px: 7680,
    height_px: 2160,
    kind: "largest_target"
  })
});
export const DEFAULT_OUTPUT_PROFILE_KEY = "authoring_full_hd";
export const LARGEST_OUTPUT_PROFILE_KEY = "led_wall_7680x2160";

export function get_output_profile(profile_key = DEFAULT_OUTPUT_PROFILE_KEY) {
  return OUTPUT_PROFILES[profile_key] || OUTPUT_PROFILES[DEFAULT_OUTPUT_PROFILE_KEY];
}

export function get_output_profile_metrics(profile_or_key = DEFAULT_OUTPUT_PROFILE_KEY) {
  const profile = typeof profile_or_key === "string"
    ? get_output_profile(profile_or_key)
    : profile_or_key;
  const width_px = profile.width_px;
  const height_px = profile.height_px;

  return Object.freeze({
    ...profile,
    aspect_ratio: width_px / height_px,
    center_x_px: width_px * 0.5,
    center_y_px: height_px * 0.5
  });
}

export const DEFAULT_OUTPUT_PROFILE = get_output_profile_metrics(DEFAULT_OUTPUT_PROFILE_KEY);
export const LARGEST_OUTPUT_PROFILE = get_output_profile_metrics(LARGEST_OUTPUT_PROFILE_KEY);
export const STAGE_WIDTH_PX = DEFAULT_OUTPUT_PROFILE.width_px;
export const STAGE_HEIGHT_PX = DEFAULT_OUTPUT_PROFILE.height_px;
export const STAGE_ASPECT_RATIO = DEFAULT_OUTPUT_PROFILE.aspect_ratio;
export const COMPOSITION_SIZE_PX = 600;
export const STAGE_BACKGROUND_COLOR = "#262626";
export const BACKGROUND_SPOKE_WIDTH_PX = 1;
export const MASCOT_VIEWBOX_SIZE = 600;
export const COMPOSITION_CENTER_X_PX = DEFAULT_OUTPUT_PROFILE.center_x_px;
export const COMPOSITION_CENTER_Y_PX = DEFAULT_OUTPUT_PROFILE.center_y_px;
export const MASCOT_EYE_SPECS = Object.freeze([
  Object.freeze({ cx: 260, cy: 290.25, radius: 8 }),
  Object.freeze({ cx: 340, cy: 290.25, radius: 8 })
]);
export const MASCOT_NOSE_PATH_DATA =
  "M314.719,325.951c1.206.283,1.861,1.609,1.362,2.749-3.479,7.962-8.503,15.086-14.69,20.992-.78.744-2.004.744-2.784,0-6.186-5.905-11.211-13.029-14.69-20.992-.498-1.14.156-2.466,1.362-2.749,4.728-1.111,9.655-1.701,14.719-1.701s9.991.59,14.719,1.701Z";
export const HALO_REFERENCE_COLOR = "#30d158";
export const HALO_REFERENCE_OPACITY = 0.5;

export const PRESET_STORAGE_KEY = "radial-mascot-presets-v1";
export const ACTIVE_PRESET_STORAGE_KEY = "radial-mascot-active-preset-v1";
export const EXPORT_DIRECTORY_DB_NAME = "radial-mascot-local-editor";
export const EXPORT_DIRECTORY_STORE_NAME = "handles";
export const EXPORT_DIRECTORY_KEY = "preset-export-directory";
export const DOCKED_EDITOR_MIN_WIDTH_PX = 1500;

export const EDITOR_TAB_GROUPS = Object.freeze([
  Object.freeze({
    key: "presets",
    label: "Presets",
    sections: Object.freeze([])
  }),
  Object.freeze({
    key: "motion",
    label: "Motion",
    sections: Object.freeze(["head_turn", "blink", "finale"])
  }),
  Object.freeze({
    key: "field",
    label: "Field",
    sections: Object.freeze(["generator_wrangle", "spoke_lines", "screensaver"])
  }),
  Object.freeze({
    key: "dots",
    label: "Dots",
    sections: Object.freeze(["transition_wrangle", "point_style"])
  }),
  Object.freeze({
    key: "mascot",
    label: "Mascot",
    sections: Object.freeze(["mascot"])
  })
]);

export const CONFIG_FIELD_META = Object.freeze({
  "mascot_fade.enabled": {
    locked_value: false
  },
  "mascot_fade.duration_sec": {
    numeric: { min: 0, max: 3, step: 0.01 }
  },
  "head_turn.enabled": {
    hidden: true,
    locked_value: true
  },
  "head_turn.duration_sec": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "head_turn.peak_angle_deg": {
    numeric: { min: -90, max: 90, step: 0.1 }
  },
  "head_turn.reverse_angle_deg": {
    numeric: { min: -90, max: 90, step: 0.1 }
  },
  "head_turn.overshoot_angle_deg": {
    numeric: { min: -90, max: 90, step: 0.1 }
  },
  "head_turn.peak_frac": {
    label: "Peak Timing",
    help_text: "How far through the head-turn duration the mascot reaches the first peak angle.",
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "head_turn.reverse_frac": {
    label: "Reverse Timing",
    help_text: "How far through the head-turn duration the motion finishes swinging back through the reverse angle.",
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "head_turn.dot_overlap_sec": {
    label: "Dot Overlap (sec)",
    help_text: "How much the orbit animation overlaps the head turn instead of waiting for it to finish first.",
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "head_turn.overshoot_frac": {
    label: "Overshoot Timing",
    help_text: "How far through the head-turn duration the motion reaches the final overshoot before settling back to neutral.",
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "composition.center_x_px": {
    hidden: true,
    locked_value: COMPOSITION_CENTER_X_PX,
    numeric: { min: 0, max: STAGE_WIDTH_PX, step: 1 }
  },
  "composition.center_y_px": {
    hidden: true,
    locked_value: COMPOSITION_CENTER_Y_PX,
    numeric: { min: 0, max: STAGE_HEIGHT_PX, step: 1 }
  },
  "composition.radial_scale": {
    hidden: true,
    locked_value: 1,
    numeric: { min: 0, max: 1.5, step: 0.01 }
  },
  "composition.global_rotation_deg": {
    hidden: true,
    locked_value: 0,
    numeric: { min: -180, max: 180, step: 0.1 }
  },
  "generator_wrangle.inner_radius": {
    label: "Inner Radius",
    numeric: { min: 0, max: 1, step: 0.001 }
  },
  "generator_wrangle.outer_radius": {
    label: "Outer Radius",
    numeric: { min: 0, max: 1, step: 0.001 }
  },
  "generator_wrangle.num_orbits": {
    label: "Max Orbits",
    numeric: { min: 1, max: 24, step: 1 }
  },
  "generator_wrangle.spoke_count": {
    label: "Max Spokes",
    numeric: { min: 1, max: 180, step: 1 }
  },
  "generator_wrangle.phase_count": {
    numeric: { min: 1, max: 24, step: 1 }
  },
  "generator_wrangle.min_active_orbits": {
    label: "Min Orbits",
    help_text:
      "Defines the thinnest orbit spacing used for the phase fill and for the post-finale orbit breathing floor.",
    numeric: { min: 1, max: 24, step: 1 }
  },
  "generator_wrangle.base_angle_deg": {
    numeric: { min: -180, max: 180, step: 0.1 }
  },
  "generator_wrangle.pattern_offset_spokes": {
    numeric: { min: -180, max: 180, step: 1 }
  },
  "generator_wrangle.anim_start_angle_deg": {
    numeric: { min: -180, max: 180, step: 0.1 }
  },
  "transition_wrangle.duration_sec": {
    numeric: { min: 0, max: 4, step: 0.01 }
  },
  "transition_wrangle.spins": {
    numeric: { min: 0, max: 10, step: 0.01 }
  },
  "transition_wrangle.emit_frac": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "transition_wrangle.alpha_ramp_duration_sec": {
    numeric: { min: 0, max: 2, step: 0.01 }
  },
  "transition_wrangle.orbit_count_start_frac": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "transition_wrangle.orbit_count_end_frac": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "transition_wrangle.capture_start_frac": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "transition_wrangle.orbit_stagger_frac": {
    numeric: { min: 0, max: 2, step: 0.01 }
  },
  "transition_wrangle.speed_mult_per_orbit": {
    numeric: { min: 0, max: 2, step: 0.01 }
  },
  "transition_wrangle.spawn_angle_offset_deg": {
    numeric: { min: -180, max: 180, step: 0.1 }
  },
  "transition_wrangle.occlusion_arc_deg": {
    numeric: { min: 0, max: 360, step: 0.1 }
  },
  "transition_wrangle.base_pscale": {
    numeric: { min: 0, max: 3, step: 0.001 }
  },
  "transition_wrangle.orbital_frontier_amount": {
    numeric: { min: -2, max: 2, step: 0.01 }
  },
  "transition_wrangle.orbital_frontier_width_u": {
    numeric: { min: 0, max: 2, step: 0.01 }
  },
  "transition_wrangle.orbital_frontier_bias": {
    numeric: { min: 0, max: 3, step: 0.01 }
  },
  "transition_wrangle.phase_frontier_amount": {
    numeric: { min: -2, max: 2, step: 0.01 }
  },
  "transition_wrangle.phase_frontier_width_u": {
    numeric: { min: 0, max: 2, step: 0.01 }
  },
  "transition_wrangle.phase_frontier_bias": {
    numeric: { min: 0, max: 3, step: 0.01 }
  },
  "point_style.color": {
    hidden: true,
    locked_value: "#ffffff"
  },
  "point_style.alpha": {
    hidden: true,
    locked_value: 1,
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "point_style.base_pscale_px_per_unit": {
    label: "Base Dot Size Multiplier",
    help_text:
      "This multiplies transition_wrangle.base_pscale into the actual on-canvas dot diameter before the min-size and frontier effects are applied.",
    numeric: { min: 0, max: 20, step: 0.1 }
  },
  "point_style.min_scale": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "point_style.min_diameter_px": {
    numeric: { min: 0, max: 12, step: 0.1 }
  },
  "spoke_lines.enabled": {
    hidden: true,
    locked_value: true
  },
  "spoke_lines.show_reference_halo": {
    label: "Show SVG Halo Reference",
    help_text:
      "Overlays the original halo SVG in green at 50% opacity so you can compare the procedural spokes against the reference art."
  },
  "spoke_lines.construction_color": {
    label: "Construction Plane Color",
    help_text:
      "Sets the color of the faint full-frame radial construction lines behind the mascot and halo spokes."
  },
  "spoke_lines.reference_color": {
    label: "Reference Spoke Color",
    help_text: "Sets the color of the thin reference spokes that define the mascot halo boundary."
  },
  "spoke_lines.color": {
    hidden: true,
    locked_value: "#ffffff"
  },
  "spoke_lines.width_px": {
    label: "Outer Spoke Thickness (px)",
    help_text:
      "Controls the thinner white reference spoke pass around the mascot boundary. This stays at a constant thickness.",
    numeric: { min: 0, max: 12, step: 0.1 }
  },
  "spoke_lines.inner_width_px": {
    label: "Inner Spoke Thickness (px)",
    help_text:
      "Controls the heavier clipped spoke pass inside the left and right phase circles. This is the full thickness reached by the end of each phase.",
    numeric: { min: 0, max: 20, step: 0.1 }
  },
  "spoke_lines.phase_start_scale": {
    label: "Phase Start Thickness Scale",
    help_text:
      "Only affects the thick echoed spoke pass. Lower values start each phase thinner and ramp back up to the base thick-spoke width by the phase end.",
    numeric: { min: 0.05, max: 1, step: 0.01 }
  },
  "spoke_lines.echo_count": {
    label: "Echo Count",
    help_text:
      "Adds extra clipped copies of the thick spoke pass to push the pattern outward across the widescreen frame.",
    numeric: { min: 0, max: 24, step: 1 }
  },
  "spoke_lines.echo_width_mult": {
    label: "Echo Dot Scale Multiplier",
    help_text: "Each echoed dot band multiplies the previous echoed dot size by this amount.",
    numeric: { min: 0.1, max: 1, step: 0.01 }
  },
  "spoke_lines.echo_wave_count": {
    label: "Echo Ripple Count",
    help_text:
      "Adds concentric size undulations across the echoed dots, like ripples moving outward from the mascot.",
    numeric: { min: 0, max: 12, step: 1 }
  },
  "spoke_lines.echo_opacity_mult": {
    label: "Echo Outer Fade",
    help_text:
      "Controls how long the ripple dots hold their opacity before they fade toward the outer edge of the frame.",
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "spoke_lines.start_radius_px": {
    hidden: true,
    locked_value: 150,
    numeric: { min: 0, max: 300, step: 1 }
  },
  "spoke_lines.end_radius_extra_px": {
    hidden: true,
    locked_value: 0,
    numeric: { min: -120, max: 120, step: 1 }
  },
  "mascot.enabled": {
    hidden: true,
    locked_value: true
  },
  "mascot.face_asset_path": {
    hidden: true
  },
  "mascot.halo_asset_path": {
    hidden: true
  },
  "mascot.base_width_px": {
    label: "Base Draw Width (px)",
    help_text:
      "This is the mascot's draw box before any scaling. With the current 600x600 art, 600 keeps the artwork at its native size.",
    numeric: { min: 0, max: 800, step: 1 }
  },
  "mascot.scale": {
    hidden: true,
    locked_value: 1,
    numeric: { min: 0, max: 4, step: 0.01 }
  },
  "mascot.offset_x_px": {
    hidden: true,
    locked_value: 0,
    numeric: { min: -240, max: 240, step: 1 }
  },
  "mascot.offset_y_px": {
    hidden: true,
    locked_value: 0,
    numeric: { min: -240, max: 240, step: 1 }
  },
  "mascot.color": {
    hidden: true
  },
  "mascot.opacity": {
    hidden: true,
    locked_value: 1,
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "finale.enabled": {
    hidden: true,
    locked_value: true
  },
  "finale.delay_after_dots_sec": {
    numeric: { min: 0, max: 4, step: 0.01 }
  },
  "finale.duration_sec": {
    numeric: { min: 0, max: 6, step: 0.01 }
  },
  "finale.halo_inner_radius_u": {
    numeric: { min: 0, max: 0.5, step: 0.005 }
  },
  "finale.start_angle_deg": {
    numeric: { min: -180, max: 180, step: 0.1 }
  },
  "finale.mask_angle_offset_deg": {
    numeric: { min: -12, max: 12, step: 0.1 }
  },
  "sneeze.enabled": {
    locked_value: true
  },
  "sneeze.nose_bob_up_px": {
    numeric: { min: 0, max: 20, step: 0.1 }
  },
  "screensaver.cycle_sec": {
    label: "Breath Cycle (sec)",
    help_text:
      "Sets the full post-finale inhale/exhale cycle for the looping screensaver motion. Set to 0 to keep the final frame static.",
    numeric: { min: 0, max: 60, step: 0.1 }
  },
  "screensaver.ramp_in_sec": {
    label: "Breath Ramp In (sec)",
    help_text:
      "Blends from the held finale pose into the looping breath so the first cycle does not start abruptly.",
    numeric: { min: 0, max: 60, step: 0.1 }
  },
  "screensaver.pulse_orbits": {
    label: "Pulse Orbits",
    help_text:
      "Breathes the orbit spacing across the full field using Min Orbits and Max Orbits as the endpoints."
  },
  "screensaver.pulse_spokes": {
    label: "Pulse Spokes",
    help_text:
      "Breathes the spoke density across the full field using Min Spokes and Max Spokes as the endpoints."
  },
  "screensaver.min_spoke_count": {
    label: "Min Spokes",
    numeric: { min: 1, max: 180, step: 1 }
  },
  "screensaver.phase_boundary_transition_sec": {
    label: "Phase Boundary Width Ease (sec)",
    help_text:
      "When folded spokes cross the 3PM phase boundary, ease their thick-spoke width over this duration instead of snapping instantly.",
    numeric: { min: 0, max: 1.5, step: 0.01 }
  },
  "blink.enabled": {
    hidden: true,
    locked_value: true
  },
  "blink.start_delay_sec": {
    label: "Closing Blink Delay (sec)",
    help_text: "How long after the finale completes the closing blink begins.",
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "blink.duration_sec": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "blink.close_frac": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "blink.hold_closed_frac": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "blink.eye_scale_y_closed": {
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "interactivity.replay_on_stage_click": {
    hidden: true,
    locked_value: true
  },
  "interactivity.sneeze_on_mascot_click": {
    hidden: true,
    locked_value: true
  },
  "performance.max_device_pixel_ratio": {
    hidden: true,
    locked_value: 4,
    numeric: { min: 1, max: 4, step: 0.1 }
  },
  "performance.desynchronized": {
    hidden: true,
    locked_value: true
  },
  "export_settings.frame_rate": {
    hidden: true,
    locked_value: 24,
    numeric: { min: 1, max: 60, step: 1 }
  }
});

export function create_default_config() {
  return deep_clone(SOURCE_DEFAULT_CONFIG);
}

export function clamp(value, min_value, max_value) {
  return Math.min(max_value, Math.max(min_value, value));
}

export function deep_clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function is_plain_object(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function lerp(min_value, max_value, amount) {
  return min_value + (max_value - min_value) * amount;
}

export function smoothstep(edge_0, edge_1, value) {
  if (edge_0 === edge_1) {
    return value < edge_0 ? 0 : 1;
  }

  const t = clamp((value - edge_0) / (edge_1 - edge_0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function radians(value_deg) {
  return value_deg * Math.PI / 180;
}

export function wrap_positive(value, modulus) {
  const wrapped = value % modulus;
  return wrapped < 0 ? wrapped + modulus : wrapped;
}

export function hash_01(a, b) {
  const sample = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return sample - Math.floor(sample);
}

export function humanize_key(value) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function get_field_meta(path_key) {
  return CONFIG_FIELD_META[path_key] || null;
}

export function get_control_label(path_key) {
  const field_meta = get_field_meta(path_key);
  return field_meta?.label || humanize_key(path_key.split(".").pop());
}

export function get_control_help_text(path_key) {
  const field_meta = get_field_meta(path_key);
  return field_meta?.help_text || "";
}

export function is_control_hidden(path_key) {
  const field_meta = get_field_meta(path_key);
  return Boolean(field_meta?.hidden);
}

export function set_object_path_value(target, path_key, next_value) {
  const path_parts = path_key.split(".");
  let cursor = target;
  for (let index = 0; index < path_parts.length - 1; index += 1) {
    cursor = cursor[path_parts[index]];
  }
  cursor[path_parts[path_parts.length - 1]] = next_value;
}

export function get_object_path_value(target, path_parts) {
  let cursor = target;
  for (let index = 0; index < path_parts.length; index += 1) {
    cursor = cursor[path_parts[index]];
  }
  return cursor;
}

export function enforce_locked_config_values(target) {
  for (const [path_key, field_meta] of Object.entries(CONFIG_FIELD_META)) {
    if (!Object.prototype.hasOwnProperty.call(field_meta, "locked_value")) {
      continue;
    }
    set_object_path_value(target, path_key, field_meta.locked_value);
  }
}

export function is_hex_color_string(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function merge_known_config_values(target, source) {
  if (!is_plain_object(target) || !is_plain_object(source)) {
    return;
  }

  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      continue;
    }

    const target_value = target[key];
    const source_value = source[key];

    if (is_plain_object(target_value)) {
      if (is_plain_object(source_value)) {
        merge_known_config_values(target_value, source_value);
      }
      continue;
    }

    if (typeof target_value === "number") {
      const next_number = Number(source_value);
      if (Number.isFinite(next_number)) {
        target[key] = next_number;
      }
      continue;
    }

    if (typeof target_value === "boolean") {
      if (typeof source_value === "boolean") {
        target[key] = source_value;
      }
      continue;
    }

    if (typeof target_value === "string" && typeof source_value === "string") {
      target[key] = source_value;
    }
  }
}

export function normalize_config_snapshot(source, default_config) {
  const snapshot = deep_clone(default_config);
  merge_known_config_values(snapshot, source);
  if (
    !is_plain_object(source?.screensaver) &&
    Number.isFinite(Number(source?.finale?.orbit_breath_cycle_sec))
  ) {
    snapshot.screensaver.cycle_sec = Number(source.finale.orbit_breath_cycle_sec);
  }
  snapshot.mascot.face_asset_path = default_config.mascot.face_asset_path;
  snapshot.mascot.halo_asset_path = default_config.mascot.halo_asset_path;
  enforce_locked_config_values(snapshot);
  return snapshot;
}

export function replace_config(target, source, default_config) {
  const snapshot = normalize_config_snapshot(source, default_config);
  for (const key of Object.keys(target)) {
    target[key] = snapshot[key];
  }
}

export function get_numeric_control_spec(path_key, value) {
  const field_meta = get_field_meta(path_key);
  if (field_meta?.numeric) {
    return field_meta.numeric;
  }

  const magnitude = Math.max(1, Math.abs(value));
  return {
    min: value < 0 ? -magnitude * 2 : 0,
    max: magnitude * 2,
    step: magnitude >= 10 ? 1 : 0.01
  };
}

export function compute_frontier_scale(distance_u, amount, width_u, bias, min_scale = 0) {
  const safe_width_u = Math.max(0.0001, width_u);
  const safe_bias = Math.max(0.001, bias);
  const frontier_u = Math.pow(smoothstep(0, safe_width_u, distance_u), safe_bias);
  return Math.max(min_scale, 1 - amount * (1 - frontier_u));
}

export function compute_phase_frontier_dist_u(spoke_pattern_id, spoke_count, phase_count) {
  const segment_id = Math.min(
    phase_count - 1,
    Math.floor(spoke_pattern_id * phase_count / spoke_count)
  );
  const segment_start = Math.floor(segment_id * spoke_count / phase_count);
  const segment_end = Math.floor((segment_id + 1) * spoke_count / phase_count) - 1;
  const segment_length = Math.max(1, segment_end - segment_start + 1);
  const segment_index = spoke_pattern_id - segment_start;

  if (segment_length <= 1) {
    return 1;
  }

  return clamp(segment_index / (segment_length - 1), 0, 1);
}
