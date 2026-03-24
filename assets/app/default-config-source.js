export const SOURCE_DEFAULT_CONFIG = {
  "output_profile_key": "story_1080x1920",
  "mascot_fade": {
    "enabled": false,
    "duration_sec": 3
  },
  "head_turn": {
    "enabled": true,
    "duration_sec": 0.333,
    "peak_angle_deg": -30,
    "reverse_angle_deg": 30,
    "overshoot_angle_deg": -3,
    "peak_frac": 0.25,
    "reverse_frac": 0.56,
    "dot_overlap_sec": 1,
    "overshoot_frac": 0.75
  },
  "composition": {
    "center_x_px": 540,
    "center_y_px": 960,
    "background_color": "#161616",
    "scale": 1,
    "radial_scale": 1,
    "global_rotation_deg": 0
  },
  "generator_wrangle": {
    "inner_radius": 0.26,
    "outer_radius": 0.513,
    "num_orbits": 8,
    "spoke_count": 60,
    "phase_count": 2,
    "min_active_orbits": 3,
    "base_angle_deg": 0,
    "pattern_offset_spokes": 1,
    "anim_start_angle_deg": 0
  },
  "transition_wrangle": {
    "duration_sec": 1,
    "spins": 3,
    "emit_frac": 0.05,
    "alpha_ramp_duration_sec": 0.14,
    "animate_orbit_count": true,
    "orbit_count_start_frac": 0,
    "orbit_count_end_frac": 1,
    "capture_start_frac": 0.25,
    "orbit_stagger_frac": 1,
    "speed_mult_per_orbit": 0.85,
    "inner_faster": true,
    "spawn_angle_offset_deg": 0,
    "occlusion_arc_deg": 0,
    "hide_invisible_by_pscale": true,
    "base_pscale": 0.74,
    "orbital_frontier_amount": -1,
    "orbital_frontier_width_u": 1,
    "orbital_frontier_bias": 0.676,
    "phase_frontier_amount": 0.655,
    "phase_frontier_width_u": 0.57,
    "phase_frontier_bias": 1
  },
  "point_style": {
    "color": "#ffffff",
    "alpha": 1,
    "base_pscale_px_per_unit": 4,
    "min_scale": 0.3,
    "min_diameter_px": 1.1
  },
  "spoke_lines": {
    "enabled": true,
    "show_reference_halo": false,
    "show_debug_masks": false,
    "construction_color": "#333333",
    "reference_color": "#666666",
    "color": "#ffffff",
    "echo_color": "#444444",
    "width_px": 3,
    "echo_marker_stroke_px": 2.2,
    "echo_marker_scale_mult": 1.5,
    "echo_sparse_scale_boost": 0.5,
    "inner_width_px": 7.1,
    "phase_start_scale": 0.05,
    "reverse_inner_spoke_thickness_scale": false,
    "echo_count": 16,
    "echo_style": "mixed",
    "echo_shape_seed": 0,
    "text_labels_enabled": true,
    "text_radial_offset_px": 80,
    "echo_mix_shape_pct": 0.56,
    "echo_width_mult": 0.88,
    "echo_wave_count": 4,
    "echo_opacity_mult": 0.5,
    "start_radius_px": 150,
    "end_radius_extra_px": 0
  },
  "mascot": {
    "enabled": true,
    "face_asset_path": "./assets/racoon-mascot-face.svg",
    "halo_asset_path": "./assets/racoon-mascot-halo.svg",
    "base_width_px": 600,
    "scale": 1,
    "offset_x_px": 0,
    "offset_y_px": 0,
    "color": "#ffffff",
    "opacity": 1
  },
  "finale": {
    "enabled": true,
    "delay_after_dots_sec": 0,
    "duration_sec": 0.75,
    "halo_inner_radius_u": 0.255,
    "start_angle_deg": 0,
    "mask_angle_offset_deg": 1.5
  },
  "sneeze": {
    "enabled": true,
    "nose_bob_up_px": 1.5
  },
  "blink": {
    "enabled": true,
    "start_delay_sec": 0.04,
    "duration_sec": 0.12,
    "close_frac": 0.42,
    "hold_closed_frac": 0.12,
    "eye_scale_y_closed": 0.08
  },
  "interactivity": {
    "replay_on_stage_click": true,
    "sneeze_on_mascot_click": true
  },
  "performance": {
    "max_device_pixel_ratio": 4,
    "desynchronized": true
  },
  "screensaver": {
    "cycle_sec": 40,
    "ramp_in_sec": 2,
    "pulse_orbits": true,
    "pulse_spokes": true,
    "min_spoke_count": 16,
    "phase_boundary_transition_sec": 0.04
  },
  "vignette": {
    "enabled": true,
    "radius_px": 900,
    "feather_px": 420,
    "choke": 0.5
  },
  "export_settings": {
    "frame_rate": 24,
    "transparent_background": false
  }
};

export default SOURCE_DEFAULT_CONFIG;
