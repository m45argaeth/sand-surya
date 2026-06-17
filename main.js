import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---------------------------------------------------------------------------
// Planet data (sizes & distances are visualisation-scaled, not to real scale;
// the factual numbers are shown in the info card).
// ---------------------------------------------------------------------------
const PLANETS = [
  { name: 'Mercury', size: 0.42, dist: 9,  speed: 4.74, spin: 0.02, color: 0x9c8a7b, tilt: 0.001,
    facts: { dia: '4.879 km', dist: '57,9 jt km', period: '88 hari', day: '1.408 jam', moons: '0' } },
  { name: 'Venus',   size: 0.78, dist: 12.5, speed: 3.50, spin: -0.008, color: 0xe6c179, tilt: 3.1,
    facts: { dia: '12.104 km', dist: '108,2 jt km', period: '225 hari', day: '5.832 jam', moons: '0' } },
  { name: 'Earth',   size: 0.85, dist: 16.5, speed: 2.98, spin: 0.05, color: 0x3f7bd6, tilt: 0.41, moon: true,
    facts: { dia: '12.742 km', dist: '149,6 jt km', period: '365 hari', day: '24 jam', moons: '1' } },
  { name: 'Mars',    size: 0.55, dist: 21, speed: 2.41, spin: 0.048, color: 0xc1502e, tilt: 0.44,
    facts: { dia: '6.779 km', dist: '227,9 jt km', period: '687 hari', day: '24,6 jam', moons: '2' } },
  { name: 'Jupiter', size: 3.4, dist: 33, speed: 1.31, spin: 0.12, color: 0xd8b48c, tilt: 0.05, bands: true,
    facts: { dia: '139.820 km', dist: '778,5 jt km', period: '11,9 tahun', day: '9,9 jam', moons: '95' } },
  { name: 'Saturn',  size: 2.9, dist: 45, speed: 0.97, spin: 0.10, color: 0xe3d2a0, tilt: 0.47, bands: true, ring: true,
    facts: { dia: '116.460 km', dist: '1,43 mlr km', period: '29,5 tahun', day: '10,7 jam', moons: '146' } },
  { name: 'Uranus',  size: 1.7, dist: 55, speed: 0.68, spin: -0.06, color: 0x9fe3e6, tilt: 1.71, ring: true,
    facts: { dia: '50.724 km', dist: '2,87 mlr km', period: '84 tahun', day: '17,2 jam', moons: '28' } },
  { name: 'Neptune', size: 1.65, dist: 64, speed: 0.54, spin: 0.065, color: 0x3b54d6, tilt: 0.49,
    facts: { dia: '49.244 km', dist: '4,5 mlr km', period: '165 tahun', day: '16,1 jam', moons: '16' } },
];

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 5000);
camera.position.set(0, 38, 78);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'fixed';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3;
controls.maxDistance = 600;
controls.rotateSpeed = 0.6;

// ---------------------------------------------------------------------------
// Lighting
// ---------------------------------------------------------------------------
scene.add(new THREE.AmbientLight(0x33405f, 0.55));
const sunLight = new THREE.PointLight(0xfff0d0, 4.2, 0, 0.6);
scene.add(sunLight);

// ---------------------------------------------------------------------------
// Procedural texture helpers (no external assets → works offline & on Pages)
// ---------------------------------------------------------------------------
function lighten(hex, amt) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return c;
}
function makePlanetTexture(baseHex, opts = {}) {
  const w = 512, h = 256;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const base = new THREE.Color(baseHex);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, w, h);

  if (opts.bands) {
    // horizontal gas-giant bands
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const wobble = Math.sin(t * Math.PI * (opts.bandCount || 14)) * 0.5 + 0.5;
      const c = base.clone().offsetHSL(0, (Math.random() - 0.5) * 0.02, (wobble - 0.5) * 0.22);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(0, y, w, 1);
    }
    // turbulent swirls
    for (let i = 0; i < 240; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = Math.random() * 16 + 3;
      const c = base.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.18);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    // mottled rocky / icy surface
    const blobs = opts.blobs || 1400;
    for (let i = 0; i < blobs; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = Math.random() * 6 + 1;
      const c = base.clone().offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.28);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (opts.continents) {
    // greenish land masses for Earth
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w, y = h * 0.2 + Math.random() * h * 0.6;
      const r = Math.random() * 30 + 8;
      ctx.globalAlpha = 0.55;
      const land = Math.random() > 0.4 ? '#3f7a3a' : '#6e8b3d';
      ctx.fillStyle = land;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill();
    }
    // ice caps
    ctx.globalAlpha = 0.85; ctx.fillStyle = '#eef4ff';
    ctx.fillRect(0, 0, w, 12); ctx.fillRect(0, h - 12, w, 12);
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function makeRingTexture(baseHex) {
  const w = 512, h = 64;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const base = new THREE.Color(baseHex);
  for (let x = 0; x < w; x++) {
    const n = Math.sin(x * 0.18) * 0.5 + Math.random() * 0.4;
    const l = 0.35 + n * 0.4;
    const a = 0.35 + Math.abs(Math.sin(x * 0.07)) * 0.6;
    const c = base.clone().offsetHSL(0, 0, (l - 0.5) * 0.4);
    ctx.globalAlpha = a;
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.fillRect(x, 0, 1, h);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Starfield background
// ---------------------------------------------------------------------------
function buildStars(count, radius) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.6 + Math.random() * 0.4);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.cos(phi);
    pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    const tint = 0.7 + Math.random() * 0.3;
    const warm = Math.random();
    col[i*3]   = tint;
    col[i*3+1] = tint * (0.85 + warm * 0.15);
    col[i*3+2] = tint * (0.85 + (1 - warm) * 0.15);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.9, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.9 });
  return new THREE.Points(geo, mat);
}
const stars = buildStars(6000, 900);
scene.add(stars);

// ---------------------------------------------------------------------------
// Sun
// ---------------------------------------------------------------------------
const SUN_RADIUS = 4.2;
const sunGeo = new THREE.SphereGeometry(SUN_RADIUS, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({ map: makePlanetTexture(0xff8a1e, { bands: true, bandCount: 26 }), color: 0xffdd99 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// glow sprite
function makeGlow() {
  const size = 256;
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0, 'rgba(255,225,160,0.95)');
  g.addColorStop(0.25, 'rgba(255,170,70,0.55)');
  g.addColorStop(0.55, 'rgba(255,120,40,0.18)');
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(SUN_RADIUS * 6, SUN_RADIUS * 6, 1);
  return sp;
}
sun.add(makeGlow());

const sunLabel = makeLabel('Matahari', 'label sun');
sunLabel.position.set(0, SUN_RADIUS + 1.5, 0);
sun.add(sunLabel);

// ---------------------------------------------------------------------------
// Planets
// ---------------------------------------------------------------------------
function makeLabel(text, cls) {
  const el = document.createElement('div');
  el.className = cls || 'label';
  el.textContent = text;
  return new CSS2DObject(el);
}

const planetObjs = [];
const orbitLines = [];
const clickable = [];

PLANETS.forEach((p, i) => {
  const pivot = new THREE.Object3D();   // rotates around the sun
  scene.add(pivot);

  const isEarth = p.name === 'Earth';
  const tex = makePlanetTexture(p.color, { bands: p.bands, continents: isEarth });
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: p.bands ? 0.85 : 0.95,
    metalness: 0.0,
  });
  const geo = new THREE.SphereGeometry(p.size, 48, 48);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.x = p.dist;
  mesh.rotation.z = p.tilt || 0;
  mesh.userData.index = i;
  pivot.add(mesh);
  clickable.push(mesh);

  // rings
  if (p.ring) {
    const rOuter = p.size * (p.name === 'Saturn' ? 2.2 : 1.8);
    const rInner = p.size * 1.25;
    const ringGeo = new THREE.RingGeometry(rInner, rOuter, 96);
    // fix UVs so texture maps radially
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    const v3 = new THREE.Vector3();
    for (let k = 0; k < pos.count; k++) {
      v3.fromBufferAttribute(pos, k);
      const r = v3.length();
      uv.setXY(k, (r - rInner) / (rOuter - rInner), 0.5);
    }
    const ringMat = new THREE.MeshBasicMaterial({
      map: makeRingTexture(p.color), side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 - 0.3;
    mesh.add(ring);
  }

  // Earth's moon
  let moonPivot = null;
  if (p.moon) {
    moonPivot = new THREE.Object3D();
    mesh.add(moonPivot);
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(p.size * 0.27, 24, 24),
      new THREE.MeshStandardMaterial({ map: makePlanetTexture(0xb9b9bd, { blobs: 500 }), roughness: 1 })
    );
    moon.position.x = p.size + 1.1;
    moonPivot.add(moon);
  }

  // label
  const label = makeLabel(p.name, 'label');
  label.position.y = p.size + 0.9;
  mesh.add(label);

  // orbit line
  const orbitGeo = new THREE.BufferGeometry();
  const seg = 256; const pts = [];
  for (let s = 0; s <= seg; s++) {
    const a = (s / seg) * Math.PI * 2;
    pts.push(Math.cos(a) * p.dist, 0, Math.sin(a) * p.dist);
  }
  orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x4a5a85, transparent: true, opacity: 0.4 });
  const orbit = new THREE.LineLoop(orbitGeo, orbitMat);
  scene.add(orbit);
  orbitLines.push(orbit);

  pivot.rotation.y = Math.random() * Math.PI * 2;
  planetObjs.push({ pivot, mesh, moonPivot, label, data: p });
});

// ---------------------------------------------------------------------------
// Post-processing (bloom)
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.7, 0.55, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
let bloomEnabled = true;

// ---------------------------------------------------------------------------
// Interaction state
// ---------------------------------------------------------------------------
let playing = true;
let speedMul = 1.0;
let focusIndex = -1;
const clock = new THREE.Clock();

// Picking
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downXY = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downXY) return;
  const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
  downXY = null;
  if (moved > 6) return; // was a drag, not a click
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickable, false);
  if (hits.length) {
    const idx = hits[0].object.userData.index;
    setFocus(idx);
    focusSel.value = String(idx);
  }
});

// ---------------------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------------------
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');
const speedInput = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
const focusSel = document.getElementById('focus');
const infoCard = document.getElementById('info');

PLANETS.forEach((p, i) => {
  const o = document.createElement('option');
  o.value = String(i); o.textContent = p.name;
  focusSel.appendChild(o);
});

playBtn.addEventListener('click', () => {
  playing = !playing;
  playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
  playBtn.classList.toggle('active', playing);
});
resetBtn.addEventListener('click', () => { setFocus(-1); focusSel.value = '-1'; resetCamera(); });
speedInput.addEventListener('input', () => {
  speedMul = speedInput.value / 100;
  speedVal.textContent = speedMul.toFixed(1) + '×';
});
focusSel.addEventListener('change', () => setFocus(parseInt(focusSel.value, 10)));

document.getElementById('tOrbits').addEventListener('change', (e) => {
  orbitLines.forEach(o => o.visible = e.target.checked);
});
document.getElementById('tLabels').addEventListener('change', (e) => {
  labelRenderer.domElement.style.display = e.target.checked ? '' : 'none';
});
document.getElementById('tStars').addEventListener('change', (e) => { stars.visible = e.target.checked; });
document.getElementById('tBloom').addEventListener('change', (e) => { bloomEnabled = e.target.checked; });

document.getElementById('zoomIn').addEventListener('click', () => dolly(0.8));
document.getElementById('zoomOut').addEventListener('click', () => dolly(1.25));
function dolly(factor) {
  const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
  const len = THREE.MathUtils.clamp(dir.length() * factor, controls.minDistance, controls.maxDistance);
  dir.setLength(len);
  camera.position.copy(controls.target).add(dir);
}

function resetCamera() {
  camTarget.set(0, 0, 0);
  camDesired.set(0, 38, 78);
}

const camTarget = new THREE.Vector3(0, 0, 0);   // where controls look
const camDesired = new THREE.Vector3(0, 38, 78); // desired camera pos when focusing
let following = false;

function setFocus(idx) {
  focusIndex = idx;
  if (idx < 0) {
    following = false;
    infoCard.classList.remove('show');
    return;
  }
  following = true;
  const p = PLANETS[idx];
  // info card
  document.getElementById('infoName').textContent = p.name;
  document.getElementById('infoSwatch').style.background = '#' + new THREE.Color(p.color).getHexString();
  document.getElementById('infoDia').textContent = p.facts.dia;
  document.getElementById('infoDist').textContent = p.facts.dist;
  document.getElementById('infoPeriod').textContent = p.facts.period;
  document.getElementById('infoDay').textContent = p.facts.day;
  document.getElementById('infoMoons').textContent = p.facts.moons;
  infoCard.classList.add('show');
}

// ---------------------------------------------------------------------------
// Animate
// ---------------------------------------------------------------------------
const worldPos = new THREE.Vector3();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (playing) {
    sun.rotation.y += 0.02 * dt * 10;
    planetObjs.forEach((o) => {
      o.pivot.rotation.y += o.data.speed * 0.02 * speedMul * dt * 10;
      o.mesh.rotation.y += o.data.spin * speedMul * dt * 10;
      if (o.moonPivot) o.moonPivot.rotation.y += 0.5 * speedMul * dt * 10;
    });
  }
  stars.rotation.y += 0.0008 * dt * 10;

  // camera follow
  if (following && focusIndex >= 0) {
    const o = planetObjs[focusIndex];
    o.mesh.getWorldPosition(worldPos);
    camTarget.lerp(worldPos, 0.08);
    const off = Math.max(o.data.size * 5, 6);
    const desired = worldPos.clone().add(new THREE.Vector3(off * 0.6, off * 0.5, off));
    camDesired.lerp(desired, 0.04);
    camera.position.lerp(camDesired, 0.06);
  } else {
    camTarget.lerp(new THREE.Vector3(0, 0, 0), 0.05);
  }
  controls.target.lerp(camTarget, 0.2);

  controls.update();

  if (bloomEnabled) composer.render();
  else renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Resize + boot
// ---------------------------------------------------------------------------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});

speedMul = speedInput.value / 100;
speedVal.textContent = speedMul.toFixed(1) + '×';
animate();

// hide loader once first frame is ready
requestAnimationFrame(() => {
  setTimeout(() => document.getElementById('loader').classList.add('hide'), 350);
});
