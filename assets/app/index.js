import {
  ACTIVE_PRESET_STORAGE_KEY,
  DEFAULT_OUTPUT_PROFILE_KEY,
  DOCKED_EDITOR_MIN_WIDTH_PX,
  EDITOR_TAB_GROUPS,
  EXPORT_DIRECTORY_DB_NAME,
  EXPORT_DIRECTORY_KEY,
  EXPORT_DIRECTORY_STORE_NAME,
  OUTPUT_PROFILE_ORDER,
  OUTPUT_PROFILES,
  PRESET_STORAGE_KEY,
  clamp,
  create_default_config,
  deep_clone,
  get_output_profile_metrics,
  get_control_help_text,
  get_control_label,
  get_field_meta,
  get_numeric_control_spec,
  get_object_path_value,
  humanize_key,
  is_control_hidden,
  is_hex_color_string,
  is_plain_object,
  normalize_config_snapshot,
  replace_config,
  set_object_path_value,
  wrap_positive
} from "./config-schema.js";
import { createRenderer } from "./rendering.js";

const stage = document.querySelector("[data-stage]");
const canvas = stage.querySelector("canvas");
const app_root = document.querySelector(".mascot-app");
const control_panel =
  document.querySelector("[data-control-panel]") || document.querySelector("#control-drawer");
const drawer_toggle_button = document.querySelector("[data-drawer-toggle]");
const drawer_backdrop = document.querySelector("[data-drawer-backdrop]");
const drawer_close_button = document.querySelector("[data-drawer-close]");
const replay_button = document.querySelector("[data-replay-button]");
const export_sequence_button = document.querySelector("[data-export-sequence-button]");
const set_defaults_button = document.querySelector("[data-set-defaults-button]");
const reset_button = document.querySelector("[data-reset-button]");
const preset_name_input = document.querySelector("[data-preset-name]");
const preset_save_button = document.querySelector("[data-preset-save]");
const preset_export_button = document.querySelector("[data-preset-export]");
const preset_import_input = document.querySelector("[data-preset-import]");
const preset_delete_button = document.querySelector("[data-preset-delete]");
const preset_tabs = document.querySelector("[data-preset-tabs]");
const preset_meta = document.querySelector("[data-preset-meta]");
const preset_panel = document.querySelector("[data-preset-panel]");
const output_profile_options = document.querySelector("[data-output-profile-options]");
const config_editor = document.querySelector("[data-config-editor]");
const text_overlay_canvas = stage.querySelector("[data-text-overlay]");

const config = create_default_config();
const default_config = deep_clone(config);
const renderer = createRenderer({ stage, canvas, text_overlay_canvas, config });

const state = {
  presets: [],
  active_preset_id: null,
  selected_preset_id: null,
  active_editor_tab_key: null,
  export_directory_handle: null,
  is_exporting: false,
  editor_controls: new Map(),
  output_profile_inputs: new Map(),
  drawer_is_open: false
};

const is_webkit_slider_engine =
  /\b(?:Chrome|CriOS|Safari|Edg|HeadlessChrome)\b/i.test(navigator.userAgent) &&
  !/\bFirefox\b/i.test(navigator.userAgent);
const url_search_params = new URLSearchParams(location.search);
const is_local_editor = url_search_params.has("tune");
const LEGACY_BROWSER_DEFAULT_CONFIG_KEY = "radial-mascot-browser-default-config-v1";

const RENDER_ONLY_CONTROL_PATHS = new Set([
  "head_turn.peak_angle_deg",
  "head_turn.reverse_angle_deg",
  "head_turn.overshoot_angle_deg",
  "head_turn.peak_frac",
  "head_turn.reverse_frac",
  "head_turn.overshoot_frac",
  "blink.close_frac",
  "blink.hold_closed_frac",
  "blink.eye_scale_y_closed",
  "finale.halo_inner_radius_u",
  "finale.start_angle_deg",
  "finale.mask_angle_offset_deg",
  "screensaver.cycle_sec",
  "screensaver.ramp_in_sec",
  "screensaver.pulse_orbits",
  "screensaver.pulse_spokes",
  "screensaver.min_spoke_count",
  "screensaver.phase_boundary_transition_sec",
  "vignette.enabled",
  "vignette.radius_px",
  "vignette.feather_px",
  "vignette.choke",
  "sneeze.nose_bob_up_px",
  "spoke_lines.show_reference_halo",
  "spoke_lines.show_debug_masks",
  "spoke_lines.construction_color",
  "spoke_lines.reference_color",
  "spoke_lines.echo_color",
  "spoke_lines.echo_shape_seed",
  "spoke_lines.width_px",
  "spoke_lines.inner_width_px",
  "spoke_lines.phase_start_scale",
  "spoke_lines.echo_count",
  "spoke_lines.echo_style",
  "spoke_lines.echo_mix_shape_pct",
  "spoke_lines.echo_width_mult",
  "spoke_lines.echo_wave_count",
  "spoke_lines.echo_opacity_mult"
]);

const SECTION_LABELS = Object.freeze({
  head_turn: "Head Turn",
  blink: "Blink",
  finale: "Finale",
  generator_wrangle: "Field Layout",
  transition_wrangle: "Dot Motion",
  point_style: "Dot Style",
  spoke_lines: "Halo Spokes",
  screensaver: "Screensaver Loop",
  vignette: "Vignette",
  mascot: "Mascot Size"
});

function get_section_label(section_key) {
  return SECTION_LABELS[section_key] || humanize_key(section_key);
}

function set_preset_meta(message, is_error = false) {
  preset_meta.textContent = message;
  preset_meta.classList.toggle("is-error", is_error);
}

function get_next_preset_name() {
  let index = state.presets.length + 1;
  const existing_names = new Set(state.presets.map((preset) => preset.name));
  while (existing_names.has(`Preset ${index}`)) {
    index += 1;
  }
  return `Preset ${index}`;
}

function get_requested_preset_name() {
  return preset_name_input.value.trim() || get_next_preset_name();
}

function create_preset_id() {
  return `preset-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function sanitize_file_name(value) {
  return (
    value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "preset"
  );
}

function replace_object_contents(target, source) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, deep_clone(source));
}

function get_preset_export_dimension_folder_name(profile_key = get_current_output_profile_key()) {
  const profile_metrics = get_output_profile_metrics(profile_key);
  return `${profile_metrics.width_px}x${profile_metrics.height_px}`;
}

function escape_regexp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function get_config_value(path_parts) {
  return get_object_path_value(config, path_parts);
}

function set_config_value(path_parts, next_value) {
  set_object_path_value(config, path_parts.join("."), next_value);
}

function clear_legacy_browser_default_config() {
  try {
    window.localStorage.removeItem(LEGACY_BROWSER_DEFAULT_CONFIG_KEY);
  } catch (error) {
    console.error(error);
  }
}

async function write_source_default_snapshot(snapshot) {
  let response;
  try {
    response = await fetch("/__authoring/source-default-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ config: snapshot })
    });
  } catch (error) {
    throw new Error(
      "Source-default writeback needs the authoring dev server. Run `npm run dev` to write assets/app/default-config-source.js."
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (response.status === 404) {
    throw new Error(
      "Source-default writeback is not available in this build. Run `npm run dev` to write assets/app/default-config-source.js."
    );
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `Source default write failed with ${response.status}.`);
  }
  return payload;
}

async function read_source_default_snapshot() {
  let response;
  try {
    response = await fetch(`/__authoring/source-default-config?ts=${Date.now()}`, {
      cache: "no-store"
    });
  } catch {
    return deep_clone(default_config);
  }

  if (!response.ok) {
    return deep_clone(default_config);
  }

  const payload = await response.json().catch(() => null);
  if (!payload?.ok || !is_plain_object(payload.config)) {
    return deep_clone(default_config);
  }

  const source_default_base = create_default_config();
  return normalize_config_snapshot(payload.config, source_default_base);
}

function set_active_editor_tab(next_tab_key) {
  state.active_editor_tab_key = next_tab_key;

  for (const tab of config_editor.querySelectorAll("[data-editor-tab]")) {
    const is_active = tab.dataset.editorTab === next_tab_key;
    tab.setAttribute("aria-selected", String(is_active));
    tab.setAttribute("tabindex", is_active ? "0" : "-1");
  }

  for (const panel of config_editor.querySelectorAll("[data-editor-panel]")) {
    panel.hidden = panel.dataset.editorPanel !== next_tab_key;
  }
}

function focus_adjacent_editor_tab(current_tab_key, direction) {
  const current_index = EDITOR_TAB_GROUPS.findIndex((group) => group.key === current_tab_key);
  if (current_index === -1) {
    return;
  }

  const next_index = wrap_positive(current_index + direction, EDITOR_TAB_GROUPS.length);
  const next_group = EDITOR_TAB_GROUPS[next_index];
  set_active_editor_tab(next_group.key);

  const next_tab = config_editor.querySelector(`[data-editor-tab="${next_group.key}"]`);
  if (next_tab) {
    next_tab.focus();
  }
}

function get_slider_palette() {
  const styles = getComputedStyle(app_root);
  return {
    progress: styles.getPropertyValue("--vf-color-link-default").trim() || "#ffffff",
    empty: styles.getPropertyValue("--vf-color-border-default").trim() || "#4b4b4b"
  };
}

function render_slider_track(range_input) {
  if (!range_input) {
    return;
  }

  const min = Number(range_input.min || 0);
  const max = Number(range_input.max || 100);
  const value = Number(range_input.value || 0);
  const span = Math.max(0.0001, max - min);
  const fill_ratio = clamp((value - min) / span, 0, 1);
  const palette = get_slider_palette();

  range_input.style.accentColor = palette.progress;
  range_input.style.backgroundRepeat = "no-repeat";
  range_input.style.backgroundSize = "100% 100%";

  if (!is_webkit_slider_engine) {
    range_input.style.backgroundImage = "";
    return;
  }

  const fill_percent = (fill_ratio * 100).toFixed(3);
  range_input.style.backgroundImage =
    `linear-gradient(to right, ${palette.progress} 0%, ${palette.progress} ${fill_percent}%, ` +
    `${palette.empty} ${fill_percent}%, ${palette.empty} 100%)`;
}

function refresh_slider_tracks() {
  for (const control of state.editor_controls.values()) {
    if (control.type === "number") {
      render_slider_track(control.range_input);
    }
  }
}

function sync_editor_values() {
  for (const [path_key, control] of state.editor_controls.entries()) {
    const value = get_config_value(path_key.split("."));
    if (control.type === "number") {
      control.range_input.value = String(
        clamp(value, Number(control.range_input.min), Number(control.range_input.max))
      );
      control.number_input.value = String(value);
      continue;
    }

    if (control.input.type === "checkbox") {
      control.input.checked = Boolean(value);
    } else {
      control.input.value = String(value);
    }
  }

  refresh_slider_tracks();
  sync_output_profile_controls();
}

function get_current_output_profile_key() {
  const profile_key = typeof config.output_profile_key === "string"
    ? config.output_profile_key
    : DEFAULT_OUTPUT_PROFILE_KEY;
  return OUTPUT_PROFILES[profile_key] ? profile_key : DEFAULT_OUTPUT_PROFILE_KEY;
}

function sync_output_profile_controls() {
  const active_key = get_current_output_profile_key();
  for (const [profile_key, radio_input] of state.output_profile_inputs.entries()) {
    radio_input.checked = profile_key === active_key;
  }
}

async function apply_output_profile(profile_key, { announce = true } = {}) {
  const next_profile_key = OUTPUT_PROFILES[profile_key] ? profile_key : DEFAULT_OUTPUT_PROFILE_KEY;
  if (config.output_profile_key === next_profile_key && renderer.getOutputProfileKey() === next_profile_key) {
    sync_output_profile_controls();
    return;
  }

  config.output_profile_key = next_profile_key;
  const next_metrics = get_output_profile_metrics(next_profile_key);
  config.composition.center_x_px = next_metrics.center_x_px;
  config.composition.center_y_px = next_metrics.center_y_px;
  renderer.setOutputProfile(next_profile_key);
  sync_editor_values();
  await renderer.refreshScene({ reload_mascot: true });

  if (announce) {
    const profile = OUTPUT_PROFILES[next_profile_key];
    set_preset_meta(
      `Switched format to ${profile.label} (${profile.width_px} x ${profile.height_px}).`,
      false
    );
  }
}

function render_output_profile_options() {
  if (!output_profile_options) {
    return;
  }

  state.output_profile_inputs.clear();
  output_profile_options.innerHTML = "";

  const list = document.createElement("div");
  list.className = "preset-radio-list";
  list.setAttribute("role", "radiogroup");
  list.setAttribute("aria-label", "Output formats");

  for (const profile_key of OUTPUT_PROFILE_ORDER) {
    const profile = OUTPUT_PROFILES[profile_key];
    if (!profile) {
      continue;
    }

    const row = document.createElement("label");
    row.className = "preset-radio-row format-radio-row";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "output-profile";
    radio.value = profile.key;
    radio.checked = profile.key === get_current_output_profile_key();
    radio.addEventListener("change", () => {
      void apply_output_profile(profile.key);
    });

    const details = document.createElement("div");
    details.className = "format-radio-details";

    const name = document.createElement("div");
    name.className = "preset-radio-name";
    name.textContent = profile.label;

    const meta = document.createElement("div");
    meta.className = "format-radio-meta";
    meta.textContent = `${profile.platforms} | ${profile.safe_zone}`;

    details.appendChild(name);
    details.appendChild(meta);

    row.appendChild(radio);
    row.appendChild(details);
    list.appendChild(row);
    state.output_profile_inputs.set(profile.key, radio);
  }

  output_profile_options.appendChild(list);
}

function update_preset_controls() {
  preset_delete_button.disabled = !state.active_preset_id;
}

function set_drawer_open(next_state) {
  const is_docked = is_local_editor && window.innerWidth >= DOCKED_EDITOR_MIN_WIDTH_PX;
  const is_open = is_docked ? true : next_state;

  state.drawer_is_open = is_open;
  document.body.classList.toggle("editor-docked", is_docked);
  document.body.classList.toggle("drawer-open", is_open);
  control_panel.classList.toggle("is-collapsed", !is_open);
  drawer_toggle_button.hidden = is_docked;
  drawer_backdrop.hidden = is_docked;
  drawer_close_button.hidden = is_docked;
  drawer_toggle_button.setAttribute("aria-expanded", String(is_open));
  drawer_toggle_button.textContent = is_open && !is_docked ? "Close" : "Controls";
}

function toggle_drawer() {
  set_drawer_open(!state.drawer_is_open);
}

function update_editor_panel_mode() {
  if (!is_local_editor) {
    return;
  }
  set_drawer_open(window.innerWidth >= DOCKED_EDITOR_MIN_WIDTH_PX);
}

function save_presets_to_storage() {
  try {
    collapse_state_presets();
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(state.presets));
    window.localStorage.removeItem(ACTIVE_PRESET_STORAGE_KEY);
  } catch (error) {
    console.error(error);
    set_preset_meta("Preset storage is not available in this browser.", true);
  }
}

function open_editor_storage_db() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(EXPORT_DIRECTORY_DB_NAME, 1);
    request.addEventListener("upgradeneeded", () => {
      if (!request.result.objectStoreNames.contains(EXPORT_DIRECTORY_STORE_NAME)) {
        request.result.createObjectStore(EXPORT_DIRECTORY_STORE_NAME);
      }
    });
    request.addEventListener("success", () => {
      resolve(request.result);
    });
    request.addEventListener("error", () => {
      reject(request.error);
    });
  });
}

async function read_editor_storage_value(key) {
  const database = await open_editor_storage_db();
  if (!database) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(EXPORT_DIRECTORY_STORE_NAME, "readonly");
    const store = transaction.objectStore(EXPORT_DIRECTORY_STORE_NAME);
    const request = store.get(key);
    request.addEventListener("success", () => {
      resolve(request.result ?? null);
    });
    request.addEventListener("error", () => {
      reject(request.error);
    });
    transaction.addEventListener("complete", () => {
      database.close();
    });
  });
}

async function write_editor_storage_value(key, value) {
  const database = await open_editor_storage_db();
  if (!database) {
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(EXPORT_DIRECTORY_STORE_NAME, "readwrite");
    const store = transaction.objectStore(EXPORT_DIRECTORY_STORE_NAME);
    const request = store.put(value, key);
    request.addEventListener("success", () => {
      resolve();
    });
    request.addEventListener("error", () => {
      reject(request.error);
    });
    transaction.addEventListener("complete", () => {
      database.close();
    });
  });
}

function is_abort_error(error) {
  return Boolean(error) && (error.name === "AbortError" || error.code === 20);
}

async function ensure_directory_write_permission(directory_handle, request_if_needed = true) {
  if (!directory_handle) {
    return false;
  }

  if (typeof directory_handle.queryPermission !== "function") {
    return true;
  }

  const permission_options = { mode: "readwrite" };
  let permission_state = await directory_handle.queryPermission(permission_options);
  if (
    permission_state !== "granted" &&
    request_if_needed &&
    typeof directory_handle.requestPermission === "function"
  ) {
    permission_state = await directory_handle.requestPermission(permission_options);
  }

  return permission_state === "granted";
}

async function load_export_directory_handle() {
  try {
    const saved_handle = await read_editor_storage_value(EXPORT_DIRECTORY_KEY);
    return saved_handle && saved_handle.kind === "directory" ? saved_handle : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function persist_export_directory_handle(directory_handle) {
  try {
    await write_editor_storage_value(EXPORT_DIRECTORY_KEY, directory_handle);
  } catch (error) {
    console.error(error);
  }
}

async function get_export_directory_handle() {
  if (state.export_directory_handle) {
    const has_permission = await ensure_directory_write_permission(
      state.export_directory_handle,
      true
    );
    if (has_permission) {
      return state.export_directory_handle;
    }
    state.export_directory_handle = null;
  }

  const saved_handle = await load_export_directory_handle();
  if (!saved_handle) {
    return null;
  }

  const has_permission = await ensure_directory_write_permission(saved_handle, true);
  if (!has_permission) {
    return null;
  }

  state.export_directory_handle = saved_handle;
  return saved_handle;
}

async function request_export_directory_handle() {
  if (typeof window.showDirectoryPicker !== "function") {
    return null;
  }

  const directory_handle = await window.showDirectoryPicker({
    id: "radial-mascot-presets",
    mode: "readwrite",
    startIn: "documents"
  });
  const has_permission = await ensure_directory_write_permission(directory_handle, true);
  if (!has_permission) {
    return null;
  }

  state.export_directory_handle = directory_handle;
  await persist_export_directory_handle(directory_handle);
  return directory_handle;
}

async function write_json_file(file_handle, payload) {
  const writable = await file_handle.createWritable();
  await writable.write(JSON.stringify(payload, null, 2));
  await writable.close();
}

async function write_blob_file(file_handle, blob) {
  const writable = await file_handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function get_sequence_output_directory_handle() {
  let directory_handle = await get_export_directory_handle();
  if (!directory_handle) {
    set_preset_meta("Choose the project folder or its output folder for PNG export.", false);
    directory_handle = await request_export_directory_handle();
  }

  if (!directory_handle) {
    return null;
  }

  const output_directory_handle = directory_handle.name.toLowerCase() === "output"
    ? directory_handle
    : await directory_handle.getDirectoryHandle("output", { create: true });
  const dimensions_folder_name = get_preset_export_dimension_folder_name();
  const dimension_directory_handle = await output_directory_handle.getDirectoryHandle(
    dimensions_folder_name,
    { create: true }
  );
  const base_path_label = directory_handle.name.toLowerCase() === "output"
    ? directory_handle.name
    : `${directory_handle.name}/${output_directory_handle.name}`;

  return {
    directory_handle: dimension_directory_handle,
    output_path_label: `${base_path_label}/${dimension_directory_handle.name}`
  };
}

async function get_preset_export_directory_handle() {
  let directory_handle = await get_export_directory_handle();
  if (!directory_handle) {
    set_preset_meta("Choose the project folder or a presets folder for JSON preset export.", false);
    directory_handle = await request_export_directory_handle();
  }

  if (!directory_handle) {
    return null;
  }

  const presets_directory_handle = directory_handle.name.toLowerCase() === "presets"
    ? directory_handle
    : await directory_handle.getDirectoryHandle("presets", { create: true });
  const dimensions_folder_name = get_preset_export_dimension_folder_name();
  const dimension_directory_handle = await presets_directory_handle.getDirectoryHandle(
    dimensions_folder_name,
    { create: true }
  );

  const base_path_label = directory_handle.name.toLowerCase() === "presets"
    ? directory_handle.name
    : `${directory_handle.name}/${presets_directory_handle.name}`;

  return {
    directory_handle: dimension_directory_handle,
    output_path_label: `${base_path_label}/${dimension_directory_handle.name}`
  };
}

async function get_next_preset_export_version(directory_handle, preset_slug) {
  const file_name_pattern = new RegExp(`^v(\\d+)\\.(\\d+)-${escape_regexp(preset_slug)}\\.json$`, "i");
  let highest_major = 0;
  let highest_minor = 0;

  for await (const [entry_name, entry_handle] of directory_handle.entries()) {
    if (entry_handle.kind !== "file") {
      continue;
    }

    const match = entry_name.match(file_name_pattern);
    if (!match) {
      continue;
    }

    const major = Number(match[1]);
    const minor = Number(match[2]);
    if (!Number.isFinite(major) || !Number.isFinite(minor)) {
      continue;
    }

    if (major > highest_major || (major === highest_major && minor > highest_minor)) {
      highest_major = major;
      highest_minor = minor;
    }
  }

  if (highest_major === 0) {
    return "v0.1";
  }

  return `v${highest_major}.${highest_minor + 1}`;
}

function normalize_preset_entry(entry, fallback_name) {
  if (!is_plain_object(entry)) {
    return null;
  }

  const snapshot_source = is_plain_object(entry.config) ? entry.config : entry;
  return {
    id: typeof entry.id === "string" && entry.id ? entry.id : create_preset_id(),
    name: typeof entry.name === "string" && entry.name.trim() ? entry.name.trim() : fallback_name,
    config: normalize_config_snapshot(snapshot_source, default_config)
  };
}

function get_preset_name_key(name) {
  return String(name || "").trim().toLowerCase();
}

function collapse_presets_by_name(presets) {
  const seen_name_keys = new Set();
  const collapsed_reversed = [];

  for (let index = presets.length - 1; index >= 0; index -= 1) {
    const preset = presets[index];
    const name_key = get_preset_name_key(preset.name);
    if (seen_name_keys.has(name_key)) {
      continue;
    }

    seen_name_keys.add(name_key);
    collapsed_reversed.push(preset);
  }

  return collapsed_reversed.reverse();
}

function find_preset_by_name(name, presets = state.presets) {
  const name_key = get_preset_name_key(name);

  for (let index = presets.length - 1; index >= 0; index -= 1) {
    const preset = presets[index];
    if (get_preset_name_key(preset.name) === name_key) {
      return preset;
    }
  }

  return null;
}

function sync_preset_ids_after_collapse(previous_presets) {
  const previous_active_name =
    previous_presets.find((preset) => preset.id === state.active_preset_id)?.name || null;
  const previous_selected_name =
    previous_presets.find((preset) => preset.id === state.selected_preset_id)?.name || null;

  if (!state.presets.some((preset) => preset.id === state.active_preset_id)) {
    state.active_preset_id = previous_active_name
      ? find_preset_by_name(previous_active_name, state.presets)?.id || null
      : null;
  }

  if (!state.presets.some((preset) => preset.id === state.selected_preset_id)) {
    state.selected_preset_id = previous_selected_name
      ? find_preset_by_name(previous_selected_name, state.presets)?.id || null
      : null;
  }

  if (!state.selected_preset_id) {
    state.selected_preset_id = state.active_preset_id || state.presets[0]?.id || null;
  }
}

function collapse_state_presets() {
  const previous_presets = state.presets.slice();
  state.presets = collapse_presets_by_name(previous_presets);
  sync_preset_ids_after_collapse(previous_presets);
}

function load_presets_from_storage() {
  state.presets = [];
  state.active_preset_id = null;
  state.selected_preset_id = null;

  try {
    const raw_presets = window.localStorage.getItem(PRESET_STORAGE_KEY);
    const parsed_presets = raw_presets ? JSON.parse(raw_presets) : [];
    let normalized_presets = [];
    if (Array.isArray(parsed_presets)) {
      normalized_presets = parsed_presets
        .map((entry, index) => normalize_preset_entry(entry, `Preset ${index + 1}`))
        .filter(Boolean);
    }

    state.presets = collapse_presets_by_name(normalized_presets);
    window.localStorage.removeItem(ACTIVE_PRESET_STORAGE_KEY);
    state.selected_preset_id = state.presets[0]?.id || null;

    if (state.presets.length !== normalized_presets.length) {
      save_presets_to_storage();
    }
  } catch (error) {
    console.error(error);
    state.presets = [];
    state.active_preset_id = null;
    state.selected_preset_id = null;
    set_preset_meta("Saved presets could not be read. Storage was reset.", true);
  }
}

function render_preset_tabs() {
  preset_tabs.innerHTML = "";

  if (state.presets.length === 0) {
    const empty_state = document.createElement("p");
    empty_state.className = "p-form-help-text preset-empty";
    empty_state.textContent = "No saved presets yet.";
    preset_tabs.appendChild(empty_state);
    update_preset_controls();
    return;
  }

  const list = document.createElement("div");
  list.className = "preset-radio-list";
  list.setAttribute("role", "radiogroup");
  list.setAttribute("aria-label", "Saved presets");

  for (let index = 0; index < state.presets.length; index += 1) {
    const preset = state.presets[index];
    const row = document.createElement("label");
    row.className = "preset-radio-row";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "saved-preset";
    radio.value = preset.id;
    radio.checked = preset.id === state.selected_preset_id;
    radio.addEventListener("change", () => {
      state.selected_preset_id = preset.id;
      activate_selected_preset();
    });

    const name = document.createElement("span");
    name.className = "preset-radio-name";
    name.textContent = preset.name;

    row.appendChild(radio);
    row.appendChild(name);

    if (preset.id === state.active_preset_id) {
      const status = document.createElement("span");
      status.className = "preset-radio-status";
      status.textContent = "Active";
      row.appendChild(status);
    }

    list.appendChild(row);
  }

  preset_tabs.appendChild(list);
  update_preset_controls();
}

function create_control_input(path_key, value) {
  const field_meta = get_field_meta(path_key);
  if (typeof value === "number") {
    const numeric_spec = get_numeric_control_spec(path_key, value);
    const field = document.createElement("div");
    field.className = "p-slider__wrapper control-composite";

    const range_input = document.createElement("input");
    range_input.type = "range";
    range_input.className = "u-no-margin--bottom";
    range_input.min = String(numeric_spec.min);
    range_input.max = String(numeric_spec.max);
    range_input.step = String(numeric_spec.step);
    range_input.value = String(clamp(value, numeric_spec.min, numeric_spec.max));
    range_input.dataset.configPath = path_key;
    range_input.addEventListener("input", handle_control_commit);

    const number_input = document.createElement("input");
    number_input.type = "number";
    number_input.className =
      "p-slider__input p-form-validation__input is-dense u-no-margin--bottom";
    number_input.min = String(numeric_spec.min);
    number_input.max = String(numeric_spec.max);
    number_input.step = String(numeric_spec.step);
    number_input.value = String(value);
    number_input.dataset.configPath = path_key;
    number_input.addEventListener("change", handle_control_commit);

    field.appendChild(range_input);
    field.appendChild(number_input);

    return {
      element: field,
      control: {
        type: "number",
        range_input,
        number_input
      }
    };
  }

  const input = document.createElement("input");
  input.dataset.configPath = path_key;

  if (typeof value === "boolean") {
    const checkbox = document.createElement("label");
    checkbox.className = "p-checkbox control-checkbox";

    input.type = "checkbox";
    input.className = "p-checkbox__input";
    input.checked = value;
    input.addEventListener("change", handle_control_commit);

    const label = document.createElement("span");
    label.className = "p-checkbox__label";
    label.textContent = get_control_label(path_key);

    checkbox.appendChild(input);
    checkbox.appendChild(label);
    return {
      element: checkbox,
      control: {
        type: "single",
        input
      }
    };
  }

  if (is_hex_color_string(value)) {
    input.type = "color";
    input.className = "p-form-validation__input is-dense control-color u-no-margin--bottom";
    input.value = value;
    input.addEventListener("input", handle_control_commit);
    return {
      element: input,
      control: {
        type: "single",
        input
      }
    };
  }

  if (field_meta?.options && Array.isArray(field_meta.options)) {
    const select = document.createElement("select");
    select.className = "p-form-validation__input is-dense u-no-margin--bottom";
    select.dataset.configPath = path_key;

    for (const option of field_meta.options) {
      const option_element = document.createElement("option");
      option_element.value = option.value;
      option_element.textContent = option.label;
      option_element.selected = option.value === value;
      select.appendChild(option_element);
    }

    select.addEventListener("change", handle_control_commit);
    return {
      element: select,
      control: {
        type: "single",
        input: select
      }
    };
  }

  input.type = "text";
  input.className = "p-form-validation__input is-dense u-no-margin--bottom";
  input.value = value;
  input.addEventListener("change", handle_control_commit);
  return {
    element: input,
    control: {
      type: "single",
      input
    }
  };
}

function create_control_row(path_parts, value) {
  const path_key = path_parts.join(".");
  if (is_control_hidden(path_key)) {
    return null;
  }

  const help_text = get_control_help_text(path_key);
  const row = document.createElement("div");
  row.className = "p-form__group";

  if (typeof value === "boolean") {
    const input_bundle = create_control_input(path_key, value);
    state.editor_controls.set(path_key, input_bundle.control);
    const control = document.createElement("div");
    control.className = "p-form__control";
    control.appendChild(input_bundle.element);
    row.appendChild(control);
    if (help_text) {
      const help = document.createElement("p");
      help.className = "p-form-help-text control-help";
      help.textContent = help_text;
      row.appendChild(help);
    }
    return row;
  }

  const label = document.createElement("label");
  label.className = "p-form__label u-no-margin--bottom";
  label.htmlFor = `control-${path_key.replace(/\./g, "-")}`;
  label.textContent = get_control_label(path_key);

  const input_bundle = create_control_input(path_key, value);
  state.editor_controls.set(path_key, input_bundle.control);
  if (input_bundle.control.type === "number") {
    input_bundle.control.range_input.id = label.htmlFor;
    input_bundle.control.number_input.id = `${label.htmlFor}-value`;
  } else {
    input_bundle.control.input.id = label.htmlFor;
  }

  const control = document.createElement("div");
  control.className = "p-form__control";
  control.appendChild(input_bundle.element);

  row.appendChild(label);
  row.appendChild(control);
  if (help_text) {
    const help = document.createElement("p");
    help.className = "p-form-help-text control-help";
    help.textContent = help_text;
    row.appendChild(help);
  }
  return row;
}

function append_editor_fields(parent, object_value, path_parts) {
  let appended_count = 0;
  for (const [key, value] of Object.entries(object_value)) {
    const next_path = path_parts.concat(key);
    if (is_plain_object(value)) {
      const group = document.createElement("div");
      group.className = "config-group";

      const group_count = append_editor_fields(group, value, next_path);
      if (group_count === 0) {
        continue;
      }

      const title = document.createElement("h3");
      title.className = "p-muted-heading u-no-margin--bottom";
      title.textContent = humanize_key(key);
      group.prepend(title);
      parent.appendChild(group);
      appended_count += group_count;
      continue;
    }

    const row = create_control_row(next_path, value);
    if (!row) {
      continue;
    }

    parent.appendChild(row);
    appended_count += 1;
  }

  return appended_count;
}

function build_config_editor() {
  config_editor.innerHTML = "";
  state.editor_controls = new Map();

  const tabs = document.createElement("div");
  tabs.className = "p-tabs config-tabs";

  const list = document.createElement("div");
  list.className = "p-tabs__list";
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Animation settings");

  const panels = document.createElement("div");
  panels.className = "config-panels";

  for (const group of EDITOR_TAB_GROUPS) {
    const item = document.createElement("div");
    item.className = "p-tabs__item";

    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "p-tabs__link";
    tab.id = `editor-tab-${group.key}`;
    tab.dataset.editorTab = group.key;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `editor-panel-${group.key}`);
    tab.textContent = group.label;
    tab.addEventListener("click", () => {
      set_active_editor_tab(group.key);
    });
    tab.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        focus_adjacent_editor_tab(group.key, 1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        focus_adjacent_editor_tab(group.key, -1);
      }
    });

    item.appendChild(tab);
    list.appendChild(item);

    const panel = document.createElement("section");
    panel.className = "config-panel";
    panel.id = `editor-panel-${group.key}`;
    panel.dataset.editorPanel = group.key;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("tabindex", "0");
    panel.setAttribute("aria-labelledby", tab.id);

    const form = document.createElement("form");
    form.className = "p-form p-form--stacked editor-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });

    if (group.key === "presets" && preset_panel) {
      preset_panel.hidden = false;
      panel.appendChild(preset_panel);
      panels.appendChild(panel);
      continue;
    }

    for (const section_key of group.sections) {
      const section_value = config[section_key];
      if (!is_plain_object(section_value)) {
        continue;
      }

      const section = document.createElement("div");
      section.className = "config-section";

      const field_count = append_editor_fields(section, section_value, [section_key]);
      if (field_count === 0) {
        continue;
      }

      const title = document.createElement("h2");
      title.className = "p-muted-heading u-no-margin--bottom";
      title.textContent = get_section_label(section_key);
      section.prepend(title);
      form.appendChild(section);
    }

    panel.appendChild(form);
    panels.appendChild(panel);
  }

  tabs.appendChild(list);
  config_editor.appendChild(tabs);
  config_editor.appendChild(panels);

  if (!EDITOR_TAB_GROUPS.some((group) => group.key === state.active_editor_tab_key)) {
    state.active_editor_tab_key = EDITOR_TAB_GROUPS[0]?.key || null;
  }

  if (state.active_editor_tab_key) {
    set_active_editor_tab(state.active_editor_tab_key);
  }

  refresh_slider_tracks();
}

function parse_control_value(input, current_value, path_key) {
  if (typeof current_value === "boolean") {
    return input.checked;
  }

  if (typeof current_value === "number") {
    if (input.value === "") {
      return undefined;
    }

    const next_value = Number(input.value);
    if (!Number.isFinite(next_value)) {
      return undefined;
    }

    const numeric_spec = get_numeric_control_spec(path_key, current_value);
    return clamp(next_value, numeric_spec.min, numeric_spec.max);
  }

  return input.value;
}

async function handle_control_commit(event) {
  const input = event.currentTarget;
  const path_parts = input.dataset.configPath.split(".");
  const path_key = path_parts.join(".");
  const current_value = get_config_value(path_parts);
  const next_value = parse_control_value(input, current_value, path_key);

  if (typeof next_value === "undefined" || next_value === current_value) {
    return;
  }

  set_config_value(path_parts, next_value);
  const control = state.editor_controls.get(path_key);
  if (control && control.type === "number") {
    control.number_input.value = String(next_value);
    control.range_input.value = String(
      clamp(next_value, Number(control.range_input.min), Number(control.range_input.max))
    );
    render_slider_track(control.range_input);
  }

  try {
    const rebuild_scene = !RENDER_ONLY_CONTROL_PATHS.has(path_key);
    await renderer.refreshScene({
      reload_mascot:
        path_parts[0] === "mascot" &&
        (path_parts[1] === "enabled" ||
          path_parts[1] === "face_asset_path" ||
          path_parts[1] === "halo_asset_path"),
      restart_animation: false,
      rebuild_scene,
      invalidate_layers: true
    });

    if (path_parts[0] === "performance" && path_parts[1] === "desynchronized") {
      set_preset_meta("The canvas desynchronized flag changes on next page reload.", false);
    } else {
      set_preset_meta(
        rebuild_scene
          ? "Live config updated. Scene rebuilt."
          : "Live config updated. Cached layers rerendered without rebuilding the scene.",
        false
      );
    }
  } catch (error) {
    console.error(error);
    set_preset_meta(`Config update failed: ${error.message}`, true);
  }
}

async function apply_preset_by_id(preset_id) {
  const preset = state.presets.find((entry) => entry.id === preset_id);
  if (!preset) {
    return;
  }

  state.active_preset_id = preset.id;
  state.selected_preset_id = preset.id;
  replace_config(config, preset.config, default_config);
  renderer.setOutputProfile(get_current_output_profile_key());
  preset_name_input.value = preset.name;
  sync_editor_values();
  render_preset_tabs();
  save_presets_to_storage();

  try {
    await renderer.refreshScene({ reload_mascot: true });
    set_preset_meta(`Loaded preset "${preset.name}".`, false);
  } catch (error) {
    console.error(error);
    set_preset_meta(`Preset load failed: ${error.message}`, true);
  }
}

function build_preset_payload(name, snapshot) {
  return {
    id: create_preset_id(),
    name,
    config: normalize_config_snapshot(snapshot, default_config)
  };
}

function save_preset() {
  collapse_state_presets();
  const preset_name = get_requested_preset_name();
  const target_preset_id = state.selected_preset_id || state.active_preset_id;
  const target_preset_index = target_preset_id
    ? state.presets.findIndex((entry) => entry.id === target_preset_id)
    : -1;

  if (target_preset_index >= 0) {
    const target_preset = state.presets[target_preset_index];
    target_preset.name = preset_name;
    target_preset.config = normalize_config_snapshot(config, default_config);
    state.presets.splice(target_preset_index, 1);
    state.presets.push(target_preset);
    state.active_preset_id = target_preset.id;
    state.selected_preset_id = target_preset.id;
    preset_name_input.value = target_preset.name;
    render_preset_tabs();
    save_presets_to_storage();
    set_preset_meta(`Updated "${target_preset.name}".`, false);
    return;
  }

  const existing_preset = find_preset_by_name(preset_name);

  if (existing_preset) {
    existing_preset.name = preset_name;
    existing_preset.config = normalize_config_snapshot(config, default_config);
    state.active_preset_id = existing_preset.id;
    state.selected_preset_id = existing_preset.id;
    preset_name_input.value = existing_preset.name;
    render_preset_tabs();
    save_presets_to_storage();
    set_preset_meta(`Updated "${existing_preset.name}".`, false);
    return;
  }

  const preset = build_preset_payload(preset_name, config);
  state.presets.push(preset);
  state.active_preset_id = preset.id;
  state.selected_preset_id = preset.id;
  preset_name_input.value = preset.name;
  render_preset_tabs();
  save_presets_to_storage();
  set_preset_meta(`Saved "${preset.name}" as a new preset.`, false);
}

function delete_active_preset() {
  if (!state.active_preset_id) {
    return;
  }

  const preset = state.presets.find((entry) => entry.id === state.active_preset_id);
  const should_delete = window.confirm(`Delete preset "${preset ? preset.name : "this preset"}"?`);
  if (!should_delete) {
    return;
  }

  state.presets = state.presets.filter((entry) => entry.id !== state.active_preset_id);
  state.active_preset_id = null;
  state.selected_preset_id = state.presets[0]?.id || null;
  preset_name_input.value = get_next_preset_name();
  render_preset_tabs();
  save_presets_to_storage();
  set_preset_meta("Preset deleted. Current config stayed in place.", false);
}

async function export_current_preset() {
  const preset_name = get_requested_preset_name();
  const payload = {
    name: preset_name,
    config: normalize_config_snapshot(config, default_config)
  };
  const preset_slug = sanitize_file_name(preset_name);

  try {
    const preset_export_directory = await get_preset_export_directory_handle();
    if (preset_export_directory) {
      const version_label = await get_next_preset_export_version(
        preset_export_directory.directory_handle,
        preset_slug
      );
      const file_name = `${version_label}-${preset_slug}.json`;
      const file_handle = await preset_export_directory.directory_handle.getFileHandle(
        file_name,
        { create: true }
      );
      await write_json_file(file_handle, payload);
      set_preset_meta(
        `Exported "${preset_name}" to ${preset_export_directory.output_path_label}/${file_name}.`,
        false
      );
      return;
    }

    if (typeof window.showSaveFilePicker === "function") {
      const file_name = `v0.1-${preset_slug}.json`;
      const file_handle = await window.showSaveFilePicker({
        id: "radial-mascot-preset-file",
        suggestedName: file_name,
        startIn: "documents",
        types: [
          {
            description: "JSON preset",
            accept: {
              "application/json": [".json"]
            }
          }
        ]
      });
      await write_json_file(file_handle, payload);
      set_preset_meta(`Exported "${preset_name}" as ${file_name}.`, false);
      return;
    }

    const file_name = `v0.1-${preset_slug}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const object_url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = object_url;
    link.download = file_name;
    link.click();
    URL.revokeObjectURL(object_url);
    set_preset_meta(`Exported "${preset_name}" as ${file_name}.`, false);
  } catch (error) {
    if (is_abort_error(error)) {
      return;
    }

    console.error(error);
    set_preset_meta(`Export failed: ${error.message}`, true);
  }
}

async function import_presets_from_file(file) {
  const file_text = await file.text();
  const parsed = JSON.parse(file_text);
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const imported_presets = [];

  for (let index = 0; index < entries.length; index += 1) {
    const preset = normalize_preset_entry(entries[index], get_next_preset_name());
    if (preset) {
      state.presets.push(preset);
      imported_presets.push(preset);
    }
  }

  if (imported_presets.length === 0) {
    throw new Error("No presets were found in that file.");
  }

  collapse_state_presets();
  render_preset_tabs();
  save_presets_to_storage();
  const newest_imported_preset = find_preset_by_name(imported_presets[imported_presets.length - 1].name);
  if (newest_imported_preset) {
    await apply_preset_by_id(newest_imported_preset.id);
  }
  set_preset_meta(
    `Imported ${imported_presets.length} preset${imported_presets.length === 1 ? "" : "s"}.`,
    false
  );
}

async function reset_to_defaults() {
  const source_snapshot = await read_source_default_snapshot();
  replace_object_contents(default_config, source_snapshot);
  replace_object_contents(config, source_snapshot);
  renderer.setOutputProfile(get_current_output_profile_key());
  state.active_preset_id = null;
  state.selected_preset_id = null;
  preset_name_input.value = get_next_preset_name();
  sync_editor_values();
  render_preset_tabs();
  save_presets_to_storage();
  return renderer.refreshScene({ reload_mascot: true })
    .then(() => {
      set_preset_meta("Loaded the source default from assets/app/default-config-source.js.", false);
    })
    .catch((error) => {
      console.error(error);
      set_preset_meta(`Reset failed: ${error.message}`, true);
    });
}

async function write_current_as_source_default() {
  const normalized_snapshot = normalize_config_snapshot(config, default_config);

  try {
    const payload = await write_source_default_snapshot(normalized_snapshot);
    const written_snapshot = is_plain_object(payload?.config)
      ? normalize_config_snapshot(payload.config, create_default_config())
      : normalized_snapshot;
    replace_object_contents(default_config, written_snapshot);
    clear_legacy_browser_default_config();
    set_preset_meta(
      `Wrote the current config to ${payload.path}. This is now the source default.`,
      false
    );
  } catch (error) {
    console.error(error);
    set_preset_meta(`Source default write failed: ${error.message}`, true);
  }
}

function activate_selected_preset() {
  if (!state.selected_preset_id || state.selected_preset_id === state.active_preset_id) {
    return;
  }

  void apply_preset_by_id(state.selected_preset_id);
}

async function export_png_sequence() {
  if (state.is_exporting) {
    return;
  }

  if (typeof window.showDirectoryPicker !== "function") {
    set_preset_meta(
      "PNG sequence export needs Chrome or Edge because it relies on folder access.",
      true
    );
    return;
  }

  const export_button_label = export_sequence_button ? export_sequence_button.textContent : "";

  try {
    state.is_exporting = true;
    renderer.stopAnimation();

    if (export_sequence_button) {
      export_sequence_button.disabled = true;
      export_sequence_button.textContent = "Exporting...";
    }

    const frame_rate = Math.max(1, Math.round(config.export_settings.frame_rate || 24));
    const default_frame_count = Math.max(1, Math.floor(renderer.getPlaybackEndSec() * frame_rate) + 1);
    const frame_count_input = window.prompt(
      `How many frames should be exported at ${frame_rate} fps? 7200 frames is 5 minutes.`,
      String(default_frame_count)
    );
    if (frame_count_input === null) {
      return;
    }

    const frame_count = Math.max(1, Math.round(Number(frame_count_input)));
    if (!Number.isFinite(frame_count)) {
      throw new Error("Frame count must be a positive number.");
    }

    const output_selection = await get_sequence_output_directory_handle();
    if (!output_selection) {
      return;
    }

    for (let frame_index = 0; frame_index < frame_count; frame_index += 1) {
      const playback_time_sec = frame_index / frame_rate;
      renderer.renderPlaybackFrame(playback_time_sec);

      const blob = await renderer.canvasToBlob("image/png");
      const file_handle = await output_selection.directory_handle.getFileHandle(
        `frame-${String(frame_index + 1).padStart(4, "0")}.png`,
        { create: true }
      );
      await write_blob_file(file_handle, blob);

      if (
        frame_index === 0 ||
        frame_index === frame_count - 1 ||
        (frame_index + 1) % Math.max(1, Math.round(frame_rate * 0.5)) === 0
      ) {
        set_preset_meta(
          `Exporting PNG sequence: frame ${frame_index + 1}/${frame_count} at ${frame_rate} fps.`,
          false
        );
        await new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });
      }
    }

    set_preset_meta(
      `Exported ${frame_count} PNG frames at ${frame_rate} fps to ${output_selection.output_path_label}.`,
      false
    );
  } catch (error) {
    if (!is_abort_error(error)) {
      console.error(error);
      set_preset_meta(`PNG export failed: ${error.message}`, true);
    }
  } finally {
    state.is_exporting = false;
    if (export_sequence_button) {
      export_sequence_button.disabled = false;
      export_sequence_button.textContent = export_button_label || "Export PNG Seq";
    }
    renderer.startAnimation();
  }
}

function handle_stage_click() {
  renderer.startAnimation();
}

function attach_ui_events() {
  replay_button.addEventListener("click", () => {
    renderer.startAnimation();
  });

  export_sequence_button.addEventListener("click", () => {
    void export_png_sequence();
  });

  stage.addEventListener("click", handle_stage_click);

  if (!is_local_editor) {
    return;
  }

  drawer_toggle_button.addEventListener("click", () => {
    toggle_drawer();
  });

  drawer_backdrop.addEventListener("click", () => {
    set_drawer_open(false);
  });

  drawer_close_button.addEventListener("click", () => {
    set_drawer_open(false);
  });

  reset_button.addEventListener("click", () => {
    void reset_to_defaults();
  });

  set_defaults_button.addEventListener("click", () => {
    void write_current_as_source_default();
  });

  preset_save_button.addEventListener("click", () => {
    save_preset();
  });

  preset_delete_button.addEventListener("click", () => {
    delete_active_preset();
  });

  preset_export_button.addEventListener("click", () => {
    void export_current_preset();
  });

  preset_import_input.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    void import_presets_from_file(file)
      .catch((error) => {
        console.error(error);
        set_preset_meta(`Import failed: ${error.message}`, true);
      })
      .finally(() => {
        preset_import_input.value = "";
      });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.body.classList.contains("editor-docked")) {
      set_drawer_open(false);
    }
    if (
      (event.key === " " || event.key.toLowerCase() === "p") &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof HTMLTextAreaElement) &&
      !(event.target instanceof HTMLSelectElement) &&
      !(event.target instanceof HTMLElement && event.target.isContentEditable)
    ) {
      event.preventDefault();
      renderer.togglePause();
    }
  });
}

async function init() {
  if (is_local_editor) {
    state.export_directory_handle = await load_export_directory_handle();
    clear_legacy_browser_default_config();
    load_presets_from_storage();
    state.active_preset_id = null;
    state.selected_preset_id = state.presets[0]?.id || null;
    preset_name_input.value = get_next_preset_name();

    build_config_editor();
    render_output_profile_options();
    sync_editor_values();
    render_preset_tabs();
    update_editor_panel_mode();
  } else {
    drawer_toggle_button.hidden = true;
    drawer_backdrop.hidden = true;
    control_panel.hidden = true;
    set_defaults_button.hidden = true;
    reset_button.hidden = true;
  }

  attach_ui_events();
  renderer.setOutputProfile(get_current_output_profile_key());
  await renderer.refreshScene({ reload_mascot: true });
  if (is_local_editor) {
    set_preset_meta(
      "Presets are browser-stored test snapshots. The tracked source default lives in assets/app/default-config-source.js.",
      false
    );
  }

  window.addEventListener("resize", () => {
    update_editor_panel_mode();
    renderer.handleViewportResize();
  });

  const resize_observer = new ResizeObserver(() => {
    renderer.handleViewportResize();
  });

  resize_observer.observe(stage);
}

init().catch((error) => {
  console.error(error);
});
