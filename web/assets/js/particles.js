// Fondo 3D de IntegrIA: red de partículas que pasa de caos a esfera según el progreso p (0–4).
import * as THREE from '../vendor/three.module.min.js';

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

function dist2(arr, a, b) {
  const dx = arr[a * 3] - arr[b * 3], dy = arr[a * 3 + 1] - arr[b * 3 + 1], dz = arr[a * 3 + 2] - arr[b * 3 + 2];
  return dx * dx + dy * dy + dz * dz;
}

// Vecinos dentro de cada núcleo + puentes entre núcleos
function buildClusterLinks(B, cluster, K, N, rand) {
  const pairs = [], byCluster = Array.from({ length: K }, () => []);
  for (let i = 0; i < N; i++) byCluster[cluster[i]].push(i);
  byCluster.forEach((list) => {
    list.forEach((a, idx) => {
      if (idx % 2) return;
      const best = [];
      for (let s = 0; s < 24; s++) {
        const b = list[(rand() * list.length) | 0];
        if (b !== a) { const d = dist2(B, a, b); if (d < 0.5) best.push([d, b]); }
      }
      best.sort((x, z) => x[0] - z[0]);
      best.slice(0, 2).forEach((p) => pairs.push(a, p[1]));
    });
  });
  for (let k = 0; k < K; k++) {
    for (let s = 0; s < 5; s++) {
      const la = byCluster[k], lb = byCluster[(k + 1) % K], lc = byCluster[(k + 3) % K];
      pairs.push(la[(rand() * la.length) | 0], lb[(rand() * lb.length) | 0]);
      if (s < 2) pairs.push(la[(rand() * la.length) | 0], lc[(rand() * lc.length) | 0]);
    }
  }
  return pairs;
}

// Malla de la esfera: hasta 2 vecinos cercanos por punto
function buildSphereLinks(D, N) {
  const pairs = [], th = Math.pow(2.6 * Math.sqrt((4 * Math.PI) / N) * 1.25, 2);
  for (let i = 0; i < N; i++) {
    let found = 0;
    for (let j = i + 1; j < Math.min(N, i + 160) && found < 2; j++) {
      if (dist2(D, i, j) < th) { pairs.push(i, j); found++; }
    }
  }
  return pairs;
}

export function createField({ canvas, mobile, reduced }) {
  const rand = mulberry32(2026);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 9;
  const group = new THREE.Group();
  scene.add(group);

  const N = mobile ? 900 : 1800;
  const A = new Float32Array(N * 3), B = new Float32Array(N * 3), D = new Float32Array(N * 3);
  const cur = new Float32Array(N * 3), R = new Float32Array(N), S = new Float32Array(N);
  const cluster = new Int16Array(N);
  const K = 7, centers = [];
  for (let k = 0; k < K; k++) {
    const ang = (k / K) * Math.PI * 2 + rand() * 0.4, rad = 2.4 + rand() * 0.9;
    centers.push([Math.cos(ang) * rad * 1.25, Math.sin(ang) * rad * 0.8, (rand() - 0.5) * 2]);
  }
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const i3 = i * 3, c = i % K;
    cluster[i] = c;
    A[i3] = (rand() - 0.5) * 16; A[i3 + 1] = (rand() - 0.5) * 10; A[i3 + 2] = (rand() - 0.5) * 8;
    B[i3] = centers[c][0] + gauss() * 0.6; B[i3 + 1] = centers[c][1] + gauss() * 0.6; B[i3 + 2] = centers[c][2] + gauss() * 0.6;
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), t = i * golden;
    D[i3] = Math.cos(t) * r * 2.6; D[i3 + 1] = y * 2.6; D[i3 + 2] = Math.sin(t) * r * 2.6;
    R[i] = rand(); S[i] = 0.6 + rand() * 1.1;
    cur[i3] = A[i3]; cur[i3 + 1] = A[i3 + 1]; cur[i3 + 2] = A[i3 + 2];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
  geo.setAttribute('aR', new THREE.BufferAttribute(R, 1));
  geo.setAttribute('aS', new THREE.BufferAttribute(S, 1));
  // Colores en sRGB directo: el ShaderMaterial no aplica conversión de espacio de color
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uPulse: { value: 0 },
      uBlue: { value: new THREE.Vector3(30 / 255, 91 / 255, 1) }, uCyan: { value: new THREE.Vector3(0, 212 / 255, 1) },
    },
    vertexShader: `
      attribute float aR; attribute float aS;
      uniform float uTime; uniform float uPx; uniform float uPulse;
      varying float vR;
      void main() {
        vR = aR;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float pulse = 1.0 + uPulse * 0.6 * max(0.0, sin(uTime * 2.2 - aR * 12.0 - position.y * 1.4));
        gl_PointSize = 0.075 * aS * pulse * uPx * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uBlue; uniform vec3 uCyan; varying float vR;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 col = mix(uBlue, uCyan, smoothstep(0.35, 1.0, vR));
        gl_FragColor = vec4(col * 1.25, a * 0.9);
      }`,
  });
  group.add(new THREE.Points(geo, mat));

  function makeLines(pairs, color) {
    const g = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(new Float32Array(pairs.length * 3), 3);
    g.setAttribute('position', attr);
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const l = new THREE.LineSegments(g, m);
    group.add(l);
    return { l, m, g, pairs, arr: attr.array, attr };
  }
  const L1 = makeLines(buildClusterLinks(B, cluster, K, N, rand), 0x3d74ff);
  const L2 = makeLines(buildSphereLinks(D, N), 0x00d4ff);
  function sync(L) {
    for (let n = 0; n < L.pairs.length; n++) {
      const s = L.pairs[n] * 3, t = n * 3;
      L.arr[t] = cur[s]; L.arr[t + 1] = cur[s + 1]; L.arr[t + 2] = cur[s + 2];
    }
    L.attr.needsUpdate = true;
  }

  let rotY = 0, rotX = 0, posX = 0;
  function render(time, p, mouse) {
    const t = reduced ? 0 : time * 0.001, e1 = ease(p), e3 = ease(p - 2), drift = (1 - e1) * 0.28 + 0.03;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      let bx, by, bz;
      if (p < 1) { bx = A[i3] + (B[i3] - A[i3]) * e1; by = A[i3 + 1] + (B[i3 + 1] - A[i3 + 1]) * e1; bz = A[i3 + 2] + (B[i3 + 2] - A[i3 + 2]) * e1; }
      else if (p < 2) { bx = B[i3]; by = B[i3 + 1]; bz = B[i3 + 2]; }
      else { bx = B[i3] + (D[i3] - B[i3]) * e3; by = B[i3 + 1] + (D[i3 + 1] - B[i3 + 1]) * e3; bz = B[i3 + 2] + (D[i3 + 2] - B[i3 + 2]) * e3; }
      const ph = R[i] * 40;
      cur[i3] = bx + Math.sin(t * 0.5 + ph) * drift;
      cur[i3 + 1] = by + Math.cos(t * 0.4 + ph * 1.3) * drift;
      cur[i3 + 2] = bz + Math.sin(t * 0.3 + ph * 0.7) * drift;
    }
    geo.attributes.position.needsUpdate = true;

    const o1 = ease((p - 1.25) / 0.6) * (1 - ease((p - 2.3) / 0.5));
    const o2 = ease((p - 2.6) / 0.6);
    L1.m.opacity = o1 * 0.28; L1.l.visible = o1 > 0.01; if (L1.l.visible) sync(L1);
    L2.m.opacity = o2 * 0.22; L2.l.visible = o2 > 0.01; if (L2.l.visible) sync(L2);

    mat.uniforms.uTime.value = t;
    mat.uniforms.uPulse.value = ease(p - 3);
    rotY += reduced ? 0 : 0.0006 + ease(p - 2.4) * 0.0035;
    rotX += (mouse.ny * 0.25 - rotX) * 0.04;
    posX += ((mobile ? 0 : 2.7 * ease(p * 1.2)) - posX) * 0.05;
    group.position.x = posX;
    group.rotation.set(rotX, rotY + mouse.nx * 0.3 * (1 - e3 * 0.5), 0);
    renderer.render(scene, camera);
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }

  return { render, resize };
}
