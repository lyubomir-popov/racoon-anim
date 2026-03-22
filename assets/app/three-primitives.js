import * as THREE from "../../three/build/three.module.js";

const SHARED_QUAD_GEOMETRY = new THREE.PlaneGeometry(1, 1);

function create_instanced_quad_geometry() {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = SHARED_QUAD_GEOMETRY.index;
  geometry.setAttribute("position", SHARED_QUAD_GEOMETRY.getAttribute("position"));
  geometry.setAttribute("uv", SHARED_QUAD_GEOMETRY.getAttribute("uv"));
  return geometry;
}

function create_shader_material({
  color_hex,
  vertex_shader,
  fragment_shader
}) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      u_color: { value: new THREE.Color(color_hex) }
    },
    vertexShader: vertex_shader,
    fragmentShader: fragment_shader
  });
  material.toneMapped = false;
  return material;
}

export function createCircleLayer(capacity, color_hex, render_order = 0) {
  const geometry = create_instanced_quad_geometry();
  const centers = new Float32Array(capacity * 2);
  const sizes = new Float32Array(capacity * 2);
  const alphas = new Float32Array(capacity);

  const center_attribute = new THREE.InstancedBufferAttribute(centers, 2);
  const size_attribute = new THREE.InstancedBufferAttribute(sizes, 2);
  const alpha_attribute = new THREE.InstancedBufferAttribute(alphas, 1);

  center_attribute.setUsage(THREE.DynamicDrawUsage);
  size_attribute.setUsage(THREE.DynamicDrawUsage);
  alpha_attribute.setUsage(THREE.DynamicDrawUsage);

  geometry.setAttribute("instance_center", center_attribute);
  geometry.setAttribute("instance_size", size_attribute);
  geometry.setAttribute("instance_alpha", alpha_attribute);
  geometry.instanceCount = 0;

  const material = create_shader_material({
    color_hex,
    vertex_shader: `
      attribute vec2 instance_center;
      attribute vec2 instance_size;
      attribute float instance_alpha;

      varying vec2 v_uv;
      varying float v_alpha;

      void main() {
        vec2 world_position = instance_center + position.xy * instance_size;
        v_uv = uv;
        v_alpha = instance_alpha;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(world_position, 0.0, 1.0);
      }
    `,
    fragment_shader: `
      uniform vec3 u_color;

      varying vec2 v_uv;
      varying float v_alpha;

      void main() {
        vec2 centered_uv = v_uv * 2.0 - 1.0;
        float distance_from_center = length(centered_uv);
        float edge = fwidth(distance_from_center);
        float mask = 1.0 - smoothstep(1.0 - edge, 1.0 + edge, distance_from_center);
        float alpha = v_alpha * mask;

        if (alpha <= 0.001) {
          discard;
        }

        gl_FragColor = vec4(u_color, alpha);
      }
    `
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = render_order;

  let count = 0;

  function clear() {
    count = 0;
    geometry.instanceCount = 0;
  }

  function push(center_x, center_y, width_px, height_px, alpha) {
    if (count >= capacity || alpha <= 0 || width_px <= 0 || height_px <= 0) {
      return;
    }

    const center_index = count * 2;
    centers[center_index] = center_x;
    centers[center_index + 1] = center_y;
    sizes[center_index] = width_px;
    sizes[center_index + 1] = height_px;
    alphas[count] = alpha;
    count += 1;
  }

  function finalize() {
    geometry.instanceCount = count;
    center_attribute.needsUpdate = true;
    size_attribute.needsUpdate = true;
    alpha_attribute.needsUpdate = true;
  }

  function set_color(color_value) {
    material.uniforms.u_color.value.set(color_value);
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
  }

  return {
    mesh,
    clear,
    push,
    finalize,
    setColor: set_color,
    dispose,
    get capacity() {
      return capacity;
    }
  };
}

export function createSegmentLayer(capacity, color_hex, render_order = 0) {
  const geometry = create_instanced_quad_geometry();
  const starts = new Float32Array(capacity * 2);
  const ends = new Float32Array(capacity * 2);
  const widths = new Float32Array(capacity);
  const alphas = new Float32Array(capacity);

  const start_attribute = new THREE.InstancedBufferAttribute(starts, 2);
  const end_attribute = new THREE.InstancedBufferAttribute(ends, 2);
  const width_attribute = new THREE.InstancedBufferAttribute(widths, 1);
  const alpha_attribute = new THREE.InstancedBufferAttribute(alphas, 1);

  start_attribute.setUsage(THREE.DynamicDrawUsage);
  end_attribute.setUsage(THREE.DynamicDrawUsage);
  width_attribute.setUsage(THREE.DynamicDrawUsage);
  alpha_attribute.setUsage(THREE.DynamicDrawUsage);

  geometry.setAttribute("instance_start", start_attribute);
  geometry.setAttribute("instance_end", end_attribute);
  geometry.setAttribute("instance_width", width_attribute);
  geometry.setAttribute("instance_alpha", alpha_attribute);
  geometry.instanceCount = 0;

  const material = create_shader_material({
    color_hex,
    vertex_shader: `
      attribute vec2 instance_start;
      attribute vec2 instance_end;
      attribute float instance_width;
      attribute float instance_alpha;

      varying float v_alpha;

      void main() {
        vec2 segment = instance_end - instance_start;
        float segment_length = max(length(segment), 0.0001);
        vec2 segment_normal = vec2(-segment.y, segment.x) / segment_length;
        vec2 center = (instance_start + instance_end) * 0.5;
        vec2 world_position =
          center +
          segment * position.x +
          segment_normal * position.y * instance_width;

        v_alpha = instance_alpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(world_position, 0.0, 1.0);
      }
    `,
    fragment_shader: `
      uniform vec3 u_color;

      varying float v_alpha;

      void main() {
        if (v_alpha <= 0.001) {
          discard;
        }

        gl_FragColor = vec4(u_color, v_alpha);
      }
    `
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = render_order;

  let count = 0;

  function clear() {
    count = 0;
    geometry.instanceCount = 0;
  }

  function push(start_x, start_y, end_x, end_y, width_px, alpha) {
    if (count >= capacity || alpha <= 0 || width_px <= 0) {
      return;
    }

    const vector_index = count * 2;
    starts[vector_index] = start_x;
    starts[vector_index + 1] = start_y;
    ends[vector_index] = end_x;
    ends[vector_index + 1] = end_y;
    widths[count] = width_px;
    alphas[count] = alpha;
    count += 1;
  }

  function finalize() {
    geometry.instanceCount = count;
    start_attribute.needsUpdate = true;
    end_attribute.needsUpdate = true;
    width_attribute.needsUpdate = true;
    alpha_attribute.needsUpdate = true;
  }

  function set_color(color_value) {
    material.uniforms.u_color.value.set(color_value);
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
  }

  return {
    mesh,
    clear,
    push,
    finalize,
    setColor: set_color,
    dispose,
    get capacity() {
      return capacity;
    }
  };
}
