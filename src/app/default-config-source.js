export const SOURCE_DEFAULT_CONFIG = {
  "global_shared_config": {
    "composition": {
      "background_color": "#202020"
    },
    "layout_grid": {
      "safe_area_fill_color": "#161616"
    },
    "spoke_lines": {
      "construction_color": "#333333",
      "reference_color": "#666666",
      "echo_color": "#444444"
    },
    "overlay_text": {
      "color": "#ffffff",
      "title_text": "Ubuntu\nSummit\n26.04",
      "content_format": "generic_social"
    },
    "mascot": {
      "color": "#ffffff"
    },
    "overlay_logo": {
      "asset_path": "./assets/UbuntuTagLogo.svg"
    }
  },
  "output_profile_configs": {
    "landscape_1280x720": {
      "output_profile_key": "landscape_1280x720",
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
        "center_x_px": 640,
        "center_y_px": 360,
        "background_color": "#202020",
        "scale": 0.75,
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
        "echo_mix_shape_pct": 0.56,
        "echo_width_mult": 0.88,
        "echo_wave_count": 4,
        "echo_opacity_mult": 0.5,
        "start_radius_px": 150,
        "end_radius_extra_px": 0
      },
      "spoke_text": {
        "enabled": true,
        "font_size_px": 14,
        "radial_u": 0.6
      },
      "layout_grid": {
        "show_baseline_grid": false,
        "baseline_step_px": 8,
        "show_composition_grid": true,
        "row_count": 4,
        "column_count": 4,
        "margin_top_baselines": 0,
        "margin_bottom_baselines": 9,
        "margin_side_baselines": 0,
        "margin_left_baselines": 0,
        "margin_right_baselines": 0,
        "row_gutter_baselines": 4,
        "column_gutter_baselines": 4,
        "fit_within_safe_area": true,
        "safe_top_px": 250,
        "safe_right_px": 65,
        "safe_bottom_px": 250,
        "safe_left_px": 65,
        "safe_area_fill_color": "#161616",
        "safe_area_fill_above_animation": false
      },
      "overlay_logo": {
        "enabled": true,
        "asset_path": "./assets/UbuntuTagLogo.svg",
        "x_px": 64,
        "y_px": 0,
        "height_px": 108
      },
      "overlay_text": {
        "enabled": true,
        "content_format": "generic_social",
        "content_csv_path": "./assets/content.csv",
        "title_text": "Ubuntu\nSummit\n26.04",
        "subtitle_text": "A showcase for the innovative and the ambitious",
        "main_heading_x_px": 490,
        "main_heading_y_baselines": 12,
        "main_heading_max_width_px": 381,
        "text_1_x_px": 490,
        "text_1_y_baselines": 163,
        "text_1_max_width_px": 381,
        "text_2_x_px": 490,
        "text_2_y_baselines": 168,
        "text_2_max_width_px": 381,
        "text_3_x_px": 490,
        "text_3_y_baselines": 46,
        "text_3_max_width_px": 458,
        "title_font_size_px": 63,
        "title_line_height_px": 64,
        "b_head_font_size_px": 32,
        "b_head_line_height_px": 36,
        "paragraph_font_size_px": 32,
        "paragraph_line_height_px": 36,
        "link_title_size_to_logo_height": true,
        "color": "#ffffff",
        "title_font_weight": 400,
        "b_head_font_weight": 400,
        "main_heading_keyline_index": 3,
        "main_heading_column_span": 1,
        "text_1_keyline_index": 3,
        "text_1_column_span": 1,
        "text_2_keyline_index": 3,
        "text_2_column_span": 1,
        "text_3_keyline_index": 3,
        "text_3_column_span": 2
      },
      "overlay_content_formats": {
        "generic_social": {
          "csv_path": "./assets/content.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 163,
          "text_1_max_width_px": 381,
          "text_2_x_px": 490,
          "text_2_y_baselines": 168,
          "text_2_max_width_px": 381,
          "text_3_x_px": 490,
          "text_3_y_baselines": 46,
          "text_3_max_width_px": 458,
          "fields": {
            "body_intro": {
              "keyline_index": 3,
              "column_span": 1,
              "y_baselines": 163
            },
            "detail_primary": {
              "keyline_index": 3,
              "column_span": 1,
              "y_baselines": 168
            },
            "detail_secondary": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 46
            }
          }
        },
        "speaker_highlight": {
          "csv_path": "./assets/content-speaker-highlight.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 120,
          "text_1_max_width_px": 420,
          "text_2_x_px": 490,
          "text_2_y_baselines": 136,
          "text_2_max_width_px": 420,
          "text_3_x_px": 490,
          "text_3_y_baselines": 146,
          "text_3_max_width_px": 420,
          "fields": {
            "session_title": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 120
            },
            "speaker_name": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 136
            },
            "speaker_role": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 146
            }
          }
        }
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
        "cycle_sec": 60,
        "ramp_in_sec": 2,
        "pulse_orbits": true,
        "pulse_spokes": true,
        "min_spoke_count": 16,
        "phase_boundary_transition_sec": 0.04
      },
      "vignette": {
        "enabled": true,
        "apply_outside_safe_area": true,
        "radius_px": 595,
        "feather_px": 787,
        "choke": 0.62,
        "outside_radius_px": 2160,
        "outside_feather_px": 507,
        "outside_choke": 1
      },
      "export_settings": {
        "frame_rate": 24,
        "transparent_background": false
      }
    },
    "instagram_1080x1350": {
      "output_profile_key": "instagram_1080x1350",
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
        "center_y_px": 675,
        "background_color": "#202020",
        "scale": 0.75,
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
        "echo_mix_shape_pct": 0.56,
        "echo_width_mult": 0.88,
        "echo_wave_count": 4,
        "echo_opacity_mult": 0.5,
        "start_radius_px": 150,
        "end_radius_extra_px": 0
      },
      "spoke_text": {
        "enabled": true,
        "font_size_px": 14,
        "radial_u": 0.6
      },
      "layout_grid": {
        "show_baseline_grid": false,
        "baseline_step_px": 8,
        "show_composition_grid": true,
        "row_count": 4,
        "column_count": 4,
        "margin_top_baselines": 0,
        "margin_bottom_baselines": 9,
        "margin_side_baselines": 0,
        "margin_left_baselines": 0,
        "margin_right_baselines": 0,
        "row_gutter_baselines": 4,
        "column_gutter_baselines": 4,
        "fit_within_safe_area": true,
        "safe_top_px": 250,
        "safe_right_px": 65,
        "safe_bottom_px": 250,
        "safe_left_px": 65,
        "safe_area_fill_color": "#161616",
        "safe_area_fill_above_animation": false
      },
      "overlay_logo": {
        "enabled": true,
        "asset_path": "./assets/UbuntuTagLogo.svg",
        "x_px": 64,
        "y_px": 0,
        "height_px": 108
      },
      "overlay_text": {
        "enabled": true,
        "content_format": "generic_social",
        "content_csv_path": "./assets/content.csv",
        "title_text": "Ubuntu\nSummit\n26.04",
        "subtitle_text": "A showcase for the innovative and the ambitious",
        "main_heading_x_px": 490,
        "main_heading_y_baselines": 12,
        "main_heading_max_width_px": 381,
        "text_1_x_px": 490,
        "text_1_y_baselines": 163,
        "text_1_max_width_px": 381,
        "text_2_x_px": 490,
        "text_2_y_baselines": 168,
        "text_2_max_width_px": 381,
        "text_3_x_px": 490,
        "text_3_y_baselines": 46,
        "text_3_max_width_px": 458,
        "title_font_size_px": 63,
        "title_line_height_px": 64,
        "b_head_font_size_px": 32,
        "b_head_line_height_px": 36,
        "paragraph_font_size_px": 32,
        "paragraph_line_height_px": 36,
        "link_title_size_to_logo_height": true,
        "color": "#ffffff",
        "title_font_weight": 400,
        "b_head_font_weight": 400,
        "main_heading_keyline_index": 3,
        "main_heading_column_span": 2,
        "text_1_keyline_index": 3,
        "text_1_column_span": 2,
        "text_2_keyline_index": 3,
        "text_2_column_span": 2,
        "text_3_keyline_index": 3,
        "text_3_column_span": 2
      },
      "overlay_content_formats": {
        "generic_social": {
          "csv_path": "./assets/content.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 163,
          "text_1_max_width_px": 381,
          "text_2_x_px": 490,
          "text_2_y_baselines": 168,
          "text_2_max_width_px": 381,
          "text_3_x_px": 490,
          "text_3_y_baselines": 46,
          "text_3_max_width_px": 458,
          "fields": {
            "body_intro": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 163
            },
            "detail_primary": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 168
            },
            "detail_secondary": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 46
            }
          }
        },
        "speaker_highlight": {
          "csv_path": "./assets/content-speaker-highlight.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 120,
          "text_1_max_width_px": 420,
          "text_2_x_px": 490,
          "text_2_y_baselines": 136,
          "text_2_max_width_px": 420,
          "text_3_x_px": 490,
          "text_3_y_baselines": 146,
          "text_3_max_width_px": 420,
          "fields": {
            "session_title": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 120
            },
            "speaker_name": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 136
            },
            "speaker_role": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 146
            }
          }
        }
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
        "cycle_sec": 60,
        "ramp_in_sec": 2,
        "pulse_orbits": true,
        "pulse_spokes": true,
        "min_spoke_count": 16,
        "phase_boundary_transition_sec": 0.04
      },
      "vignette": {
        "enabled": true,
        "apply_outside_safe_area": true,
        "radius_px": 595,
        "feather_px": 787,
        "choke": 0.62,
        "outside_radius_px": 2160,
        "outside_feather_px": 507,
        "outside_choke": 1
      },
      "export_settings": {
        "frame_rate": 30,
        "transparent_background": false
      }
    },
    "story_1080x1920": {
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
        "background_color": "#202020",
        "scale": 0.75,
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
        "inner_width_px": 8,
        "phase_start_scale": 0.05,
        "reverse_inner_spoke_thickness_scale": false,
        "echo_count": 16,
        "echo_style": "mixed",
        "echo_shape_seed": 0,
        "echo_mix_shape_pct": 0.56,
        "echo_width_mult": 0.88,
        "echo_wave_count": 4,
        "echo_opacity_mult": 0.5,
        "start_radius_px": 150,
        "end_radius_extra_px": 0
      },
      "spoke_text": {
        "enabled": true,
        "font_size_px": 14,
        "radial_u": 0.6
      },
      "layout_grid": {
        "show_baseline_grid": true,
        "baseline_step_px": 8,
        "show_composition_grid": true,
        "row_count": 4,
        "column_count": 4,
        "margin_top_baselines": 0,
        "margin_bottom_baselines": 9,
        "margin_side_baselines": 16,
        "margin_left_baselines": 4,
        "margin_right_baselines": 4,
        "row_gutter_baselines": 4,
        "column_gutter_baselines": 4,
        "fit_within_safe_area": true,
        "safe_top_px": 250,
        "safe_right_px": 65,
        "safe_bottom_px": 250,
        "safe_left_px": 65,
        "safe_area_fill_color": "#161616",
        "safe_area_fill_above_animation": false
      },
      "overlay_logo": {
        "enabled": true,
        "asset_path": "./assets/UbuntuTagLogo.svg",
        "x_px": 64,
        "y_px": 0,
        "height_px": 108
      },
      "overlay_text": {
        "enabled": true,
        "content_format": "generic_social",
        "content_csv_path": "./assets/content.csv",
        "title_text": "Ubuntu\nSummit\n26.04",
        "subtitle_text": "A showcase for the innovative and the ambitious",
        "main_heading_x_px": 490,
        "main_heading_y_baselines": 12,
        "main_heading_max_width_px": 381,
        "text_1_x_px": 490,
        "text_1_y_baselines": 163,
        "text_1_max_width_px": 381,
        "text_2_x_px": 490,
        "text_2_y_baselines": 168,
        "text_2_max_width_px": 381,
        "text_3_x_px": 490,
        "text_3_y_baselines": 46,
        "text_3_max_width_px": 458,
        "title_font_size_px": 63,
        "title_line_height_px": 64,
        "b_head_font_size_px": 32,
        "b_head_line_height_px": 36,
        "paragraph_font_size_px": 32,
        "paragraph_line_height_px": 36,
        "link_title_size_to_logo_height": true,
        "color": "#ffffff",
        "title_font_weight": 200,
        "b_head_font_weight": 400,
        "main_heading_keyline_index": 3,
        "main_heading_column_span": 2,
        "text_1_keyline_index": 3,
        "text_1_column_span": 2,
        "text_2_keyline_index": 3,
        "text_2_column_span": 2,
        "text_3_keyline_index": 3,
        "text_3_column_span": 2
      },
      "overlay_content_formats": {
        "generic_social": {
          "csv_path": "./assets/content.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 163,
          "text_1_max_width_px": 381,
          "text_2_x_px": 490,
          "text_2_y_baselines": 168,
          "text_2_max_width_px": 381,
          "text_3_x_px": 490,
          "text_3_y_baselines": 46,
          "text_3_max_width_px": 458,
          "fields": {
            "body_intro": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 163
            },
            "detail_primary": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 168
            },
            "detail_secondary": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 46
            }
          }
        },
        "speaker_highlight": {
          "csv_path": "./assets/content-speaker-highlight.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 120,
          "text_1_max_width_px": 420,
          "text_2_x_px": 490,
          "text_2_y_baselines": 136,
          "text_2_max_width_px": 420,
          "text_3_x_px": 490,
          "text_3_y_baselines": 146,
          "text_3_max_width_px": 420,
          "fields": {
            "session_title": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 120
            },
            "speaker_name": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 136
            },
            "speaker_role": {
              "keyline_index": 3,
              "column_span": 2,
              "y_baselines": 146
            }
          }
        }
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
        "cycle_sec": 60,
        "ramp_in_sec": 2,
        "pulse_orbits": true,
        "pulse_spokes": true,
        "min_spoke_count": 16,
        "phase_boundary_transition_sec": 0.04
      },
      "vignette": {
        "enabled": true,
        "apply_outside_safe_area": true,
        "radius_px": 595,
        "feather_px": 787,
        "choke": 0.62,
        "outside_radius_px": 2160,
        "outside_feather_px": 507,
        "outside_choke": 1
      },
      "export_settings": {
        "frame_rate": 30,
        "transparent_background": false
      }
    },
    "screen_3840x2160": {
      "output_profile_key": "screen_3840x2160",
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
        "center_x_px": 1920,
        "center_y_px": 1080,
        "background_color": "#202020",
        "scale": 0.75,
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
        "echo_mix_shape_pct": 0.56,
        "echo_width_mult": 0.88,
        "echo_wave_count": 4,
        "echo_opacity_mult": 0.5,
        "start_radius_px": 150,
        "end_radius_extra_px": 0
      },
      "spoke_text": {
        "enabled": true,
        "font_size_px": 14,
        "radial_u": 0.6
      },
      "layout_grid": {
        "show_baseline_grid": false,
        "baseline_step_px": 8,
        "show_composition_grid": true,
        "row_count": 4,
        "column_count": 4,
        "margin_top_baselines": 0,
        "margin_bottom_baselines": 9,
        "margin_side_baselines": 0,
        "margin_left_baselines": 0,
        "margin_right_baselines": 0,
        "row_gutter_baselines": 4,
        "column_gutter_baselines": 4,
        "fit_within_safe_area": true,
        "safe_top_px": 250,
        "safe_right_px": 65,
        "safe_bottom_px": 250,
        "safe_left_px": 65,
        "safe_area_fill_color": "#161616",
        "safe_area_fill_above_animation": false
      },
      "overlay_logo": {
        "enabled": true,
        "asset_path": "./assets/UbuntuTagLogo.svg",
        "x_px": 64,
        "y_px": 0,
        "height_px": 108
      },
      "overlay_text": {
        "enabled": true,
        "content_format": "generic_social",
        "content_csv_path": "./assets/content.csv",
        "title_text": "Ubuntu\nSummit\n26.04",
        "subtitle_text": "A showcase for the innovative and the ambitious",
        "main_heading_x_px": 490,
        "main_heading_y_baselines": 12,
        "main_heading_max_width_px": 381,
        "text_1_x_px": 490,
        "text_1_y_baselines": 163,
        "text_1_max_width_px": 381,
        "text_2_x_px": 490,
        "text_2_y_baselines": 168,
        "text_2_max_width_px": 381,
        "text_3_x_px": 490,
        "text_3_y_baselines": 46,
        "text_3_max_width_px": 458,
        "title_font_size_px": 63,
        "title_line_height_px": 64,
        "b_head_font_size_px": 32,
        "b_head_line_height_px": 36,
        "paragraph_font_size_px": 32,
        "paragraph_line_height_px": 36,
        "link_title_size_to_logo_height": true,
        "color": "#ffffff",
        "title_font_weight": 400,
        "b_head_font_weight": 400,
        "main_heading_keyline_index": 2,
        "main_heading_column_span": 1,
        "text_1_keyline_index": 2,
        "text_1_column_span": 1,
        "text_2_keyline_index": 2,
        "text_2_column_span": 1,
        "text_3_keyline_index": 2,
        "text_3_column_span": 1
      },
      "overlay_content_formats": {
        "generic_social": {
          "csv_path": "./assets/content.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 163,
          "text_1_max_width_px": 381,
          "text_2_x_px": 490,
          "text_2_y_baselines": 168,
          "text_2_max_width_px": 381,
          "text_3_x_px": 490,
          "text_3_y_baselines": 46,
          "text_3_max_width_px": 458,
          "fields": {
            "body_intro": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 163
            },
            "detail_primary": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 168
            },
            "detail_secondary": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 46
            }
          }
        },
        "speaker_highlight": {
          "csv_path": "./assets/content-speaker-highlight.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 120,
          "text_1_max_width_px": 420,
          "text_2_x_px": 490,
          "text_2_y_baselines": 136,
          "text_2_max_width_px": 420,
          "text_3_x_px": 490,
          "text_3_y_baselines": 146,
          "text_3_max_width_px": 420,
          "fields": {
            "session_title": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 120
            },
            "speaker_name": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 136
            },
            "speaker_role": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 146
            }
          }
        }
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
        "cycle_sec": 60,
        "ramp_in_sec": 2,
        "pulse_orbits": true,
        "pulse_spokes": true,
        "min_spoke_count": 16,
        "phase_boundary_transition_sec": 0.04
      },
      "vignette": {
        "enabled": true,
        "apply_outside_safe_area": true,
        "radius_px": 595,
        "feather_px": 787,
        "choke": 0.62,
        "outside_radius_px": 2160,
        "outside_feather_px": 507,
        "outside_choke": 1
      },
      "export_settings": {
        "frame_rate": 24,
        "transparent_background": false
      }
    },
    "tablet_2560x1600": {
      "output_profile_key": "tablet_2560x1600",
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
        "center_x_px": 1280,
        "center_y_px": 800,
        "background_color": "#202020",
        "scale": 0.75,
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
        "echo_mix_shape_pct": 0.56,
        "echo_width_mult": 0.88,
        "echo_wave_count": 4,
        "echo_opacity_mult": 0.5,
        "start_radius_px": 150,
        "end_radius_extra_px": 0
      },
      "spoke_text": {
        "enabled": true,
        "font_size_px": 14,
        "radial_u": 0.6
      },
      "layout_grid": {
        "show_baseline_grid": false,
        "baseline_step_px": 8,
        "show_composition_grid": true,
        "row_count": 4,
        "column_count": 4,
        "margin_top_baselines": 0,
        "margin_bottom_baselines": 9,
        "margin_side_baselines": 0,
        "margin_left_baselines": 0,
        "margin_right_baselines": 0,
        "row_gutter_baselines": 4,
        "column_gutter_baselines": 4,
        "fit_within_safe_area": true,
        "safe_top_px": 250,
        "safe_right_px": 65,
        "safe_bottom_px": 250,
        "safe_left_px": 65,
        "safe_area_fill_color": "#161616",
        "safe_area_fill_above_animation": false
      },
      "overlay_logo": {
        "enabled": true,
        "asset_path": "./assets/UbuntuTagLogo.svg",
        "x_px": 64,
        "y_px": 0,
        "height_px": 108
      },
      "overlay_text": {
        "enabled": true,
        "content_format": "generic_social",
        "content_csv_path": "./assets/content.csv",
        "title_text": "Ubuntu\nSummit\n26.04",
        "subtitle_text": "A showcase for the innovative and the ambitious",
        "main_heading_x_px": 490,
        "main_heading_y_baselines": 12,
        "main_heading_max_width_px": 381,
        "text_1_x_px": 490,
        "text_1_y_baselines": 163,
        "text_1_max_width_px": 381,
        "text_2_x_px": 490,
        "text_2_y_baselines": 168,
        "text_2_max_width_px": 381,
        "text_3_x_px": 490,
        "text_3_y_baselines": 46,
        "text_3_max_width_px": 458,
        "title_font_size_px": 63,
        "title_line_height_px": 64,
        "b_head_font_size_px": 32,
        "b_head_line_height_px": 36,
        "paragraph_font_size_px": 32,
        "paragraph_line_height_px": 36,
        "link_title_size_to_logo_height": true,
        "color": "#ffffff",
        "title_font_weight": 400,
        "b_head_font_weight": 400,
        "main_heading_keyline_index": 2,
        "main_heading_column_span": 1,
        "text_1_keyline_index": 2,
        "text_1_column_span": 1,
        "text_2_keyline_index": 2,
        "text_2_column_span": 1,
        "text_3_keyline_index": 2,
        "text_3_column_span": 1
      },
      "overlay_content_formats": {
        "generic_social": {
          "csv_path": "./assets/content.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 163,
          "text_1_max_width_px": 381,
          "text_2_x_px": 490,
          "text_2_y_baselines": 168,
          "text_2_max_width_px": 381,
          "text_3_x_px": 490,
          "text_3_y_baselines": 46,
          "text_3_max_width_px": 458,
          "fields": {
            "body_intro": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 163
            },
            "detail_primary": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 168
            },
            "detail_secondary": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 46
            }
          }
        },
        "speaker_highlight": {
          "csv_path": "./assets/content-speaker-highlight.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 120,
          "text_1_max_width_px": 420,
          "text_2_x_px": 490,
          "text_2_y_baselines": 136,
          "text_2_max_width_px": 420,
          "text_3_x_px": 490,
          "text_3_y_baselines": 146,
          "text_3_max_width_px": 420,
          "fields": {
            "session_title": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 120
            },
            "speaker_name": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 136
            },
            "speaker_role": {
              "keyline_index": 2,
              "column_span": 1,
              "y_baselines": 146
            }
          }
        }
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
        "cycle_sec": 60,
        "ramp_in_sec": 2,
        "pulse_orbits": true,
        "pulse_spokes": true,
        "min_spoke_count": 16,
        "phase_boundary_transition_sec": 0.04
      },
      "vignette": {
        "enabled": true,
        "apply_outside_safe_area": true,
        "radius_px": 595,
        "feather_px": 787,
        "choke": 0.62,
        "outside_radius_px": 2160,
        "outside_feather_px": 507,
        "outside_choke": 1
      },
      "export_settings": {
        "frame_rate": 24,
        "transparent_background": false
      }
    },
    "led_wall_7680x2160": {
      "output_profile_key": "led_wall_7680x2160",
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
        "center_x_px": 3840,
        "center_y_px": 1080,
        "background_color": "#202020",
        "scale": 0.75,
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
        "echo_mix_shape_pct": 0.56,
        "echo_width_mult": 0.88,
        "echo_wave_count": 4,
        "echo_opacity_mult": 0.5,
        "start_radius_px": 150,
        "end_radius_extra_px": 0
      },
      "spoke_text": {
        "enabled": true,
        "font_size_px": 14,
        "radial_u": 0.6
      },
      "layout_grid": {
        "show_baseline_grid": false,
        "baseline_step_px": 8,
        "show_composition_grid": true,
        "row_count": 4,
        "column_count": 4,
        "margin_top_baselines": 0,
        "margin_bottom_baselines": 9,
        "margin_side_baselines": 0,
        "margin_left_baselines": 0,
        "margin_right_baselines": 0,
        "row_gutter_baselines": 4,
        "column_gutter_baselines": 4,
        "fit_within_safe_area": true,
        "safe_top_px": 250,
        "safe_right_px": 65,
        "safe_bottom_px": 250,
        "safe_left_px": 65,
        "safe_area_fill_color": "#161616",
        "safe_area_fill_above_animation": false
      },
      "overlay_logo": {
        "enabled": true,
        "asset_path": "./assets/UbuntuTagLogo.svg",
        "x_px": 64,
        "y_px": 0,
        "height_px": 108
      },
      "overlay_text": {
        "enabled": true,
        "content_format": "generic_social",
        "content_csv_path": "./assets/content.csv",
        "title_text": "Ubuntu\nSummit\n26.04",
        "subtitle_text": "A showcase for the innovative and the ambitious",
        "main_heading_x_px": 490,
        "main_heading_y_baselines": 12,
        "main_heading_max_width_px": 381,
        "text_1_x_px": 490,
        "text_1_y_baselines": 163,
        "text_1_max_width_px": 381,
        "text_2_x_px": 490,
        "text_2_y_baselines": 168,
        "text_2_max_width_px": 381,
        "text_3_x_px": 490,
        "text_3_y_baselines": 46,
        "text_3_max_width_px": 458,
        "title_font_size_px": 63,
        "title_line_height_px": 64,
        "b_head_font_size_px": 32,
        "b_head_line_height_px": 36,
        "paragraph_font_size_px": 32,
        "paragraph_line_height_px": 36,
        "link_title_size_to_logo_height": true,
        "color": "#ffffff",
        "title_font_weight": 400,
        "b_head_font_weight": 400,
        "main_heading_keyline_index": 1,
        "main_heading_column_span": 1,
        "text_1_keyline_index": 1,
        "text_1_column_span": 1,
        "text_2_keyline_index": 1,
        "text_2_column_span": 1,
        "text_3_keyline_index": 1,
        "text_3_column_span": 1
      },
      "overlay_content_formats": {
        "generic_social": {
          "csv_path": "./assets/content.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 163,
          "text_1_max_width_px": 381,
          "text_2_x_px": 490,
          "text_2_y_baselines": 168,
          "text_2_max_width_px": 381,
          "text_3_x_px": 490,
          "text_3_y_baselines": 46,
          "text_3_max_width_px": 458,
          "fields": {
            "body_intro": {
              "keyline_index": 1,
              "column_span": 1,
              "y_baselines": 163
            },
            "detail_primary": {
              "keyline_index": 1,
              "column_span": 1,
              "y_baselines": 168
            },
            "detail_secondary": {
              "keyline_index": 1,
              "column_span": 1,
              "y_baselines": 46
            }
          }
        },
        "speaker_highlight": {
          "csv_path": "./assets/content-speaker-highlight.csv",
          "text_1_x_px": 490,
          "text_1_y_baselines": 120,
          "text_1_max_width_px": 420,
          "text_2_x_px": 490,
          "text_2_y_baselines": 136,
          "text_2_max_width_px": 420,
          "text_3_x_px": 490,
          "text_3_y_baselines": 146,
          "text_3_max_width_px": 420,
          "fields": {
            "session_title": {
              "keyline_index": 1,
              "column_span": 1,
              "y_baselines": 120
            },
            "speaker_name": {
              "keyline_index": 1,
              "column_span": 1,
              "y_baselines": 136
            },
            "speaker_role": {
              "keyline_index": 1,
              "column_span": 1,
              "y_baselines": 146
            }
          }
        }
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
        "cycle_sec": 60,
        "ramp_in_sec": 2,
        "pulse_orbits": true,
        "pulse_spokes": true,
        "min_spoke_count": 16,
        "phase_boundary_transition_sec": 0.04
      },
      "vignette": {
        "enabled": true,
        "apply_outside_safe_area": true,
        "radius_px": 595,
        "feather_px": 787,
        "choke": 0.62,
        "outside_radius_px": 2160,
        "outside_feather_px": 507,
        "outside_choke": 1
      },
      "export_settings": {
        "frame_rate": 24,
        "transparent_background": false
      }
    }
  },
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
    "background_color": "#202020",
    "scale": 0.75,
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
    "inner_width_px": 8,
    "phase_start_scale": 0.05,
    "reverse_inner_spoke_thickness_scale": false,
    "echo_count": 16,
    "echo_style": "mixed",
    "echo_shape_seed": 0,
    "echo_mix_shape_pct": 0.56,
    "echo_width_mult": 0.88,
    "echo_wave_count": 4,
    "echo_opacity_mult": 0.5,
    "start_radius_px": 150,
    "end_radius_extra_px": 0
  },
  "spoke_text": {
    "enabled": true,
    "font_size_px": 14,
    "radial_u": 0.6
  },
  "layout_grid": {
    "show_baseline_grid": true,
    "baseline_step_px": 8,
    "show_composition_grid": true,
    "row_count": 4,
    "column_count": 4,
    "margin_top_baselines": 0,
    "margin_bottom_baselines": 9,
    "margin_side_baselines": 16,
    "margin_left_baselines": 4,
    "margin_right_baselines": 4,
    "row_gutter_baselines": 4,
    "column_gutter_baselines": 4,
    "fit_within_safe_area": true,
    "safe_top_px": 250,
    "safe_right_px": 65,
    "safe_bottom_px": 250,
    "safe_left_px": 65,
    "safe_area_fill_color": "#161616",
    "safe_area_fill_above_animation": false
  },
  "overlay_logo": {
    "enabled": true,
    "asset_path": "./assets/UbuntuTagLogo.svg",
    "x_px": 64,
    "y_px": 0,
    "height_px": 108
  },
  "overlay_text": {
    "enabled": true,
    "content_format": "generic_social",
    "content_csv_path": "./assets/content.csv",
    "title_text": "Ubuntu\nSummit\n26.04",
    "subtitle_text": "A showcase for the innovative and the ambitious",
    "main_heading_x_px": 490,
    "main_heading_y_baselines": 12,
    "main_heading_max_width_px": 381,
    "text_1_x_px": 490,
    "text_1_y_baselines": 163,
    "text_1_max_width_px": 381,
    "text_2_x_px": 490,
    "text_2_y_baselines": 168,
    "text_2_max_width_px": 381,
    "text_3_x_px": 490,
    "text_3_y_baselines": 46,
    "text_3_max_width_px": 458,
    "title_font_size_px": 63,
    "title_line_height_px": 64,
    "b_head_font_size_px": 32,
    "b_head_line_height_px": 36,
    "paragraph_font_size_px": 32,
    "paragraph_line_height_px": 36,
    "link_title_size_to_logo_height": true,
    "color": "#ffffff",
    "title_font_weight": 200,
    "b_head_font_weight": 400,
    "main_heading_keyline_index": 3,
    "main_heading_column_span": 2,
    "text_1_keyline_index": 3,
    "text_1_column_span": 2,
    "text_2_keyline_index": 3,
    "text_2_column_span": 2,
    "text_3_keyline_index": 3,
    "text_3_column_span": 2
  },
  "overlay_content_formats": {
    "generic_social": {
      "csv_path": "./assets/content.csv",
      "text_1_x_px": 490,
      "text_1_y_baselines": 163,
      "text_1_max_width_px": 381,
      "text_2_x_px": 490,
      "text_2_y_baselines": 168,
      "text_2_max_width_px": 381,
      "text_3_x_px": 490,
      "text_3_y_baselines": 46,
      "text_3_max_width_px": 458,
      "fields": {
        "body_intro": {
          "keyline_index": 3,
          "column_span": 2,
          "y_baselines": 163
        },
        "detail_primary": {
          "keyline_index": 3,
          "column_span": 2,
          "y_baselines": 168
        },
        "detail_secondary": {
          "keyline_index": 3,
          "column_span": 2,
          "y_baselines": 46
        }
      },
      "text_1_keyline_index": 3,
      "text_2_keyline_index": 3,
      "text_3_keyline_index": 3,
      "text_1_column_span": 2,
      "text_2_column_span": 2,
      "text_3_column_span": 2
    },
    "speaker_highlight": {
      "csv_path": "./assets/content-speaker-highlight.csv",
      "text_1_x_px": 490,
      "text_1_y_baselines": 120,
      "text_1_max_width_px": 420,
      "text_2_x_px": 490,
      "text_2_y_baselines": 136,
      "text_2_max_width_px": 420,
      "text_3_x_px": 490,
      "text_3_y_baselines": 146,
      "text_3_max_width_px": 420,
      "fields": {
        "session_title": {
          "keyline_index": 3,
          "column_span": 2,
          "y_baselines": 120
        },
        "speaker_name": {
          "keyline_index": 3,
          "column_span": 2,
          "y_baselines": 136
        },
        "speaker_role": {
          "keyline_index": 3,
          "column_span": 2,
          "y_baselines": 146
        }
      },
      "text_1_keyline_index": 3,
      "text_2_keyline_index": 3,
      "text_3_keyline_index": 3,
      "text_1_column_span": 2,
      "text_2_column_span": 2,
      "text_3_column_span": 2
    }
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
    "cycle_sec": 60,
    "ramp_in_sec": 2,
    "pulse_orbits": true,
    "pulse_spokes": true,
    "min_spoke_count": 16,
    "phase_boundary_transition_sec": 0.04
  },
  "vignette": {
    "enabled": true,
    "apply_outside_safe_area": true,
    "radius_px": 595,
    "feather_px": 787,
    "choke": 0.62,
    "outside_radius_px": 2160,
    "outside_feather_px": 507,
    "outside_choke": 1
  },
  "export_settings": {
    "frame_rate": 24,
    "transparent_background": false
  }
};

export default SOURCE_DEFAULT_CONFIG;
