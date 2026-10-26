// Three.js scenes: a miniature neighbourhood of shopfronts (height = rating) and a single shop with stars.
// Plain Three.js (no React) so it can be disposed cleanly. Always call the returned dispose().
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SIGNAGE, hashString, colorForName } from './colors.js';
export { SIGNAGE, hashString, colorForName };
const AWNING = ['#FFC61A', '#FFFFFF', '#F2542D', '#2F5BEA'];
const INK = '#0B1533';
const GOLD = '#FFC61A';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

// ---------- procedural textures ----------
function stripeTexture(a, b) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 16;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i += 1) {
    g.fillStyle = i % 2 ? b : a;
    g.fillRect(i * 16, 0, 16, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(1, 1);
  t.anisotropy = 4;
  return t;
}

function signTexture(text) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  const r = 26;
  g.fillStyle = GOLD;
  g.beginPath();
  g.roundRect(8, 8, 240, 112, r);
  g.fill();
  g.lineWidth = 8;
  g.strokeStyle = INK;
  g.stroke();
  g.fillStyle = INK;
  g.font = '800 70px "Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function windowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,0.0)';
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(255,255,255,0.28)';
  for (let x = 0; x < 3; x += 1) g.fillRect(14 + x * 38, 22, 24, 44);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- one shopfront ----------
const W = 1.7;
const heightFor = (rating) => 0.9 + (rating == null ? 0.3 : rating) * 0.62;

function buildShop({ name, rating }, shared) {
  const h = heightFor(rating);
  const group = new THREE.Group();
  const bodyColor = colorForName(name);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(W, h, W).translate(0, h / 2, 0),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.62, metalness: 0.05, emissive: '#000000' })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // upper-storey windows
  const facadeTex = shared.windows.clone();
  facadeTex.needsUpdate = true;
  const rows = Math.max(1, Math.floor((h - 1.6) / 0.85));
  facadeTex.repeat.set(1, rows);
  const facade = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.9, Math.max(0.1, h - 1.7)),
    new THREE.MeshBasicMaterial({ map: facadeTex, transparent: true })
  );
  facade.position.set(0, 1.55 + (h - 1.7) / 2, W / 2 + 0.012);
  if (h > 2.2) group.add(facade);

  // shop window glass + door
  const glass = new THREE.MeshStandardMaterial({ color: '#BFD3FF', roughness: 0.15, metalness: 0.2, emissive: '#35508F', emissiveIntensity: 0.6 });
  [-0.5, 0.5].forEach((x) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.05), glass);
    win.position.set(x, 0.5, W / 2 + 0.02);
    group.add(win);
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.74, 0.05), new THREE.MeshStandardMaterial({ color: INK, roughness: 0.5 }));
  door.position.set(0, 0.37, W / 2 + 0.03);
  group.add(door);

  // striped awning
  const pair = AWNING[hashString(name) % 2 ? 0 : 2];
  const stripe = shared.stripe(pair, '#FFFFFF');
  const solid = new THREE.MeshStandardMaterial({ color: pair, roughness: 0.8 });
  const striped = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.85 });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, 0.05, 0.78), [solid, solid, striped, striped, solid, solid]);
  awning.position.set(0, 1.12, W / 2 + 0.34);
  awning.rotation.x = 0.32;
  awning.castShadow = true;
  group.add(awning);

  // roof rim
  const rim = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.1, W + 0.12), new THREE.MeshStandardMaterial({ color: INK, roughness: 0.7 }));
  rim.position.set(0, h + 0.05, 0);
  rim.castShadow = true;
  group.add(rim);

  // rating sign above the roof
  const label = rating == null ? '-' : rating.toFixed(1);
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTexture(label), transparent: true }));
  sign.scale.set(1.25, 0.625, 1);
  sign.position.set(0, h + 0.75, 0);
  group.add(sign);

  group.userData = { name, rating, height: h, body };
  return group;
}

function makeShared() {
  const cache = new Map();
  return {
    windows: windowTexture(),
    stripe: (a, b) => {
      const k = `${a}${b}`;
      if (!cache.has(k)) cache.set(k, stripeTexture(a, b));
      return cache.get(k);
    },
  };
}

function disposeScene(scene) {
  const textures = new Set();
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    mats.forEach((m) => {
      if (m.map) textures.add(m.map);
      m.dispose();
    });
  });
  textures.forEach((t) => t.dispose());
}

function baseRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);
  return renderer;
}

function addLights(scene, extent) {
  scene.add(new THREE.HemisphereLight('#DCE6FF', '#1B2B66', 1.05));
  const sun = new THREE.DirectionalLight('#FFF4DD', 2.1);
  sun.position.set(extent * 0.9, extent * 1.4, extent * 0.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = extent * 1.6;
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.5, far: extent * 6 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#6F8CFF', 0.9);
  rim.position.set(-extent, extent * 0.6, -extent);
  scene.add(rim);
}

function addGround(scene, extent) {
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(extent * 6, extent * 6), new THREE.ShadowMaterial({ opacity: 0.35 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.receiveShadow = true;
  scene.add(shadow);
  const grid = new THREE.GridHelper(extent * 3, Math.round(extent * 3 / 1.25), '#4A66D8', '#2A3C86');
  grid.position.y = 0.002;
  const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
  mats.forEach((m) => {
    m.transparent = true;
    m.opacity = 0.32;
  });
  scene.add(grid);
}

/**
 * Neighbourhood of shops. buildings: [{ name, rating, count }]
 * opts: { interactive, onHover(info|null), parallax, autoRotateSpeed }
 */
export function createCityScene(container, buildings, opts = {}) {
  if (!webglAvailable()) return null;
  const { interactive = true, onHover, parallax = false, autoRotateSpeed = 0.55 } = opts;
  const calm = reducedMotion();

  const renderer = baseRenderer(container);
  const scene = new THREE.Scene();
  const shared = makeShared();

  // tallest shops in the middle: lay out a grid and fill it from the centre outwards
  const n = Math.max(1, buildings.length);
  const cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.5)));
  const rowsN = Math.ceil(n / cols);
  const gap = 2.7;
  const slots = [];
  for (let r = 0; r < rowsN; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      slots.push({ x: (c - (cols - 1) / 2) * gap, z: (r - (rowsN - 1) / 2) * gap });
    }
  }
  slots.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
  const ordered = [...buildings].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  const extent = Math.max(cols, rowsN) * gap * 0.5 + 1.5;

  addLights(scene, extent);
  addGround(scene, extent);

  const shops = ordered.map((b, i) => {
    const g = buildShop(b, shared);
    g.userData.count = b.count;
    g.position.set(slots[i].x, 0, slots[i].z);
    g.rotation.y = 0;
    scene.add(g);
    return g;
  });

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  const target = new THREE.Vector3(0, 1.3, 0);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = 0.7;
  controls.maxPolarAngle = 1.32;
  controls.enableRotate = interactive;
  controls.autoRotate = !calm;
  controls.autoRotateSpeed = autoRotateSpeed;
  renderer.domElement.style.touchAction = 'pan-y';
  let resume;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    clearTimeout(resume);
  });
  controls.addEventListener('end', () => {
    resume = setTimeout(() => { controls.autoRotate = !calm; }, 2500);
  });

  const placeCamera = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fit = extent * 2.35 * Math.max(1, 1.45 / camera.aspect);
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 0.01) dir.set(0.6, 0.55, 1);
    dir.normalize().multiplyScalar(fit);
    camera.position.copy(controls.target).add(dir);
    camera.updateProjectionMatrix();
  };
  camera.position.set(extent * 1.2, extent * 1.05, extent * 1.9);
  placeCamera();
  const ro = new ResizeObserver(placeCamera);
  ro.observe(container);

  // ---- hover ----
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  const setHover = (shop, ev) => {
    if (hovered && hovered !== shop) hovered.userData.body.material.emissive.set('#000000');
    hovered = shop;
    if (shop) shop.userData.body.material.emissive.set('#26376F');
    renderer.domElement.style.cursor = shop ? 'pointer' : 'grab';
    if (!onHover) return;
    if (!shop) return onHover(null);
    const rect = container.getBoundingClientRect();
    return onHover({ name: shop.userData.name, rating: shop.userData.rating, count: shop.userData.count, x: ev.clientX - rect.left, y: ev.clientY - rect.top });
  };
  const onMove = (ev) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    if (parallax) {
      mouse.x = pointer.x;
      mouse.y = pointer.y;
    }
    if (!interactive) return;
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(shops.map((s) => s.userData.body), false)[0];
    setHover(hit ? hit.object.parent : null, ev);
  };
  const onLeave = () => { setHover(null); mouse.x = 0; mouse.y = 0; };
  const mouse = { x: 0, y: 0 };
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('pointerleave', onLeave);

  // ---- animation: shops rise once, staggered ----
  let start = null;
  shops.forEach((s) => s.scale.set(1, calm ? 1 : 0.001, 1));
  let raf = 0;
  let visible = true;
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.01 });
  io.observe(container);
  const baseCam = new THREE.Vector3();
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    if (start === null) start = now;
    if (!calm) {
      shops.forEach((s, i) => {
        const t = Math.min(1, Math.max(0, (now - start - i * 55) / 900));
        s.scale.y = Math.max(0.001, easeOutCubic(t));
      });
    }
    controls.update();
    if (parallax && !calm) {
      baseCam.copy(camera.position);
      camera.position.x += mouse.x * 0.35;
      camera.position.y += mouse.y * 0.2;
      renderer.render(scene, camera);
      camera.position.copy(baseCam);
    } else {
      renderer.render(scene, camera);
    }
  };
  raf = requestAnimationFrame(tick);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      clearTimeout(resume);
      ro.disconnect();
      io.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      controls.dispose();
      disposeScene(scene);
      shared.windows.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

// ---------- single shop with floating stars (store owner) ----------
function starGeometry(outer = 0.5, inner = 0.215) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 3 });
  g.center();
  return g;
}

export function createShopScene(container, { name, rating }) {
  if (!webglAvailable()) return null;
  const calm = reducedMotion();
  const renderer = baseRenderer(container);
  const scene = new THREE.Scene();
  const shared = makeShared();
  addLights(scene, 5);
  addGround(scene, 3.2);

  const shop = buildShop({ name, rating: rating ?? 3 }, shared);
  // the sign above the roof shows the real value
  shop.children.forEach((c) => {
    if (c.isSprite) {
      c.material.map.dispose();
      c.material.map = signTexture(rating == null ? '-' : rating.toFixed(1));
      c.material.needsUpdate = true;
    }
  });
  scene.add(shop);
  const topY = shop.userData.height;

  const geo = starGeometry();
  const lit = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.55, roughness: 0.28, emissive: '#7A5200', emissiveIntensity: 0.5 });
  const dim = new THREE.MeshStandardMaterial({ color: '#8C99BF', metalness: 0.1, roughness: 0.6, transparent: true, opacity: 0.45 });
  const filled = rating == null ? 0 : Math.round(rating);
  const stars = [];
  for (let i = 0; i < 5; i += 1) {
    const m = new THREE.Mesh(geo, i < filled ? lit : dim);
    m.castShadow = false;
    const a = (i / 5) * Math.PI * 2;
    m.userData = { a, y: topY + 2.3 + (i % 2) * 0.3 };
    m.scale.setScalar(0.9);
    scene.add(m);
    stars.push(m);
  }

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = 11.5 + (camera.aspect < 1 ? 5 : 0);
    camera.position.set(dist * 0.55, topY + 2.4, dist);
    camera.lookAt(0, topY * 0.62 + 0.55, 0);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  let raf = 0;
  let visible = true;
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.01 });
  io.observe(container);
  let last = performance.now();
  let spin = 0;
  const rise = { start: null };
  shop.scale.y = calm ? 1 : 0.001;
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (rise.start === null) rise.start = now;
    if (!calm) {
      shop.scale.y = Math.max(0.001, easeOutCubic(Math.min(1, (now - rise.start) / 1000)));
      spin += dt * 0.35;
    }
    shop.rotation.y = -0.5 + Math.sin(spin * 0.6) * 0.35;
    stars.forEach((s, i) => {
      const a = s.userData.a + spin * 0.9;
      s.position.set(Math.cos(a) * 1.85, s.userData.y + Math.sin(now / 700 + i) * 0.12, Math.sin(a) * 1.85);
      s.rotation.y = a + Math.PI / 2;
    });
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(tick);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      geo.dispose();
      disposeScene(scene);
      shared.windows.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
