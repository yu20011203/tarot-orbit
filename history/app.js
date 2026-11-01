import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadHistoryRecords, cardName } from './data.js?v=2';

/* ───────────────────────── data ───────────────────────── */

const records = loadHistoryRecords();
const orbitRecords = records.filter((record) => record.showOrbit);

const ORBIT_RADII = [2.02, 2.9, 3.78, 4.66];
const ORBIT_SPEEDS = [0.021, 0.016, 0.012, 0.009];
const ORBIT_Y = [0.005, 0.035, 0.07, 0.105];
const CARD_WIDTH = 0.66;
const CARD_HEIGHT = CARD_WIDTH * (1264 / 848);

/* ───────────────────────── DOM ───────────────────────── */

const sceneHost = document.querySelector('#scene');
const historyList = document.querySelector('#historyList');
const recordCount = document.querySelector('#recordCount');
const searchInput = document.querySelector('#searchInput');
const allBtn = document.querySelector('#allBtn');
const detailPanel = document.querySelector('#detailPanel');
const detailDate = document.querySelector('#detailDate');
const detailSpread = document.querySelector('#detailSpread');
const detailQuestion = document.querySelector('#detailQuestion');
const detailCards = document.querySelector('#detailCards');
const detailReading = document.querySelector('#detailReading');
const fullReadingBtn = document.querySelector('#fullReadingBtn');
const modal = document.querySelector('#readingModal');
const modalDate = document.querySelector('#modalDate');
const modalSpread = document.querySelector('#modalSpread');
const modalQuestion = document.querySelector('#modalQuestion');
const modalCards = document.querySelector('#modalCards');
const modalBody = document.querySelector('#modalBody');
const loading = document.querySelector('#loading');
const nowDate = document.querySelector('#nowDate');
const syncToast = document.querySelector('#syncToast');

records.forEach((record) => {
  const firstCard = record.cards[0];
  record.matched = true;
  record.speed = ORBIT_SPEEDS[record.orbit];
  record.radius = ORBIT_RADII[record.orbit];
  record.labelOpacity = 0;
  record.cardNames = record.cards.map((card) => cardName(card));
  record.searchText = [
    record.date,
    record.question,
    record.spreadName,
    ...record.cardNames,
    ...record.cards.map((card) => [card.position, card.posMeaning, card.orientation].filter(Boolean).join(' ')),
    record.summary
  ].join(' ').toLowerCase();
  record.coverFile = firstCard ? firstCard.file : '';
});

let selectedRecord = records[0];
let filterQuery = '';
let detailSwapTimer = 0;

/* ───────────────────────── UI ───────────────────────── */

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cardThumb(card) {
  const name = cardName(card);
  const position = [card.position, card.orientation].filter(Boolean).join(" · ");
  return `
    <div class="dcard">
      <div class="dcard-img">
        <img src="cards/${encodeURIComponent(card.code)}.jpg" alt="${escapeHtml(name)}" loading="lazy" />
      </div>
      <div class="dc-name">${escapeHtml(name)}</div>
      <div class="dc-pos">${escapeHtml(position)}</div>
    </div>
  `;
}

function sourceLabel(record) {
  return record.source === 'ai' ? 'AI 深读 × 知识库' : '本地知识库';
}

function renderHistory() {
  const visible = records.filter((record) => record.matched);
  historyList.innerHTML = visible.length
    ? visible.map((record) => `
        <button class="history-item${record.id === selectedRecord?.id ? ' active' : ''}" data-record-id="${record.id}" type="button">
          <span class="h-date">${escapeHtml(record.date)}</span>
          <span class="h-question">${escapeHtml(record.question)}</span>
          <span class="h-meta">
            <em>${record.cards.length} 张牌</em><span>·</span><span>${escapeHtml(record.spreadName)}</span>
            <span class="h-source${record.source === 'ai' ? ' ai' : ''}">${record.source === 'ai' ? 'AI 深读' : '本地解读'}</span>
          </span>
        </button>
      `).join('')
    : `<div class="history-empty">${records.length ? "星轨里没有找到这段记忆" : "还没有抽牌记录"}</div>`;

  recordCount.textContent = filterQuery
    ? `${visible.length} / ${records.length} 次占卜`
    : `${records.length} 次占卜`;
}

function updateHistoryActive() {
  historyList.querySelectorAll('.history-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.recordId === selectedRecord?.id);
  });
  const active = historyList.querySelector('.history-item.active');
  if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function fillDetail(record) {
  if (!record) return;
  detailDate.textContent = record.date;
  detailSpread.textContent = record.spreadName + " · " + record.cards.length + " 张牌 · " + sourceLabel(record);
  detailSpread.hidden = !record.spreadName;
  detailQuestion.textContent = record.question;
  detailCards.innerHTML = record.cards.map(cardThumb).join('');
  detailReading.textContent = record.summary;
}

function selectRecord(record, options = {}) {
  if (!record) return;
  const { immediate = false } = options;
  const changed = selectedRecord?.id !== record.id;
  selectedRecord = record;
  updateHistoryActive();
  updateLabelStates();

  if (!changed && !immediate) return;
  window.clearTimeout(detailSwapTimer);

  if (immediate) {
    fillDetail(record);
    detailPanel.classList.remove('swapping');
    return;
  }

  detailPanel.classList.add('swapping');
  detailSwapTimer = window.setTimeout(() => {
    fillDetail(record);
    requestAnimationFrame(() => detailPanel.classList.remove('swapping'));
  }, 155);
}

function applySearch(value) {
  filterQuery = value.trim().toLowerCase();
  records.forEach((record) => {
    record.matched = !filterQuery || record.searchText.includes(filterQuery);
  });

  renderHistory();
  updateLabelStates();
  allBtn.style.opacity = filterQuery ? '0.95' : '0.55';

  if (filterQuery && (!selectedRecord || !selectedRecord.matched)) {
    const first = records.find((record) => record.matched);
    if (first) selectRecord(first, { immediate: true });
  }
}

function openReadingModal() {
  const record = selectedRecord;
  if (!record) return;
  modalDate.textContent = record.date;
  modalSpread.textContent = record.spreadName + " · " + record.cards.length + " 张牌 · " + sourceLabel(record);
  modalQuestion.textContent = record.question;
  modalCards.innerHTML = record.cards.map(cardThumb).join('');
  modalBody.textContent = record.full;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('.modal-card').scrollTop = 0;
}

function closeReadingModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

historyList.addEventListener('click', (event) => {
  const item = event.target.closest('.history-item');
  if (!item) return;
  const record = records.find((entry) => entry.id === item.dataset.recordId);
  selectRecord(record);
});

searchInput.addEventListener('input', () => applySearch(searchInput.value));

allBtn.addEventListener('click', () => {
  searchInput.value = '';
  applySearch('');
  searchInput.focus();
});

fullReadingBtn.addEventListener('click', openReadingModal);
modal.addEventListener('click', (event) => {
  if (event.target.closest('[data-close]')) closeReadingModal();
});

syncToast?.addEventListener('click', () => window.location.reload());

window.addEventListener('storage', (event) => {
  const historyKey = window.TarotHistory?.key;
  if (!historyKey || (event.key !== historyKey && event.key !== null)) return;
  syncToast?.setAttribute('hidden', '');
  requestAnimationFrame(() => syncToast?.removeAttribute('hidden'));
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeReadingModal();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

const today = new Date();
nowDate.textContent = `${today.getFullYear()} / ${String(today.getMonth() + 1).padStart(2, '0')} / ${String(today.getDate()).padStart(2, '0')}`;
allBtn.style.opacity = '0.55';
document.body.classList.toggle('has-empty', records.length === 0);
if (selectedRecord) fillDetail(selectedRecord);
renderHistory();

/* ───────────────────────── three.js setup ───────────────────────── */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04030a);
scene.fog = new THREE.FogExp2(0x04030a, 0.013);
const MAX_PIXEL_RATIO = 1.55;
const COMPOSER_SCALE = 0.9;

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 140);
const cameraTarget = new THREE.Vector3(0, 0.08, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.domElement.setAttribute('aria-label', '可拖动的塔罗宇宙三维视图');
sceneHost.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO) * COMPOSER_SCALE
);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.52,
  0.52,
  0.82
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const BLOOM_SCALE = 0.72;

function resizeBloomPass(width, height, pixelRatio) {
  bloomPass.setSize(
    Math.max(1, Math.round(width * pixelRatio * BLOOM_SCALE)),
    Math.max(1, Math.round(height * pixelRatio * BLOOM_SCALE))
  );
}

resizeBloomPass(
  window.innerWidth,
  window.innerHeight,
  Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
);

/* ───────────────────────── texture helpers ───────────────────────── */

function makeRadialTexture(size, stops) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const starTexture = makeRadialTexture(64, [
  [0, 'rgba(255,255,255,1)'],
  [0.12, 'rgba(255,248,225,0.95)'],
  [0.3, 'rgba(255,232,180,0.38)'],
  [0.62, 'rgba(190,160,255,0.08)'],
  [1, 'rgba(0,0,0,0)']
]);

const warmGlowTexture = makeRadialTexture(256, [
  [0, 'rgba(255,238,196,0.9)'],
  [0.18, 'rgba(255,204,112,0.48)'],
  [0.46, 'rgba(196,112,62,0.14)'],
  [0.72, 'rgba(102,64,160,0.05)'],
  [1, 'rgba(0,0,0,0)']
]);

const violetGlowTexture = makeRadialTexture(256, [
  [0, 'rgba(196,173,255,0.72)'],
  [0.22, 'rgba(130,89,228,0.36)'],
  [0.52, 'rgba(64,46,155,0.11)'],
  [1, 'rgba(0,0,0,0)']
]);

function makeFrameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 460;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  const inset = 15;
  const width = canvas.width - inset * 2;
  const height = canvas.height - inset * 2;
  const radius = 18;

  context.beginPath();
  context.roundRect(inset, inset, width, height, radius);
  context.strokeStyle = 'rgba(255, 227, 160, 0.92)';
  context.lineWidth = 2.4;
  context.shadowColor = 'rgba(255, 205, 118, 0.85)';
  context.shadowBlur = 14;
  context.stroke();

  context.shadowBlur = 0;
  context.beginPath();
  context.roundRect(inset + 7, inset + 7, width - 14, height - 14, radius - 5);
  context.strokeStyle = 'rgba(255, 224, 154, 0.22)';
  context.lineWidth = 1;
  context.stroke();

  const corner = 23;
  context.strokeStyle = 'rgba(255, 236, 190, 0.98)';
  context.lineWidth = 2.2;
  [
    [inset, inset, 1, 1],
    [canvas.width - inset, inset, -1, 1],
    [inset, canvas.height - inset, 1, -1],
    [canvas.width - inset, canvas.height - inset, -1, -1]
  ].forEach(([x, y, sx, sy]) => {
    context.beginPath();
    context.moveTo(x + corner * sx, y);
    context.lineTo(x + 6 * sx, y);
    context.lineTo(x, y + 6 * sy);
    context.lineTo(x, y + corner * sy);
    context.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const frameTexture = makeFrameTexture();

/* ───────────────────────── star field ───────────────────────── */

const starLayers = [];

function createStarLayer(count, innerRadius, outerRadius, baseSize, opacity) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const radius = THREE.MathUtils.lerp(innerRadius, outerRadius, Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const colorRoll = Math.random();
    if (colorRoll > 0.9) {
      color.setHSL(0.72, 0.38, 0.78);
    } else if (colorRoll > 0.76) {
      color.setHSL(0.1, 0.42, 0.82);
    } else {
      color.setHSL(0.56, 0.1, 0.92);
    }
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;

    sizes[index] = baseSize * THREE.MathUtils.randFloat(0.55, 1.8);
    phases[index] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO) },
      uOpacity: { value: opacity }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float twinkle = 0.68 + 0.32 * sin(uTime * 1.25 + aPhase);
        vTwinkle = twinkle;
        vColor = aColor;
        gl_PointSize = clamp(
          aSize * uPixelRatio * (240.0 / max(1.0, -mvPosition.z)),
          0.65,
          3.8
        );
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec2 point = gl_PointCoord - 0.5;
        float distanceToCenter = length(point);
        float halo = smoothstep(0.5, 0.02, distanceToCenter);
        float core = smoothstep(0.14, 0.0, distanceToCenter);
        float alpha = (halo * 0.58 + core * 0.75) * vTwinkle * uOpacity;
        gl_FragColor = vec4(vColor, alpha);
        if (alpha < 0.01) discard;
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.userData.baseRotation = Math.random() * Math.PI * 2;
  starLayers.push(points);
  scene.add(points);
  return points;
}

createStarLayer(1500, 18, 48, 0.42, 0.86);
createStarLayer(800, 9, 22, 0.26, 0.72);

/* ───────────────────────── background nebulae ───────────────────────── */

function addNebula(texture, color, position, scale, opacity) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(scale, scale, 1);
  sprite.renderOrder = -2;
  scene.add(sprite);
  return sprite;
}

addNebula(violetGlowTexture, 0x6546b8, new THREE.Vector3(-3.6, 1.3, -10), 13, 0.3);
addNebula(warmGlowTexture, 0x8b5938, new THREE.Vector3(4.2, 0.4, -12), 10, 0.18);
addNebula(violetGlowTexture, 0x35297d, new THREE.Vector3(1.5, -2.2, -15), 16, 0.24);

/* ───────────────────────── central planet ───────────────────────── */

const planetGroup = new THREE.Group();
scene.add(planetGroup);

const planetMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec3 vObjectPosition;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    void main() {
      vObjectPosition = position;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec3 vObjectPosition;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
        f.z
      );
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p = p * 2.03 + 13.7;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec3 p = normalize(vObjectPosition);
      float warp = fbm(p * 2.2 + vec3(0.0, uTime * 0.035, 0.0));
      float bands = sin((p.y * 6.4 + warp * 2.7 + uTime * 0.09) * 3.14159265);
      float ribbon = smoothstep(0.22, 0.98, bands * 0.5 + 0.5);
      float clouds = fbm(p * 3.8 + vec3(2.4, 1.5, 4.7));
      float fine = fbm(p * 7.2 + vec3(uTime * 0.035, 0.0, 0.0));

      float ribbonCore = smoothstep(0.55, 1.0, bands * 0.5 + 0.5);

      vec3 deepBlue = vec3(0.0015, 0.0018, 0.018);
      vec3 indigo = vec3(0.010, 0.009, 0.075);
      vec3 violet = vec3(0.032, 0.012, 0.10);
      vec3 gold = vec3(1.0, 0.58, 0.15);

      vec3 color = mix(deepBlue, indigo, smoothstep(0.16, 0.9, clouds));
      color = mix(color, violet, ribbon * 0.34);
      color += gold * smoothstep(0.66, 0.99, ribbonCore * (0.72 + fine * 0.36)) * 0.55;

      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDirection), 0.0), 2.6);
      color += vec3(0.3, 0.17, 0.75) * fresnel * 0.3;

      vec3 lightDirection = normalize(vec3(-0.72, 0.58, 0.62));
      float lightAmount = max(dot(normalize(vWorldNormal), lightDirection), 0.0);
      float hotspot = pow(lightAmount, 5.0);
      float ember = pow(lightAmount, 10.0);
      float diffuse = clamp(dot(normalize(vWorldNormal), lightDirection) * 0.5 + 0.5, 0.0, 1.0);
      color *= 0.42 + diffuse * 0.62;
      color += gold * hotspot * 1.0;
      color += vec3(1.0, 0.78, 0.4) * ember * 0.34;

      gl_FragColor = vec4(color, 1.0);
    }
  `
});

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(0.99, 96, 64),
  planetMaterial
);
planetGroup.add(planet);

const planetAura = new THREE.Sprite(new THREE.SpriteMaterial({
  map: warmGlowTexture,
  color: 0xffc77c,
  transparent: true,
  opacity: 0.52,
  depthWrite: false,
  blending: THREE.AdditiveBlending
}));
planetAura.scale.set(3.75, 3.75, 1);
planetAura.position.z = -0.32;
planetGroup.add(planetAura);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.045, 64, 48),
  new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float rim = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDirection)), 2.4);
        vec3 color = mix(vec3(0.38, 0.22, 0.9), vec3(1.0, 0.69, 0.31), rim * 0.35);
        gl_FragColor = vec4(color, rim * 0.38);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
);
planetGroup.add(atmosphere);

function addPlanetRing(radius, thickness, tiltX, tiltY, tiltZ, opacity) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, thickness, 6, 220),
    new THREE.MeshBasicMaterial({
      color: 0xffdda0,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  ring.rotation.set(tiltX, tiltY, tiltZ);
  planetGroup.add(ring);
  return ring;
}

const planetRingA = addPlanetRing(1.25, 0.0045, Math.PI / 2 + 0.22, 0.02, 0.08, 0.6);
const planetRingB = addPlanetRing(1.46, 0.003, Math.PI / 2 - 0.32, -0.08, -0.12, 0.36);

/* ───────────────────────── orbit system ───────────────────────── */

const orbitField = new THREE.Group();
orbitField.rotation.set(-0.018, 0.03, 0.028);
scene.add(orbitField);

const orbitLines = [];

function createOrbit(radius, index) {
  const segments = 420;
  const points = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      ORBIT_Y[index],
      Math.sin(angle) * radius
    ));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: index < 2 ? 0xd9b86e : 0xb79b62,
    transparent: true,
    opacity: index < 2 ? 0.46 : 0.34,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const line = new THREE.LineLoop(geometry, material);
  orbitField.add(line);
  orbitLines.push(line);

  const beadCount = 26 + index * 5;
  const positions = new Float32Array(beadCount * 3);
  for (let bead = 0; bead < beadCount; bead += 1) {
    const angle = (bead / beadCount) * Math.PI * 2 + index * 0.31;
    positions[bead * 3] = Math.cos(angle) * radius;
    positions[bead * 3 + 1] = ORBIT_Y[index] + 0.008;
    positions[bead * 3 + 2] = Math.sin(angle) * radius;
  }
  const beadGeometry = new THREE.BufferGeometry();
  beadGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const beads = new THREE.Points(
    beadGeometry,
    new THREE.PointsMaterial({
      map: starTexture,
      color: 0xffd98b,
      size: 0.07 - index * 0.005,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
  );
  orbitField.add(beads);
}

ORBIT_RADII.forEach((radius, index) => createOrbit(radius, index));

/* ───────────────────────── floating card labels ───────────────────────── */

const labelsLayer = document.createElement('div');
labelsLayer.className = 'card-labels';
document.body.appendChild(labelsLayer);

const coreLabel = document.createElement('div');
coreLabel.className = 'core-label';
coreLabel.innerHTML = '<span class="core-cn">塔罗宇宙</span><span class="core-en">TAROT ORBIT</span>';
document.body.appendChild(coreLabel);

orbitRecords.forEach((record) => {
  const label = document.createElement('button');
  label.type = 'button';
  label.className = 'card-label';
  label.dataset.recordId = record.id;
  label.innerHTML = `
    <span class="cl-date">${record.date.replaceAll('/', '.')}</span>
    <span class="cl-q">${escapeHtml(record.question)}</span>
  `;
  label.addEventListener('click', () => selectRecord(record));
  label.addEventListener('pointerenter', () => {
    hoveredLabel = record;
  });
  label.addEventListener('pointerleave', () => {
    if (hoveredLabel === record) hoveredLabel = null;
  });
  labelsLayer.appendChild(label);
  record.label = label;
});

function updateLabelStates() {
  records.forEach((record) => {
    if (!record.label) return;
    record.label.classList.toggle('is-hidden', !record.matched);
    record.label.classList.toggle('active', record.id === selectedRecord?.id);
  });
}

updateLabelStates();

/* ───────────────────────── cards ───────────────────────── */

const textureLoader = new THREE.TextureLoader();
const cardMeshes = [];
const cardGroups = [];
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
let hoveredCard = null;
let hoveredLabel = null;

function loadTexture(url) {
  return new Promise((resolve) => {
    textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, maxAnisotropy);
        resolve(texture);
      },
      undefined,
      () => resolve(null)
    );
  });
}

function createCard(record, texture, fallbackTexture) {
  const group = new THREE.Group();
  group.userData.record = record;

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(CARD_WIDTH + 0.045, CARD_HEIGHT + 0.045),
    new THREE.MeshBasicMaterial({
      color: 0xd4b371,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    })
  );
  plate.position.z = -0.008;
  plate.renderOrder = 2;
  group.add(plate);

  const cardMaterial = new THREE.MeshBasicMaterial({
    map: texture || fallbackTexture,
    color: 0xfff3dc,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const cardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT),
    cardMaterial
  );
  cardMesh.userData.record = record;
  cardMesh.renderOrder = 3;
  group.add(cardMesh);

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(CARD_WIDTH * 1.22, CARD_HEIGHT * 1.16),
    new THREE.MeshBasicMaterial({
      map: frameTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    })
  );
  frame.position.z = 0.012;
  frame.renderOrder = 4;
  group.add(frame);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: warmGlowTexture,
    color: 0xffcc7d,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  halo.scale.set(CARD_WIDTH * 2.4, CARD_HEIGHT * 1.55, 1);
  halo.position.z = -0.032;
  halo.renderOrder = 1;
  group.add(halo);

  const startAngle = record.angle;
  const localY = ORBIT_Y[record.orbit];
  group.position.set(
    Math.cos(startAngle) * record.radius,
    localY,
    Math.sin(startAngle) * record.radius
  );

  record.group = group;
  record.cardMesh = cardMesh;
  record.plate = plate;
  record.frame = frame;
  record.halo = halo;
  record.visualOpacity = 0;
  record.reveal = 0;
  record.baseScale = 1;
  record.floatPhase = Math.random() * Math.PI * 2;

  cardGroups.push(group);
  cardMeshes.push(cardMesh);
  orbitField.add(group);
}

async function loadCards() {
  const fallbackTexture = await loadTexture('back.jpg');
  const cardRecords = orbitRecords.filter((record) => record.coverFile);
  const textures = await Promise.all(
    cardRecords.map((record) => loadTexture(`cards/${encodeURIComponent(record.coverFile)}.jpg`))
  );
  cardRecords.forEach((record, index) => createCard(record, textures[index], fallbackTexture));
}

/* ───────────────────────── camera interaction ───────────────────────── */

const initialAzimuth = 0;
const initialPolar = 1.105;
const initialRadius = 15.2;
let targetAzimuth = initialAzimuth;
let targetPolar = initialPolar;
let targetRadius = initialRadius;
let currentAzimuth = initialAzimuth;
let currentPolar = initialPolar + 0.055;
let currentRadius = initialRadius + 2.6;

let isDragging = false;
let dragPointerId = null;
let dragStartX = 0;
let dragStartY = 0;
let lastPointerX = 0;
let lastPointerY = 0;
let dragDistance = 0;
let pointerInside = false;
let lastInteraction = performance.now();
const pointerNdc = new THREE.Vector2(2, 2);
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

function noteInteraction() {
  lastInteraction = performance.now();
}

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function planetBlocksRay(origin, direction, maxDistance, radius = 1.08) {
  const b = origin.dot(direction);
  const c = origin.lengthSq() - radius * radius;
  const discriminant = b * b - c;
  if (discriminant < 0) return false;
  const near = -b - Math.sqrt(discriminant);
  return near > 0.001 && near < maxDistance - 0.08;
}

function pickCard() {
  if (pointerNdc.x < -1.02 || pointerNdc.x > 1.02 || pointerNdc.y < -1.02 || pointerNdc.y > 1.02) {
    return null;
  }
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(cardMeshes, false);
  for (const hit of hits) {
    const record = hit.object.userData.record;
    if (!record?.matched) continue;
    if (planetBlocksRay(raycaster.ray.origin, raycaster.ray.direction, hit.distance)) continue;
    return record;
  }
  return null;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  isDragging = true;
  dragPointerId = event.pointerId;
  dragStartX = lastPointerX = event.clientX;
  dragStartY = lastPointerY = event.clientY;
  dragDistance = 0;
  renderer.domElement.setPointerCapture?.(event.pointerId);
  sceneHost.classList.add('dragging');
  noteInteraction();
});

renderer.domElement.addEventListener('pointerenter', (event) => {
  pointerInside = true;
  updatePointer(event);
});

renderer.domElement.addEventListener('pointerleave', () => {
  pointerInside = false;
  if (!isDragging) hoveredCard = null;
});

window.addEventListener('pointermove', (event) => {
  if (!isDragging) {
    if (pointerInside) updatePointer(event);
    return;
  }

  const deltaX = event.clientX - lastPointerX;
  const deltaY = event.clientY - lastPointerY;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

  targetAzimuth -= deltaX * 0.0042;
  targetPolar = THREE.MathUtils.clamp(targetPolar - deltaY * 0.0034, 0.77, 1.42);
  updatePointer(event);
  noteInteraction();
});

window.addEventListener('pointerup', (event) => {
  if (!isDragging || event.pointerId !== dragPointerId) return;
  isDragging = false;
  dragPointerId = null;
  sceneHost.classList.remove('dragging');
  updatePointer(event);
  noteInteraction();

  if (dragDistance < 7) {
    const record = pickCard();
    if (record) selectRecord(record, { immediate: false });
  }
});

window.addEventListener('pointercancel', () => {
  isDragging = false;
  dragPointerId = null;
  sceneHost.classList.remove('dragging');
});

sceneHost.addEventListener('wheel', (event) => {
  event.preventDefault();
  const delta = event.deltaMode === 1 ? event.deltaY * 18 : event.deltaY;
  targetRadius = THREE.MathUtils.clamp(targetRadius + delta * 0.008, 10.4, 19.5);
  noteInteraction();
}, { passive: false });

renderer.domElement.addEventListener('dblclick', () => {
  targetAzimuth = initialAzimuth;
  targetPolar = initialPolar;
  targetRadius = initialRadius;
  noteInteraction();
});

document.querySelector('.icon-btn').addEventListener('click', () => {
  targetAzimuth = initialAzimuth;
  targetPolar = initialPolar;
  targetRadius = initialRadius;
  noteInteraction();
});

/* ───────────────────────── projected labels ───────────────────────── */

const projectedWorld = new THREE.Vector3();
const cardWorldPosition = new THREE.Vector3();
const coreWorldPosition = new THREE.Vector3(0, 0.05, 0);
const cameraToCard = new THREE.Vector3();
const cardRayDirection = new THREE.Vector3();
const closestRayPoint = new THREE.Vector3();

function projectToScreen(worldPosition) {
  projectedWorld.copy(worldPosition).project(camera);
  return {
    x: (projectedWorld.x * 0.5 + 0.5) * window.innerWidth,
    y: (-projectedWorld.y * 0.5 + 0.5) * window.innerHeight,
    z: projectedWorld.z
  };
}

let safeUiBounds = { left: 0, right: window.innerWidth };

function updateSafeUiBounds() {
  if (window.innerWidth <= 820) {
    safeUiBounds = { left: 12, right: window.innerWidth - 12 };
    return;
  }
  const historyBounds = document.querySelector('#historyPanel').getBoundingClientRect();
  const detailBounds = document.querySelector('#detailPanel').getBoundingClientRect();
  safeUiBounds = {
    left: historyBounds.right + 10,
    right: detailBounds.left - 10
  };
}

updateSafeUiBounds();

function updateProjectedLabels(dt = 1 / 60) {
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const baseScale = window.innerHeight / (2 * Math.tan(verticalFov * 0.5));
  const coreScreen = projectToScreen(coreWorldPosition);
  const planetRadiusPixels = (0.99 * baseScale) / Math.max(1, camera.position.length()) + 12;
  const layout = [];

  orbitRecords.forEach((record) => {
    if (!record.group) return;
    record.group.getWorldPosition(cardWorldPosition);
    const screen = projectToScreen(cardWorldPosition);
    const distance = camera.position.distanceTo(cardWorldPosition);
    const cardHeightPixels = (CARD_HEIGHT * record.group.scale.x * baseScale) / Math.max(1, distance);

    cameraToCard.copy(cardWorldPosition).sub(camera.position);
    cardRayDirection.copy(cameraToCard).normalize();
    const rayDistance = camera.position.dot(cardRayDirection) * -1;
    closestRayPoint.copy(camera.position).addScaledVector(cardRayDirection, rayDistance);
    const occludedByPlanet =
      rayDistance > 0 &&
      rayDistance < cameraToCard.length() - 0.02 &&
      closestRayPoint.length() < 1.14;

    const labelY = screen.y + cardHeightPixels * 0.5 + 8;
    const labelWidth = Math.min(148, Math.max(92, record.question.length * 11 + 22));
    const insideSafeArea = screen.x > safeUiBounds.left && screen.x < safeUiBounds.right;
    const visible =
      screen.z < 1 &&
      screen.z > -1 &&
      record.matched &&
      record.reveal > 0.55 &&
      Math.hypot(screen.x - coreScreen.x, screen.y - coreScreen.y) > planetRadiusPixels + 18 &&
      !occludedByPlanet &&
      insideSafeArea;
    const depthFade = THREE.MathUtils.clamp(1.16 - (distance - 7) / 16, 0.42, 0.9);

    layout.push({
      record,
      screen,
      labelY,
      labelWidth,
      distance,
      depthFade,
      visible,
      priority:
        (record.id === selectedRecord?.id ? 20000 : 0) +
        (record === hoveredLabel || record === hoveredCard ? 10000 : 0) +
        (500 - distance * 8)
    });
  });

  layout.sort((a, b) => b.priority - a.priority);
  const occupied = [];

  layout.forEach((item) => {
    const rect = {
      left: item.screen.x - item.labelWidth * 0.5,
      right: item.screen.x + item.labelWidth * 0.5,
      top: item.labelY - 2,
      bottom: item.labelY + 33
    };
    const overlaps = occupied.some((other) => (
      rect.left < other.right &&
      rect.right > other.left &&
      rect.top < other.bottom &&
      rect.bottom > other.top
    ));
    const show = item.visible && !overlaps;
    if (show) occupied.push(rect);

    const focused =
      item.record.id === selectedRecord?.id ||
      item.record === hoveredLabel ||
      item.record === hoveredCard;
    const targetOpacity = show ? item.depthFade * (focused ? 1 : 0.86) : 0;
    item.record.labelOpacity = THREE.MathUtils.damp(
      item.record.labelOpacity,
      targetOpacity,
      show ? 8 : 12,
      dt
    );
    const opacity = item.record.labelOpacity < 0.012 ? 0 : item.record.labelOpacity;
    item.record.label.style.transform = `translate3d(${item.screen.x.toFixed(1)}px, ${item.labelY.toFixed(1)}px, 0) translate(-50%, 0)`;
    item.record.label.style.opacity = opacity.toFixed(3);
    item.record.label.style.pointerEvents = show && opacity > 0.45 ? 'auto' : 'none';
    item.record.label.style.zIndex = String(
      Math.round(1000 - item.distance * 10 + (item.record.id === selectedRecord?.id ? 200 : 0))
    );
  });

  const coreScale = THREE.MathUtils.clamp(1.06 - (currentRadius - 14) * 0.026, 0.8, 1.12);
  coreLabel.style.transform = `translate3d(${coreScreen.x.toFixed(1)}px, ${coreScreen.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${coreScale.toFixed(3)})`;
  coreLabel.style.opacity = coreScreen.z < 1 ? '1' : '0';
}

/* ───────────────────────── resize ───────────────────────── */

function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  composer.setPixelRatio(pixelRatio * COMPOSER_SCALE);
  composer.setSize(width, height);
  resizeBloomPass(width, height, pixelRatio);
  starLayers.forEach((layer) => {
    layer.material.uniforms.uPixelRatio.value = pixelRatio;
  });
  window.clearTimeout(handleResize.uiTimer);
  handleResize.uiTimer = window.setTimeout(updateSafeUiBounds, 120);
}

window.addEventListener('resize', handleResize);

/* ───────────────────────── animation ───────────────────────── */

let elapsed = 0;
let hoveredRecordCache = null;
let introStartedAt = 0;

function easeOutCubic(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function updateScene(dt) {
  elapsed += dt;
  const introTime = introStartedAt ? (performance.now() - introStartedAt) / 1000 : 0;

  const idle = performance.now() - lastInteraction > 2400;
  if (!isDragging && idle) {
    targetAzimuth += dt * 0.021;
  }

  currentAzimuth = THREE.MathUtils.damp(currentAzimuth, targetAzimuth, 2.8, dt);
  currentPolar = THREE.MathUtils.damp(currentPolar, targetPolar, 3.4, dt);
  currentRadius = THREE.MathUtils.damp(currentRadius, targetRadius, 3.2, dt);

  camera.position.setFromSphericalCoords(currentRadius, currentPolar, currentAzimuth);
  camera.position.y += 0.18;
  camera.lookAt(cameraTarget);

  planetMaterial.uniforms.uTime.value = elapsed;
  planetGroup.rotation.y = elapsed * 0.022;
  planetRingA.rotation.z += dt * 0.016;
  planetRingB.rotation.z -= dt * 0.023;
  planetAura.material.opacity = 0.48 + Math.sin(elapsed * 0.8) * 0.035;

  starLayers.forEach((layer, index) => {
    layer.material.uniforms.uTime.value = elapsed;
    layer.rotation.y = elapsed * (index === 0 ? 0.0028 : -0.0041);
    layer.rotation.x = Math.sin(elapsed * 0.012 + index) * 0.03;
  });

  if (pointerInside && !isDragging) {
    const record = pickCard();
    hoveredCard = record;
  } else if (!hoveredLabel) {
    hoveredCard = null;
  }

  const effectiveHover = hoveredLabel || hoveredCard;
  if (effectiveHover !== hoveredRecordCache) {
    orbitRecords.forEach((record) => {
      record.label?.classList.toggle('hover', record === effectiveHover);
    });
    hoveredRecordCache = effectiveHover;
  }
  renderer.domElement.classList.toggle('hovering-card', Boolean(effectiveHover) && !isDragging);

  orbitRecords.forEach((record, index) => {
    if (!record.group) return;
    const isSelected = record.id === selectedRecord?.id;
    const isHovered = record === effectiveHover;
    const reveal = record.matched
      ? easeOutCubic((introTime - index * 0.055) / 0.82)
      : 0;
    record.reveal = reveal;
    const targetOpacity = record.matched ? reveal : 0.1;
    record.visualOpacity = THREE.MathUtils.damp(record.visualOpacity, targetOpacity, 7, dt);

    const dampedAngle = record.angle + elapsed * record.speed;
    const floatOffset = Math.sin(elapsed * 0.72 + record.floatPhase) * 0.035;
    const selectedLift = isSelected ? 0.055 : 0;
    record.group.position.set(
      Math.cos(dampedAngle) * record.radius,
      ORBIT_Y[record.orbit] + floatOffset + selectedLift,
      Math.sin(dampedAngle) * record.radius
    );
    record.group.lookAt(camera.position);

    const targetBase = record.matched
      ? (isSelected ? 1.24 : isHovered ? 1.09 : 1)
      : 0.93;
    const targetScale = record.matched ? targetBase * (0.74 + reveal * 0.26) : targetBase;
    const scale = THREE.MathUtils.damp(record.group.scale.x, targetScale, 9, dt);
    record.group.scale.setScalar(scale);

    record.cardMesh.material.opacity = record.visualOpacity;
    record.plate.material.opacity = 0.44 * record.visualOpacity * reveal;
    record.halo.material.opacity = (
      0.1 + (isHovered ? 0.09 : 0) + (isSelected ? 0.27 : 0)
    ) * record.visualOpacity * reveal;
    record.halo.scale.x = THREE.MathUtils.damp(
      record.halo.scale.x,
      CARD_WIDTH * (isSelected ? 2.7 : 2.4),
      7,
      dt
    );

    const frameTarget = isSelected ? 0.95 : isHovered ? 0.48 : 0;
    record.frame.material.opacity = THREE.MathUtils.damp(
      record.frame.material.opacity,
      frameTarget * record.visualOpacity,
      10,
      dt
    );
  });

  orbitLines.forEach((line, index) => {
    line.material.opacity = (index < 2 ? 0.46 : 0.34) + Math.sin(elapsed * 0.6 + index) * 0.045;
  });

  updateProjectedLabels(dt);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 1 / 30);
  updateScene(dt);
  composer.render();
}

/* ───────────────────────── boot ───────────────────────── */

async function boot() {
  try {
    await loadCards();
  } catch (error) {
    console.error('卡牌纹理加载失败：', error);
  }
  clock.start();
  introStartedAt = performance.now();
  renderer.setAnimationLoop(animate);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loading.classList.add('done');
    });
  });
}

const loadingFallback = window.setTimeout(() => loading.classList.add('done'), 8500);
boot().finally(() => window.clearTimeout(loadingFallback));
