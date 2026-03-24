import SOURCE_DEFAULT_CONFIG from "./default-config-source.js";

export const TAU = Math.PI * 2;
export const OUTPUT_PROFILE_ORDER = Object.freeze([
  "landscape_1280x720",
  "instagram_1080x1350",
  "story_1080x1920",
  "screen_3840x2160",
  "tablet_2560x1600",
  "led_wall_7680x2160"
]);
export const OUTPUT_PROFILES = Object.freeze({
  landscape_1280x720: Object.freeze({
    key: "landscape_1280x720",
    label: "1280 x 720 (16:9)",
    width_px: 1280,
    height_px: 720,
    default_frame_rate: 24,
    kind: "social_landscape",
    platforms: "LinkedIn, Twitter, Mastodon",
    safe_zone: "No safe zone"
  }),
  instagram_1080x1350: Object.freeze({
    key: "instagram_1080x1350",
    label: "1080 x 1350 (4:5)",
    width_px: 1080,
    height_px: 1350,
    default_frame_rate: 30,
    kind: "social_portrait",
    platforms: "Instagram",
    safe_zone: "No safe zone"
  }),
  story_1080x1920: Object.freeze({
    key: "story_1080x1920",
    label: "1080 x 1920 (9:16)",
    width_px: 1080,
    height_px: 1920,
    default_frame_rate: 30,
    kind: "story",
    platforms: "Instagram Story",
    safe_zone: "Safe zone"
  }),
  screen_3840x2160: Object.freeze({
    key: "screen_3840x2160",
    label: "3840 x 2160",
    width_px: 3840,
    height_px: 2160,
    default_frame_rate: 24,
    kind: "screen",
    platforms: "Screen",
    safe_zone: "No safe zone"
  }),
  tablet_2560x1600: Object.freeze({
    key: "tablet_2560x1600",
    label: "2560 x 1600",
    width_px: 2560,
    height_px: 1600,
    default_frame_rate: 24,
    kind: "tablet",
    platforms: "Tablet",
    safe_zone: "No safe zone"
  }),
  led_wall_7680x2160: Object.freeze({
    key: "led_wall_7680x2160",
    label: "LED Wall 7680 x 2160",
    width_px: 7680,
    height_px: 2160,
    default_frame_rate: 24,
    kind: "largest_target",
    platforms: "LED wall",
    safe_zone: "No safe zone"
  })
});
export const DEFAULT_OUTPUT_PROFILE_KEY = "story_1080x1920";
export const LARGEST_OUTPUT_PROFILE_KEY = "led_wall_7680x2160";
export const MAX_OUTPUT_PROFILE_WIDTH_PX = Math.max(
  ...Object.values(OUTPUT_PROFILES).map((profile) => profile.width_px)
);
export const MAX_OUTPUT_PROFILE_HEIGHT_PX = Math.max(
  ...Object.values(OUTPUT_PROFILES).map((profile) => profile.height_px)
);

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

export const STORAGE_NAMESPACE = "radial-mascot-clean-port-v1";
export const PRESET_STORAGE_KEY = `${STORAGE_NAMESPACE}-presets`;
export const ACTIVE_PRESET_STORAGE_KEY = `${STORAGE_NAMESPACE}-active-preset`;
export const EXPORT_DIRECTORY_DB_NAME = `${STORAGE_NAMESPACE}-local-editor`;
export const EXPORT_DIRECTORY_STORE_NAME = "handles";
export const EXPORT_DIRECTORY_KEY = `${STORAGE_NAMESPACE}-preset-export-directory`;
export const DOCKED_EDITOR_MIN_WIDTH_PX = 1500;

export const OVERLAY_CONTENT_FORMAT_ORDER = Object.freeze([
  "generic_social",
  "speaker_highlight"
]);

export const OVERLAY_CONTENT_FORMATS = Object.freeze({
  generic_social: Object.freeze({
    key: "generic_social",
    label: "Social Media Post - Generic"
  }),
  speaker_highlight: Object.freeze({
    key: "speaker_highlight",
    label: "Speaker Highlight"
  })
});

const OVERLAY_FORMAT_RUNTIME_MAPPING = Object.freeze([
  Object.freeze(["content_csv_path", "csv_path"]),
  Object.freeze(["text_1_keyline_index", "text_1_keyline_index"]),
  Object.freeze(["text_1_y_baselines", "text_1_y_baselines"]),
  Object.freeze(["text_1_max_width_px", "text_1_max_width_px"]),
  Object.freeze(["text_2_keyline_index", "text_2_keyline_index"]),
  Object.freeze(["text_2_y_baselines", "text_2_y_baselines"]),
  Object.freeze(["text_2_max_width_px", "text_2_max_width_px"]),
  Object.freeze(["text_3_keyline_index", "text_3_keyline_index"]),
  Object.freeze(["text_3_y_baselines", "text_3_y_baselines"]),
  Object.freeze(["text_3_max_width_px", "text_3_max_width_px"])
]);

function compute_overlay_layout_metrics_for_target(target) {
  const profile_key = typeof target?.output_profile_key === "string"
    ? target.output_profile_key
    : DEFAULT_OUTPUT_PROFILE_KEY;
  const profile = get_output_profile_metrics(profile_key);
  const layout_grid = is_plain_object(target?.layout_grid) ? target.layout_grid : {};
  const baseline_step_px = Math.max(1, Math.round(Number(layout_grid.baseline_step_px ?? 8)));
  const column_count = Math.max(1, Math.round(Number(layout_grid.column_count ?? 4)));
  const use_safe_area = Boolean(layout_grid.fit_within_safe_area);
  const safe_left_px = use_safe_area ? Math.max(0, Number(layout_grid.safe_left_px ?? 0)) : 0;
  const safe_right_px = use_safe_area ? Math.max(0, Number(layout_grid.safe_right_px ?? 0)) : 0;
  const layout_width_px = Math.max(0, profile.width_px - safe_left_px - safe_right_px);
  const side_margin_px = Math.max(0, Number(layout_grid.margin_side_baselines ?? 0)) * baseline_step_px;
  const column_gutter_px =
    Math.max(0, Math.round(Number(layout_grid.column_gutter_baselines ?? 0))) * baseline_step_px;
  const content_width_px = Math.max(
    0,
    layout_width_px - side_margin_px * 2 - column_gutter_px * Math.max(0, column_count - 1)
  );
  const column_width_px = column_count > 0 ? content_width_px / column_count : 0;

  return {
    column_count,
    content_left_relative_px: side_margin_px,
    keyline_step_px: column_width_px + column_gutter_px
  };
}

function derive_keyline_index_from_legacy_x(target, legacy_x_px) {
  const x_px = Number(legacy_x_px);
  if (!Number.isFinite(x_px)) {
    return 1;
  }

  const metrics = compute_overlay_layout_metrics_for_target(target);
  if (!Number.isFinite(metrics.keyline_step_px) || metrics.keyline_step_px <= 0) {
    return 1;
  }

  const relative_x_px = x_px - metrics.content_left_relative_px;
  return clamp(
    Math.round(relative_x_px / metrics.keyline_step_px) + 1,
    1,
    metrics.column_count
  );
}

function ensure_overlay_text_keyline_defaults(target) {
  if (!is_plain_object(target?.overlay_text)) {
    return;
  }

  const runtime_specs = [
    ["main_heading_keyline_index", "main_heading_x_px"],
    ["text_1_keyline_index", "text_1_x_px"],
    ["text_2_keyline_index", "text_2_x_px"],
    ["text_3_keyline_index", "text_3_x_px"]
  ];

  for (const [keyline_key, legacy_key] of runtime_specs) {
    if (!Number.isFinite(Number(target.overlay_text[keyline_key]))) {
      target.overlay_text[keyline_key] = derive_keyline_index_from_legacy_x(
        target,
        target.overlay_text[legacy_key]
      );
    }
  }

  if (!is_plain_object(target.overlay_content_formats)) {
    return;
  }

  const bucket_specs = [
    ["text_1_keyline_index", "text_1_x_px"],
    ["text_2_keyline_index", "text_2_x_px"],
    ["text_3_keyline_index", "text_3_x_px"]
  ];

  for (const format_bucket of Object.values(target.overlay_content_formats)) {
    if (!is_plain_object(format_bucket)) {
      continue;
    }
    for (const [keyline_key, legacy_key] of bucket_specs) {
      if (!Number.isFinite(Number(format_bucket[keyline_key]))) {
        format_bucket[keyline_key] = derive_keyline_index_from_legacy_x(
          target,
          format_bucket[legacy_key]
        );
      }
    }
  }
}

function get_active_overlay_content_format_key(target) {
  const requested_key = target?.overlay_text?.content_format;
  if (typeof requested_key === "string" && OVERLAY_CONTENT_FORMATS[requested_key]) {
    return requested_key;
  }
  return OVERLAY_CONTENT_FORMAT_ORDER[0];
}

function get_overlay_format_bucket(target, format_key) {
  if (!is_plain_object(target.overlay_content_formats)) {
    target.overlay_content_formats = {};
  }
  if (!is_plain_object(target.overlay_content_formats[format_key])) {
    target.overlay_content_formats[format_key] = {};
  }
  return target.overlay_content_formats[format_key];
}

export function sync_overlay_content_format_runtime_fields(target) {
  if (!is_plain_object(target?.overlay_text)) {
    return;
  }
  const format_key = get_active_overlay_content_format_key(target);
  target.overlay_text.content_format = format_key;
  const format_bucket = get_overlay_format_bucket(target, format_key);
  for (const [runtime_key, format_key_name] of OVERLAY_FORMAT_RUNTIME_MAPPING) {
    if (typeof format_bucket[format_key_name] === "undefined") {
      continue;
    }
    target.overlay_text[runtime_key] = deep_clone(format_bucket[format_key_name]);
  }
}

export function write_overlay_runtime_fields_to_active_format(target) {
  if (!is_plain_object(target?.overlay_text)) {
    return;
  }
  const format_key = get_active_overlay_content_format_key(target);
  target.overlay_text.content_format = format_key;
  const format_bucket = get_overlay_format_bucket(target, format_key);
  for (const [runtime_key, format_key_name] of OVERLAY_FORMAT_RUNTIME_MAPPING) {
    format_bucket[format_key_name] = deep_clone(target.overlay_text[runtime_key]);
  }
}

export const EDITOR_TAB_GROUPS = Object.freeze([
  Object.freeze({
    key: "overlay",
    label: "Overlay",
    sections: Object.freeze(["layout_grid", "overlay_logo", "overlay_text"])
  }),
  Object.freeze({
    key: "output",
    label: "Output",
    sections: Object.freeze([])
  }),
  Object.freeze({
    key: "presets",
    label: "Presets",
    sections: Object.freeze([])
  }),
  Object.freeze({
    key: "field",
    label: "Field",
    sections: Object.freeze(["composition", "generator_wrangle", "mascot"])
  }),
  Object.freeze({
    key: "halo",
    label: "Halo",
    sections: Object.freeze(["spoke_lines", "spoke_text", "screensaver"])
  }),
  Object.freeze({
    key: "vignette",
    label: "Vignette",
    sections: Object.freeze(["vignette"])
  }),
  Object.freeze({
    key: "dots",
    label: "Dots",
    sections: Object.freeze(["transition_wrangle", "point_style"])
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
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_WIDTH_PX, step: 1 }
  },
  "composition.center_y_px": {
    hidden: true,
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_HEIGHT_PX, step: 1 }
  },
  "composition.background_color": {
    label: "Background Color"
  },
  "composition.scale": {
    label: "Composition Scale",
    help_text:
      "Scales the whole composition together: mascot, dots, halo spokes, echo markers, and construction lines.",
    numeric: { min: 0.1, max: 6, step: 0.01 }
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
  "layout_grid.show_baseline_grid": {
    label: "Show Grid",
    help_text:
      "Shows both the baseline grid and the composition grid. This works only when the overlay is enabled."
  },
  "layout_grid.baseline_step_px": {
    label: "Baseline Step (px)",
    help_text:
      "Vertical baseline spacing for the layout overlay. Text baselines and row heights snap to this step.",
    numeric: { min: 2, max: 64, step: 1 }
  },
  "layout_grid.show_composition_grid": {
    label: "Show Overlay",
    help_text:
      "Master switch for the overlay system: safe area fill, composition grid, logo, and text. The baseline grid follows this too."
  },
  "layout_grid.row_count": {
    label: "Rows",
    help_text:
      "Number of vertical subdivisions. Any leftover height is added to the bottom margin so row heights stay baseline-aligned.",
    numeric: { min: 1, max: 24, step: 1 }
  },
  "layout_grid.column_count": {
    label: "Columns",
    help_text:
      "Number of equal-width columns between the left and right margins.",
    numeric: { min: 1, max: 24, step: 1 }
  },
  "layout_grid.margin_top_baselines": {
    label: "Top Margin (Baselines)",
    help_text:
      "Top margin for the composition grid, expressed in baseline units.",
    numeric: { min: 0, max: 200, step: 1 }
  },
  "layout_grid.margin_bottom_baselines": {
    label: "Bottom Margin (Baselines)",
    help_text:
      "Minimum bottom margin for the composition grid, expressed in baseline units. Any leftover height from row subdivision is added on top of this.",
    numeric: { min: 0, max: 200, step: 1 }
  },
  "layout_grid.margin_side_baselines": {
    label: "Side Margin (Baselines)",
    help_text:
      "Shared left and right margin for the composition grid, expressed in baseline units.",
    numeric: { min: 0, max: 200, step: 1 }
  },
  "layout_grid.row_gutter_baselines": {
    label: "Row Gutter (Baselines)",
    help_text:
      "Vertical gutter between grid rows, expressed in baseline units.",
    numeric: { min: 0, max: 24, step: 1 }
  },
  "layout_grid.column_gutter_baselines": {
    label: "Column Gutter (Baselines)",
    help_text:
      "Horizontal gutter between grid columns, expressed in baseline units.",
    numeric: { min: 0, max: 24, step: 1 }
  },
  "layout_grid.fit_within_safe_area": {
    label: "Fit Within Safe Area",
    help_text:
      "Constrains the baseline grid, composition grid, and text/logo placement origin to a safe area inset from the frame edges."
  },
  "layout_grid.safe_top_px": {
    label: "Safe Top (px)",
    help_text:
      "Top safe-area inset. Used as the text/logo area origin and as the clipping edge for the overlay grids.",
    hidden_if: { path: "layout_grid.fit_within_safe_area", equals: false },
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_HEIGHT_PX, step: 1 }
  },
  "layout_grid.safe_right_px": {
    label: "Safe Right (px)",
    hidden_if: { path: "layout_grid.fit_within_safe_area", equals: false },
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_WIDTH_PX, step: 1 }
  },
  "layout_grid.safe_bottom_px": {
    label: "Safe Bottom (px)",
    hidden_if: { path: "layout_grid.fit_within_safe_area", equals: false },
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_HEIGHT_PX, step: 1 }
  },
  "layout_grid.safe_left_px": {
    label: "Safe Left (px)",
    hidden_if: { path: "layout_grid.fit_within_safe_area", equals: false },
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_WIDTH_PX, step: 1 }
  },
  "layout_grid.safe_area_fill_color": {
    label: "Safe Area Fill Color",
    help_text:
      "A screen-space rectangle behind the whole composition, clipped to the current safe area.",
    hidden_if: { path: "layout_grid.fit_within_safe_area", equals: false }
  },
  "layout_grid.safe_area_fill_above_animation": {
    label: "Overlay Background Above Animation",
    help_text:
      "Places the safe-area background panel above the mascot/halo animation and below the overlay text/logo, so the panel can either reveal or mask the animation.",
    hidden_if: { path: "layout_grid.fit_within_safe_area", equals: false }
  },
  "overlay_logo.enabled": {
    hidden: true,
    locked_value: true,
    label: "Show Logo"
  },
  "overlay_logo.asset_path": {
    label: "Logo Asset Path",
    help_text:
      "Path to the Ubuntu tag logo image or SVG. Relative project paths are recommended."
  },
  "overlay_logo.x_px": {
    label: "Logo X (px)",
    numeric: { min: -MAX_OUTPUT_PROFILE_WIDTH_PX, max: MAX_OUTPUT_PROFILE_WIDTH_PX * 2, step: 1 }
  },
  "overlay_logo.y_px": {
    label: "Logo Y (px)",
    numeric: { min: -MAX_OUTPUT_PROFILE_HEIGHT_PX, max: MAX_OUTPUT_PROFILE_HEIGHT_PX * 2, step: 1 }
  },
  "overlay_logo.height_px": {
    label: "Logo Height At 63px Title (px)",
    help_text:
      "Base logo height for a 63 px title. When title/logo linking is on, the logo scales from this ratio.",
    numeric: { min: 1, max: MAX_OUTPUT_PROFILE_HEIGHT_PX, step: 1 }
  },
  "overlay_text.enabled": {
    hidden: true,
    locked_value: true,
    label: "Show Overlay Text"
  },
  "overlay_text.content_format": {
    label: "Overlay Content Format",
    help_text:
      "Chooses which CSV schema and per-format text-field layout are active. The text field X/Y/max-width controls below edit the currently selected format.",
    options: OVERLAY_CONTENT_FORMAT_ORDER.map((format_key) =>
      Object.freeze({
        value: format_key,
        label: OVERLAY_CONTENT_FORMATS[format_key].label
      })
    )
  },
  "overlay_text.content_csv_path": {
    label: "Active Format CSV Path",
    help_text:
      "CSV content source for the selected overlay content format. Quoted multiline CSV cells are supported, and <br> is also converted into line breaks."
  },
  "overlay_text.title_text": {
    hidden: true,
    label: "Title Text"
  },
  "overlay_text.subtitle_text": {
    hidden: true,
    label: "Subtitle Text"
  },
  "overlay_text.main_heading_x_px": {
    hidden: true,
    numeric: { min: -MAX_OUTPUT_PROFILE_WIDTH_PX, max: MAX_OUTPUT_PROFILE_WIDTH_PX * 2, step: 1 }
  },
  "overlay_text.main_heading_keyline_index": {
    label: "Column",
    help_text: "Aligns the A-head to a grid keyline based on the current column layout.",
    numeric: { min: 1, max: 24, step: 1 }
  },
  "overlay_text.main_heading_y_baselines": {
    label: "A-head Y (Baselines)",
    help_text:
      "Vertical A-head offset expressed in baseline units. Moving this value always keeps the heading on the baseline grid.",
    numeric: { min: -200, max: 2000, step: 1 }
  },
  "overlay_text.main_heading_max_width_px": {
    label: "A-head Max Width (px)",
    help_text:
      "Maximum width used for wrapping the A-head.",
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_WIDTH_PX, step: 1 }
  },
  "overlay_text.text_1_x_px": {
    hidden: true,
    numeric: { min: -MAX_OUTPUT_PROFILE_WIDTH_PX, max: MAX_OUTPUT_PROFILE_WIDTH_PX * 2, step: 1 }
  },
  "overlay_text.text_1_keyline_index": {
    label: "Column",
    help_text: "Aligns the B-head to a grid keyline based on the current column layout.",
    numeric: { min: 1, max: 24, step: 1 }
  },
  "overlay_text.text_1_y_baselines": {
    label: "B-head Y (Baselines)",
    numeric: { min: -200, max: 2000, step: 1 }
  },
  "overlay_text.text_1_max_width_px": {
    label: "B-head Max Width (px)",
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_WIDTH_PX, step: 1 }
  },
  "overlay_text.text_2_x_px": {
    hidden: true,
    numeric: { min: -MAX_OUTPUT_PROFILE_WIDTH_PX, max: MAX_OUTPUT_PROFILE_WIDTH_PX * 2, step: 1 }
  },
  "overlay_text.text_2_keyline_index": {
    label: "Column",
    help_text: "Aligns paragraph text to a grid keyline based on the current column layout.",
    numeric: { min: 1, max: 24, step: 1 }
  },
  "overlay_text.text_2_y_baselines": {
    label: "Paragraph 1 Y (Baselines)",
    numeric: { min: -200, max: 2000, step: 1 }
  },
  "overlay_text.text_2_max_width_px": {
    label: "Paragraph 1 Max Width (px)",
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_WIDTH_PX, step: 1 }
  },
  "overlay_text.text_3_x_px": {
    hidden: true,
    numeric: { min: -MAX_OUTPUT_PROFILE_WIDTH_PX, max: MAX_OUTPUT_PROFILE_WIDTH_PX * 2, step: 1 }
  },
  "overlay_text.text_3_keyline_index": {
    label: "Column",
    help_text: "Aligns paragraph text to a grid keyline based on the current column layout.",
    numeric: { min: 1, max: 24, step: 1 }
  },
  "overlay_text.text_3_y_baselines": {
    label: "Paragraph 2 Y (Baselines)",
    numeric: { min: -200, max: 2000, step: 1 }
  },
  "overlay_text.text_3_max_width_px": {
    label: "Paragraph 2 Max Width (px)",
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_WIDTH_PX, step: 1 }
  },
  "overlay_text.title_font_size_px": {
    label: "A-head / Logo Size (px)",
    help_text:
      "Exact A-head font size. The logo scales with it using the 63 px title to logo-height ratio.",
    numeric: { min: 4, max: 320, step: 1 }
  },
  "overlay_text.title_line_height_px": {
    label: "A-head Line Height (px)",
    help_text:
      "A-head line height. It is snapped up to the baseline grid so multiline titles stay aligned.",
    numeric: { min: 4, max: 512, step: 1 }
  },
  "overlay_text.title_font_weight": {
    label: "A-head Weight",
    help_text:
      "Variable-font weight for the A-head style.",
    numeric: { min: 100, max: 900, step: 1 }
  },
  "overlay_text.b_head_font_size_px": {
    label: "B-head Size (px)",
    help_text:
      "Shared font size for the B-head text style.",
    numeric: { min: 4, max: 320, step: 1 }
  },
  "overlay_text.b_head_line_height_px": {
    label: "B-head Line Height (px)",
    help_text:
      "Line height for the B-head style. It is snapped up to the baseline grid so multiline text stays aligned.",
    numeric: { min: 4, max: 512, step: 1 }
  },
  "overlay_text.b_head_font_weight": {
    label: "B-head Weight",
    help_text:
      "Variable-font weight for the B-head style.",
    numeric: { min: 100, max: 900, step: 1 }
  },
  "overlay_text.paragraph_font_size_px": {
    label: "Paragraph Size (px)",
    help_text:
      "Shared font size for the paragraph text style.",
    numeric: { min: 4, max: 320, step: 1 }
  },
  "overlay_text.paragraph_line_height_px": {
    label: "Paragraph Line Height (px)",
    help_text:
      "Line height for the paragraph style. It is snapped up to the baseline grid so multiline text stays aligned.",
    numeric: { min: 4, max: 512, step: 1 }
  },
  "overlay_text.link_title_size_to_logo_height": {
    hidden: true,
    locked_value: true,
    label: "Link Title Size To Logo Height",
    help_text:
      "Uses the logo height as the title font size so the logo wordmark and heading scale together across deliverables."
  },
  "overlay_text.color": {
    label: "Overlay Text Color"
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
    hidden: true,
    numeric: { min: -180, max: 180, step: 0.1 }
  },
  "generator_wrangle.pattern_offset_spokes": {
    hidden: true,
    numeric: { min: -180, max: 180, step: 1 }
  },
  "generator_wrangle.anim_start_angle_deg": {
    hidden: true,
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
  "spoke_lines.show_debug_masks": {
    label: "Show Phase Debug Overlay",
    help_text:
      "Draws the actual horizontal phase boundary plus both clipping-mask circles and their centers, using the same geometry as the live spoke masking."
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
  "spoke_lines.echo_color": {
    label: "Echo Marker Color",
    help_text:
      "Sets the color of the halo echo markers only: circles, plus signs, triangles, mixed replacements, or Ubuntu release labels."
  },
  "spoke_lines.width_px": {
    label: "Outer Spoke Thickness (px)",
    help_text:
      "Controls the thinner white reference spoke pass around the mascot boundary. This stays at a constant thickness.",
    numeric: { min: 0, max: 12, step: 0.1 }
  },
  "spoke_lines.echo_marker_stroke_px": {
    label: "Echo Shape Stroke (px)",
    help_text:
      "Controls the outline thickness for plus signs and triangles independently from the thin outer reference spokes.",
    numeric: { min: 0, max: 12, step: 0.1 }
  },
  "spoke_lines.echo_marker_scale_mult": {
    label: "Echo Shape Scale Multiplier",
    help_text:
      "Scales plus signs and triangles independently from the dot-based echo sizing, so replacement shapes can stay readable.",
    numeric: { min: 0.1, max: 6, step: 0.01 }
  },
  "spoke_lines.echo_sparse_scale_boost": {
    label: "Echo Sparse Scale Boost",
    help_text:
      "Adds extra size to plus signs and triangles as the breathing loop reduces the visible spoke count. Zero disables the effect.",
    numeric: { min: 0, max: 6, step: 0.01 }
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
  "spoke_lines.reverse_inner_spoke_thickness_scale": {
    label: "Reverse Inner Spoke Thickness Scale",
    help_text:
      "Flips the thick inner-spoke width ramp so the phase-start scaling is applied in reverse. Useful for A/B testing the phase thickness mapping."
  },
  "spoke_lines.echo_count": {
    label: "Echo Count",
    help_text:
      "Adds extra clipped copies of the thick spoke pass to push the pattern outward across the widescreen frame.",
    numeric: { min: 0, max: 24, step: 1 }
  },
  "spoke_lines.echo_style": {
    label: "Echo Marker Style",
    help_text:
      "Chooses how the echoed halo markers render: circles, plus signs, outlined triangles, or a deterministic mix.",
    options: Object.freeze([
      Object.freeze({ value: "dots", label: "Dots" }),
      Object.freeze({ value: "plus", label: "Plus Signs" }),
      Object.freeze({ value: "triangles", label: "Outlined Triangles" }),
      Object.freeze({ value: "mixed", label: "Mixed Shapes" })
    ])
  },
  "spoke_lines.echo_shape_seed": {
    label: "Echo Shape Seed",
    help_text:
      "Controls the deterministic random layout for Mixed Shapes. Change this to get a different repeatable arrangement without depending on reveal or breathing state.",
    numeric: { min: 0, max: 9999, step: 1 }
  },
  "spoke_lines.echo_mix_shape_pct": {
    label: "Mixed Shape Replacement",
    help_text:
      "For Mixed Shapes, controls what percentage of circle echoes get deterministically replaced by plus signs or outlined triangles.",
    numeric: { min: 0, max: 1, step: 0.01 }
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
    numeric: { min: 0, max: 3000, step: 1 }
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
    hidden: true,
    numeric: { min: 0, max: 0.5, step: 0.005 }
  },
  "finale.start_angle_deg": {
    hidden: true,
    numeric: { min: -180, max: 180, step: 0.1 }
  },
  "finale.mask_angle_offset_deg": {
    hidden: true,
    numeric: { min: -12, max: 12, step: 0.1 }
  },
  "sneeze.enabled": {
    locked_value: true
  },
  "sneeze.nose_bob_up_px": {
    numeric: { min: 0, max: 20, step: 0.1 }
  },
  "spoke_text.enabled": {
    label: "Show Release Labels"
  },
  "spoke_text.font_size_px": {
    label: "Label Font Size (px)",
    help_text:
      "Base font size for Ubuntu release labels along the spokes. Scales proportionally for larger output profiles.",
    numeric: { min: 3, max: 24, step: 0.5 }
  },
  "spoke_text.radial_u": {
    label: "Label Position (u)",
    help_text:
      "Normalised position along the spoke from the halo outer boundary (0) to the frame edge (1). Drag to slide labels inward or outward without overlapping shapes.",
    numeric: { min: 0, max: 1, step: 0.01 }
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
    label: "Phase Boundary Transition Time (sec)",
    help_text:
      "When folded spokes cross the 3PM phase boundary, ease the thick-spoke width and clip handoff over this amount of time instead of snapping instantly. Higher values make the handoff linger longer; lower values make it snap faster.",
    numeric: { min: 0, max: 1.5, step: 0.01 }
  },
  "vignette.enabled": {
    label: "Show Vignette"
  },
  "vignette.apply_outside_safe_area": {
    label: "Vignette Outside Safe Area",
    help_text:
      "When safe-area mode is active, also apply the vignette to the area outside the safe area. Turn this off to keep the outer background clear."
  },
  "vignette.radius_px": {
    label: "Safe Area Radius (px)",
    help_text:
      "How far the circular vignette reaches inside the safe area before it is fully faded to the safe-area background color.",
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_HEIGHT_PX, step: 1 }
  },
  "vignette.feather_px": {
    label: "Safe Area Feather (px)",
    help_text:
      "How much of the safe-area vignette radius is used for the fade from transparent center to the safe-area background color.",
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_HEIGHT_PX, step: 1 }
  },
  "vignette.choke": {
    label: "Safe Area Choke",
    help_text:
      "Biases the midpoint of the safe-area vignette fade. Higher values keep more of the center revealed; lower values make the fade bite inward sooner.",
    numeric: { min: 0, max: 1, step: 0.01 }
  },
  "vignette.outside_radius_px": {
    label: "Outside Radius (px)",
    help_text:
      "How far the separate vignette outside the safe area reaches from the center before it is fully faded to the main background color.",
    hidden_if: { path: "vignette.apply_outside_safe_area", equals: false },
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_HEIGHT_PX, step: 1 }
  },
  "vignette.outside_feather_px": {
    label: "Outside Feather (px)",
    help_text:
      "How much of the outside vignette radius is used for the fade from transparent center to the main background color.",
    hidden_if: { path: "vignette.apply_outside_safe_area", equals: false },
    numeric: { min: 0, max: MAX_OUTPUT_PROFILE_HEIGHT_PX, step: 1 }
  },
  "vignette.outside_choke": {
    label: "Outside Choke",
    help_text:
      "Biases the midpoint of the outside-safe-area vignette fade. Higher values keep more of the center revealed; lower values make the fade bite inward sooner.",
    hidden_if: { path: "vignette.apply_outside_safe_area", equals: false },
    numeric: { min: 0, max: 1, step: 0.01 }
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
  },
  "export_settings.transparent_background": {
    label: "Transparent PNG Background",
    help_text: "Applies to Export Frame and Export PNG Seq only. The editor preview stays opaque."
  }
});

export function create_default_config() {
  const config = deep_clone(SOURCE_DEFAULT_CONFIG);
  ensure_editor_schema_defaults(config);
  sync_profile_derived_config(config);
  sync_overlay_content_format_runtime_fields(config);
  return config;
}

function ensure_overlay_text_style_defaults(target) {
  if (!is_plain_object(target?.overlay_text)) {
    return;
  }

  if (!Number.isFinite(Number(target.overlay_text.title_font_weight))) {
    target.overlay_text.title_font_weight = 400;
  }

  if (!Number.isFinite(Number(target.overlay_text.b_head_font_weight))) {
    target.overlay_text.b_head_font_weight = 400;
  }
}

function ensure_editor_schema_defaults(target) {
  if (!is_plain_object(target)) {
    return;
  }

  ensure_overlay_text_style_defaults(target);
  ensure_overlay_text_keyline_defaults(target);

  if (!is_plain_object(target.output_profile_configs)) {
    return;
  }

  for (const profile_snapshot of Object.values(target.output_profile_configs)) {
    ensure_overlay_text_style_defaults(profile_snapshot);
    ensure_overlay_text_keyline_defaults(profile_snapshot);
  }
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

export function is_control_hidden(path_key, root_object = null) {
  const field_meta = get_field_meta(path_key);
  if (field_meta?.hidden) {
    return true;
  }
  if (field_meta?.hidden_if && root_object) {
    try {
      const hidden_value = get_object_path_value(root_object, field_meta.hidden_if.path.split("."));
      if (Object.prototype.hasOwnProperty.call(field_meta.hidden_if, "equals")) {
        return hidden_value === field_meta.hidden_if.equals;
      }
      return Boolean(hidden_value);
    } catch {
      return false;
    }
  }
  return false;
}

export function control_visibility_depends_on(path_key) {
  return Object.values(CONFIG_FIELD_META).some(
    (field_meta) => field_meta?.hidden_if?.path === path_key
  );
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

export function sync_profile_derived_config(target) {
  if (!is_plain_object(target) || !is_plain_object(target.composition)) {
    return;
  }

  const profile_key = typeof target.output_profile_key === "string"
    ? target.output_profile_key
    : DEFAULT_OUTPUT_PROFILE_KEY;
  const profile = get_output_profile_metrics(profile_key);
  target.output_profile_key = profile.key;
  target.composition.center_x_px = profile.center_x_px;
  target.composition.center_y_px = profile.center_y_px;
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
  ensure_editor_schema_defaults(snapshot);
  if (is_plain_object(snapshot.layout_grid)) {
    const baseline_step_px = Math.max(1, Number(snapshot.layout_grid.baseline_step_px || 8));
    if (
      !Number.isFinite(Number(source?.layout_grid?.margin_top_baselines)) &&
      Number.isFinite(Number(source?.layout_grid?.margin_top_px))
    ) {
      snapshot.layout_grid.margin_top_baselines = Math.max(
        0,
        Math.round(Number(source.layout_grid.margin_top_px) / baseline_step_px)
      );
    }
    if (
      !Number.isFinite(Number(source?.layout_grid?.margin_bottom_baselines)) &&
      Number.isFinite(Number(source?.layout_grid?.margin_bottom_px))
    ) {
      snapshot.layout_grid.margin_bottom_baselines = Math.max(
        0,
        Math.round(Number(source.layout_grid.margin_bottom_px) / baseline_step_px)
      );
    }
    if (
      !Number.isFinite(Number(source?.layout_grid?.margin_side_baselines)) &&
      Number.isFinite(Number(source?.layout_grid?.margin_side_px))
    ) {
      snapshot.layout_grid.margin_side_baselines = Math.max(
        0,
        Math.round(Number(source.layout_grid.margin_side_px) / baseline_step_px)
      );
    }
    if (
      !Number.isFinite(Number(source?.layout_grid?.row_gutter_baselines)) &&
      Number.isFinite(Number(source?.layout_grid?.gutter_baselines))
    ) {
      snapshot.layout_grid.row_gutter_baselines = Math.max(
        0,
        Math.round(Number(source.layout_grid.gutter_baselines))
      );
    }
    if (
      !Number.isFinite(Number(source?.layout_grid?.column_gutter_baselines)) &&
      Number.isFinite(Number(source?.layout_grid?.gutter_baselines))
    ) {
      snapshot.layout_grid.column_gutter_baselines = Math.max(
        0,
        Math.round(Number(source.layout_grid.gutter_baselines))
      );
    }
  }
  if (is_plain_object(snapshot.overlay_text)) {
    if (
      typeof source?.overlay_text?.content_format !== "string" ||
      !OVERLAY_CONTENT_FORMATS[source.overlay_text.content_format]
    ) {
      snapshot.overlay_text.content_format = OVERLAY_CONTENT_FORMAT_ORDER[0];
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.main_heading_x_px)) &&
      Number.isFinite(Number(source?.overlay_text?.x_px))
    ) {
      snapshot.overlay_text.main_heading_x_px = Number(source.overlay_text.x_px);
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.main_heading_y_baselines)) &&
      Number.isFinite(Number(source?.overlay_text?.y_baselines))
    ) {
      snapshot.overlay_text.main_heading_y_baselines = Number(source.overlay_text.y_baselines);
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.main_heading_max_width_px)) &&
      Number.isFinite(Number(source?.overlay_text?.max_width_px))
    ) {
      snapshot.overlay_text.main_heading_max_width_px = Number(source.overlay_text.max_width_px);
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.b_head_font_size_px)) &&
      Number.isFinite(Number(source?.overlay_text?.subtitle_font_size_px))
    ) {
      snapshot.overlay_text.b_head_font_size_px = Number(source.overlay_text.subtitle_font_size_px);
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.b_head_line_height_px)) &&
      Number.isFinite(Number(source?.overlay_text?.subtitle_line_height_px))
    ) {
      snapshot.overlay_text.b_head_line_height_px = Number(source.overlay_text.subtitle_line_height_px);
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.paragraph_font_size_px)) &&
      Number.isFinite(Number(source?.overlay_text?.subtitle_font_size_px))
    ) {
      snapshot.overlay_text.paragraph_font_size_px = Number(source.overlay_text.subtitle_font_size_px);
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.paragraph_line_height_px)) &&
      Number.isFinite(Number(source?.overlay_text?.subtitle_line_height_px))
    ) {
      snapshot.overlay_text.paragraph_line_height_px = Number(source.overlay_text.subtitle_line_height_px);
    }

    if (
      !Number.isFinite(Number(source?.overlay_text?.main_heading_keyline_index)) &&
      Number.isFinite(Number(source?.overlay_text?.main_heading_x_px))
    ) {
      snapshot.overlay_text.main_heading_keyline_index = derive_keyline_index_from_legacy_x(
        snapshot,
        source.overlay_text.main_heading_x_px
      );
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.text_1_keyline_index)) &&
      Number.isFinite(Number(source?.overlay_text?.text_1_x_px))
    ) {
      snapshot.overlay_text.text_1_keyline_index = derive_keyline_index_from_legacy_x(
        snapshot,
        source.overlay_text.text_1_x_px
      );
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.text_2_keyline_index)) &&
      Number.isFinite(Number(source?.overlay_text?.text_2_x_px))
    ) {
      snapshot.overlay_text.text_2_keyline_index = derive_keyline_index_from_legacy_x(
        snapshot,
        source.overlay_text.text_2_x_px
      );
    }
    if (
      !Number.isFinite(Number(source?.overlay_text?.text_3_keyline_index)) &&
      Number.isFinite(Number(source?.overlay_text?.text_3_x_px))
    ) {
      snapshot.overlay_text.text_3_keyline_index = derive_keyline_index_from_legacy_x(
        snapshot,
        source.overlay_text.text_3_x_px
      );
    }
  }
  if (is_plain_object(snapshot.overlay_content_formats) && !is_plain_object(source?.overlay_content_formats)) {
    const generic_social = get_overlay_format_bucket(snapshot, "generic_social");
    for (const [runtime_key, format_key_name] of OVERLAY_FORMAT_RUNTIME_MAPPING) {
      generic_social[format_key_name] = deep_clone(snapshot.overlay_text[runtime_key]);
    }
  } else if (is_plain_object(snapshot.overlay_content_formats) && is_plain_object(source?.overlay_content_formats)) {
    for (const [format_key, source_bucket] of Object.entries(source.overlay_content_formats)) {
      if (!is_plain_object(source_bucket)) {
        continue;
      }
      const snapshot_bucket = get_overlay_format_bucket(snapshot, format_key);
      for (const [keyline_key, legacy_key] of [
        ["text_1_keyline_index", "text_1_x_px"],
        ["text_2_keyline_index", "text_2_x_px"],
        ["text_3_keyline_index", "text_3_x_px"]
      ]) {
        if (
          !Number.isFinite(Number(source_bucket[keyline_key])) &&
          Number.isFinite(Number(source_bucket[legacy_key]))
        ) {
          snapshot_bucket[keyline_key] = derive_keyline_index_from_legacy_x(
            snapshot,
            source_bucket[legacy_key]
          );
        }
      }
    }
  }
  if (
    !is_plain_object(source?.screensaver) &&
    Number.isFinite(Number(source?.finale?.orbit_breath_cycle_sec))
  ) {
    snapshot.screensaver.cycle_sec = Number(source.finale.orbit_breath_cycle_sec);
  }
  sync_profile_derived_config(snapshot);
  sync_overlay_content_format_runtime_fields(snapshot);
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
