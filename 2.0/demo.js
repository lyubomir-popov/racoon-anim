const TAU = Math.PI * 2;
const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;
const CENTER_X = WORLD_WIDTH * 0.5;
const CENTER_Y = WORLD_HEIGHT * 0.5;
const SOURCE_SPOKES = 60;
const INNER_DISK_RADIUS = 148;
const SPOKE_START_RADIUS = 178;
const HALO_OUTER_RADIUS = 332;
const FULL_FRAME_OUTER_RADIUS = 620;
const DOT_COUNT = 24;
const PIN_LABEL_ANGLE = 0;
const COLOR_BG = "#242424";
const COLOR_RING = "#1b1b1b";
const COLOR_CONSTRUCTION = "#373737";
const COLOR_VISIBLE = "#f5f2ea";
const COLOR_THIN = "#dfdbd2";
const COLOR_GLASS = "#8a8477";
const COLOR_MUTED = "#b9b2a3";
const CONSTRUCTION_WIDTH = 1;
const THIN_WIDTH = 1.5;
const THICK_WIDTH = 8;
const ECHO_WIDTH_MULT = 0.88;
const ECHO_WAVE_COUNT = 4;
const ECHO_OPACITY_MULT = 0.68;
const GLASS_MIN_SCALE = 0.2;

const stage_canvas = document.querySelector("[data-stage-canvas]");
const strip_canvas = document.querySelector("[data-strip-canvas]");
const stage_context = stage_canvas.getContext("2d");
const strip_context = strip_canvas.getContext("2d");

const controls = {
  animate: document.querySelector("[data-animate]"),
  cycle_sec: document.querySelector("[data-cycle-sec]"),
  cycle_sec_output: document.querySelector("[data-cycle-sec-output]"),
  min_visible: document.querySelector("[data-min-visible]"),
  min_visible_output: document.querySelector("[data-min-visible-output]"),
  manual_visible: document.querySelector("[data-manual-visible]"),
  manual_visible_output: document.querySelector("[data-manual-visible-output]"),
  glass_gamma: document.querySelector("[data-glass-gamma]"),
  glass_gamma_output: document.querySelector("[data-glass-gamma-output]"),
  show_glass: document.querySelector("[data-show-glass]"),
  show_strip: document.querySelector("[data-show-strip]"),
  source_spokes: document.querySelector("[data-source-spokes]"),
  visible_spokes: document.querySelector("[data-visible-spokes]"),
  total_turns: document.querySelector("[data-total-turns]")
};

const state = {
  animate: true,
  cycle_sec: 30,
  min_visible_spokes: 24,
  manual_visible_spokes: 24,
  glass_gamma: 1.4,
  show_glass: true,
  show_strip: true,
  started_at_ms: performance.now()
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function format_number(value, fraction_digits = 1) {
  return Number(value).toFixed(fraction_digits);
}

function polar_to_cartesian(angle_rad, radius_px) {
  return {
    x: CENTER_X + Math.cos(angle_rad) * radius_px,
    y: CENTER_Y - Math.sin(angle_rad) * radius_px
  };
}

function set_canvas_resolution(canvas, context, css_width, css_height) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width_px = Math.max(1, Math.round(css_width * dpr));
  const height_px = Math.max(1, Math.round(css_height * dpr));

  if (canvas.width !== width_px || canvas.height !== height_px) {
    canvas.width = width_px;
    canvas.height = height_px;
  }

  context.setTransform(width_px / WORLD_WIDTH, 0, 0, height_px / WORLD_HEIGHT, 0, 0);
}

function read_controls() {
  state.animate = controls.animate.checked;
  state.cycle_sec = Number(controls.cycle_sec.value);
  state.min_visible_spokes = Number(controls.min_visible.value);
  state.manual_visible_spokes = Number(controls.manual_visible.value);
  state.glass_gamma = Number(controls.glass_gamma.value);
  state.show_glass = controls.show_glass.checked;
  state.show_strip = controls.show_strip.checked;

  controls.cycle_sec_output.value = `${state.cycle_sec}s`;
  controls.min_visible_output.value = String(state.min_visible_spokes);
  controls.manual_visible_output.value = format_number(state.manual_visible_spokes, 1);
  controls.glass_gamma_output.value = format_number(state.glass_gamma, 2);
  controls.source_spokes.textContent = String(SOURCE_SPOKES);
}

function get_visible_spoke_count(now_ms) {
  if (!state.animate) {
    return clamp(state.manual_visible_spokes, 1, SOURCE_SPOKES);
  }

  const elapsed_sec = (now_ms - state.started_at_ms) * 0.001;
  const pulse_u = 0.5 + 0.5 * Math.cos(TAU * elapsed_sec / Math.max(0.0001, state.cycle_sec));
  return lerp(state.min_visible_spokes, SOURCE_SPOKES, pulse_u);
}

function sample_glass_field(angle_u) {
  const wrapped_u = angle_u - Math.floor(angle_u);
  const seam_threshold = 1 / (SOURCE_SPOKES * 3);
  if (wrapped_u < seam_threshold || wrapped_u > 1 - seam_threshold) {
    return {
      phase_name: "lower",
      phase_progress: 1,
      width_scale: 1,
      length_scale: 1
    };
  }

  const in_upper_phase = wrapped_u < 0.5;
  const phase_progress = in_upper_phase
    ? wrapped_u / 0.5
    : (wrapped_u - 0.5) / 0.5;
  const eased_progress = Math.pow(clamp(phase_progress, 0, 1), state.glass_gamma);

  return {
    phase_name: in_upper_phase ? "upper" : "lower",
    phase_progress,
    width_scale: lerp(GLASS_MIN_SCALE, 1, eased_progress),
    length_scale: lerp(GLASS_MIN_SCALE, 1, eased_progress)
  };
}

function build_projection(visible_spokes) {
  const total_turns = SOURCE_SPOKES / Math.max(1, visible_spokes);
  const front_turn_fraction = 1 / total_turns;
  const spokes = [];

  for (let index = 0; index < SOURCE_SPOKES; index += 1) {
    const strip_u = index / SOURCE_SPOKES;
    const wrapped_turn_position = strip_u * total_turns;
    const is_front_turn = wrapped_turn_position < 1;
    const display_u = wrapped_turn_position - Math.floor(wrapped_turn_position);
    const display_angle_rad = display_u * TAU;
    const glass = sample_glass_field(display_u);

    spokes.push({
      index,
      strip_u,
      wrapped_turn_position,
      is_front_turn,
      display_u,
      display_angle_rad,
      glass
    });
  }

  return {
    total_turns,
    front_turn_fraction,
    visible_spokes,
    spokes
  };
}

function draw_arc_segment(context, start_angle, end_angle, color, width, alpha) {
  context.save();
  context.beginPath();
  context.arc(CENTER_X, CENTER_Y, INNER_DISK_RADIUS + 22, -start_angle, -end_angle, true);
  context.strokeStyle = color;
  context.lineWidth = width;
  context.globalAlpha = alpha;
  context.stroke();
  context.restore();
}

function draw_glass_overlay() {
  for (let step = 0; step < 120; step += 1) {
    const start_u = step / 120;
    const end_u = (step + 1) / 120;
    const glass = sample_glass_field((start_u + end_u) * 0.5);
    const alpha = lerp(0.08, 0.3, glass.width_scale);
    draw_arc_segment(stage_context, start_u * TAU, end_u * TAU, COLOR_GLASS, 14, alpha);
  }
}

function draw_clock_labels() {
  const labels = [
    { text: "3PM seam", angle: 0, radius: FULL_FRAME_OUTER_RADIUS + 72 },
    { text: "12PM", angle: TAU * 0.25, radius: FULL_FRAME_OUTER_RADIUS + 56 },
    { text: "9AM", angle: TAU * 0.5, radius: FULL_FRAME_OUTER_RADIUS + 56 },
    { text: "6PM", angle: TAU * 0.75, radius: FULL_FRAME_OUTER_RADIUS + 56 }
  ];

  stage_context.save();
  stage_context.fillStyle = COLOR_MUTED;
  stage_context.font = "28px 'Segoe UI', sans-serif";
  stage_context.textAlign = "center";
  stage_context.textBaseline = "middle";

  for (const label of labels) {
    const point = polar_to_cartesian(label.angle, label.radius);
    stage_context.fillText(label.text, point.x, point.y);
  }

  stage_context.restore();
}

function draw_construction_spokes() {
  stage_context.save();
  stage_context.strokeStyle = COLOR_CONSTRUCTION;
  stage_context.lineWidth = CONSTRUCTION_WIDTH;
  stage_context.globalAlpha = 1;
  stage_context.lineCap = "butt";

  stage_context.restore();
}

function draw_center_disk() {
  stage_context.save();
  stage_context.beginPath();
  stage_context.arc(CENTER_X, CENTER_Y, INNER_DISK_RADIUS, 0, TAU);
  stage_context.fillStyle = COLOR_RING;
  stage_context.fill();

  stage_context.beginPath();
  stage_context.arc(CENTER_X, CENTER_Y, INNER_DISK_RADIUS - 10, 0, TAU);
  stage_context.strokeStyle = "#2f2f2f";
  stage_context.lineWidth = 3;
  stage_context.stroke();

  stage_context.fillStyle = COLOR_MUTED;
  stage_context.font = "700 34px 'Segoe UI', sans-serif";
  stage_context.textAlign = "center";
  stage_context.textBaseline = "middle";
  stage_context.fillText("2.0", CENTER_X, CENTER_Y - 14);
  stage_context.font = "22px 'Segoe UI', sans-serif";
  stage_context.fillText("wrapped strip + fixed glass", CENTER_X, CENTER_Y + 24);
  stage_context.restore();
}

function draw_visible_spoke(spoke) {
  const length_scale = spoke.glass.length_scale;
  const width_scale = spoke.glass.width_scale;
  const construction_end_radius = FULL_FRAME_OUTER_RADIUS + 110;
  const thick_end_radius = lerp(SPOKE_START_RADIUS + 44, HALO_OUTER_RADIUS, length_scale);
  const dot_start_radius = HALO_OUTER_RADIUS + 14;
  const line_start = polar_to_cartesian(spoke.display_angle_rad, SPOKE_START_RADIUS);
  const line_end = polar_to_cartesian(spoke.display_angle_rad, thick_end_radius);
  const thin_end = polar_to_cartesian(spoke.display_angle_rad, HALO_OUTER_RADIUS);
  const construction_end = polar_to_cartesian(spoke.display_angle_rad, construction_end_radius);
  const ripple_fade_start = lerp(0.2, 0.85, ECHO_OPACITY_MULT);

  stage_context.save();
  stage_context.lineCap = "butt";
  stage_context.strokeStyle = COLOR_CONSTRUCTION;
  stage_context.globalAlpha = 1;
  stage_context.lineWidth = CONSTRUCTION_WIDTH;
  stage_context.beginPath();
  stage_context.moveTo(line_start.x, line_start.y);
  stage_context.lineTo(construction_end.x, construction_end.y);
  stage_context.stroke();

  stage_context.strokeStyle = COLOR_THIN;
  stage_context.lineWidth = THIN_WIDTH;
  stage_context.beginPath();
  stage_context.moveTo(line_start.x, line_start.y);
  stage_context.lineTo(thin_end.x, thin_end.y);
  stage_context.stroke();

  stage_context.globalAlpha = 1;
  stage_context.strokeStyle = COLOR_VISIBLE;
  stage_context.lineWidth = THICK_WIDTH * width_scale;
  stage_context.beginPath();
  stage_context.moveTo(line_start.x, line_start.y);
  stage_context.lineTo(line_end.x, line_end.y);
  stage_context.stroke();

  for (let dot_index = 0; dot_index < DOT_COUNT; dot_index += 1) {
    const orbit_u = dot_index / Math.max(1, DOT_COUNT - 1);
    const dot_radius = lerp(dot_start_radius, FULL_FRAME_OUTER_RADIUS, orbit_u);
    const point = polar_to_cartesian(spoke.display_angle_rad, dot_radius);
    const ripple_phase = orbit_u * ECHO_WAVE_COUNT * TAU;
    const ripple_scale = lerp(0.45, 1.55, 0.5 + 0.5 * Math.cos(ripple_phase));
    const echo_index = Math.max(1, Math.ceil((dot_radius - HALO_OUTER_RADIUS) / 32));
    const size =
      lerp(4.6, 1.15, orbit_u) *
      Math.min(1, Math.pow(ECHO_WIDTH_MULT, echo_index) * ripple_scale) *
      lerp(0.55, 1.25, width_scale);
    const alpha = 1 - clamp((orbit_u - ripple_fade_start) / Math.max(0.0001, 1 - ripple_fade_start), 0, 1);
    if (size <= 0.4 || alpha <= 0) {
      continue;
    }
    stage_context.beginPath();
    stage_context.arc(point.x, point.y, size, 0, TAU);
    stage_context.fillStyle = COLOR_VISIBLE;
    stage_context.globalAlpha = alpha;
    stage_context.fill();
  }

  stage_context.restore();
}

function draw_pin_marker() {
  const outer = polar_to_cartesian(PIN_LABEL_ANGLE, OUTER_RADIUS + 16);
  const inner = polar_to_cartesian(PIN_LABEL_ANGLE, SPOKE_START_RADIUS - 24);

  stage_context.save();
  stage_context.strokeStyle = COLOR_VISIBLE;
  stage_context.lineWidth = 3;
  stage_context.beginPath();
  stage_context.moveTo(inner.x, inner.y);
  stage_context.lineTo(outer.x, outer.y);
  stage_context.stroke();
  stage_context.restore();
}

function render_stage(projection) {
  const rect = stage_canvas.getBoundingClientRect();
  set_canvas_resolution(stage_canvas, stage_context, rect.width, rect.height);

  stage_context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  stage_context.fillStyle = COLOR_BG;
  stage_context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  if (state.show_glass) {
    draw_glass_overlay();
  }

  draw_construction_spokes();

  for (const spoke of projection.spokes) {
    if (!spoke.is_front_turn) {
      continue;
    }

    draw_visible_spoke(spoke);
  }

  draw_pin_marker();
  draw_center_disk();
  draw_clock_labels();
}

function draw_strip_spoke(context, x, y, height, color, alpha) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.globalAlpha = alpha;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x, y + height);
  context.stroke();
  context.restore();
}

function render_strip(projection) {
  const strip_visible = state.show_strip;
  strip_canvas.parentElement.style.display = strip_visible ? "block" : "none";
  if (!strip_visible) {
    return;
  }

  const rect = strip_canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  strip_canvas.width = Math.max(1, Math.round(rect.width * dpr));
  strip_canvas.height = Math.max(1, Math.round(rect.height * dpr));
  strip_context.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const padding_x = 28;
  const baseline_y = 42;
  const strip_width = width - padding_x * 2;
  const visible_cutoff_x = padding_x + strip_width * projection.front_turn_fraction;

  strip_context.clearRect(0, 0, width, height);
  strip_context.fillStyle = "#202020";
  strip_context.fillRect(0, 0, width, height);

  strip_context.fillStyle = "#2a2a2a";
  strip_context.fillRect(padding_x, baseline_y, strip_width, 34);
  strip_context.fillStyle = "rgba(245, 242, 234, 0.08)";
  strip_context.fillRect(padding_x, baseline_y, strip_width * projection.front_turn_fraction, 34);

  strip_context.strokeStyle = COLOR_GLASS;
  strip_context.lineWidth = 2;
  strip_context.beginPath();
  strip_context.moveTo(visible_cutoff_x, baseline_y - 12);
  strip_context.lineTo(visible_cutoff_x, baseline_y + 46);
  strip_context.stroke();

  strip_context.fillStyle = COLOR_MUTED;
  strip_context.font = "13px 'Segoe UI', sans-serif";
  strip_context.fillText("pin / seam", padding_x - 2, baseline_y - 14);
  strip_context.fillText("front-turn cutoff", visible_cutoff_x + 8, baseline_y - 14);

  for (const spoke of projection.spokes) {
    const x = padding_x + strip_width * spoke.strip_u;
    draw_strip_spoke(
      strip_context,
      x,
      baseline_y,
      34,
      spoke.is_front_turn ? COLOR_VISIBLE : COLOR_CONSTRUCTION,
      spoke.is_front_turn ? 1 : 0.55
    );
  }

  const projection_y = 112;
  strip_context.fillStyle = COLOR_MUTED;
  strip_context.fillText("visible circular projection", padding_x, projection_y - 16);
  strip_context.fillStyle = "#2a2a2a";
  strip_context.fillRect(padding_x, projection_y, strip_width, 20);

  for (const spoke of projection.spokes) {
    if (!spoke.is_front_turn) {
      continue;
    }

    const x = padding_x + strip_width * spoke.display_u;
    draw_strip_spoke(strip_context, x, projection_y, 20, COLOR_VISIBLE, 1);
  }
}

function update_metrics(projection) {
  controls.visible_spokes.textContent = format_number(projection.visible_spokes, 1);
  controls.total_turns.textContent = format_number(projection.total_turns, 2);
}

function frame(now_ms) {
  read_controls();

  const visible_spokes = get_visible_spoke_count(now_ms);
  const projection = build_projection(visible_spokes);

  update_metrics(projection);
  render_stage(projection);
  render_strip(projection);

  requestAnimationFrame(frame);
}

function bind_controls() {
  const sync = () => {
    read_controls();
  };

  for (const control of [
    controls.animate,
    controls.cycle_sec,
    controls.min_visible,
    controls.manual_visible,
    controls.glass_gamma,
    controls.show_glass,
    controls.show_strip
  ]) {
    control.addEventListener("input", sync);
    control.addEventListener("change", sync);
  }

  window.addEventListener("resize", () => {
    render_stage(build_projection(get_visible_spoke_count(performance.now())));
    render_strip(build_projection(get_visible_spoke_count(performance.now())));
  });
}

bind_controls();
read_controls();
requestAnimationFrame(frame);
