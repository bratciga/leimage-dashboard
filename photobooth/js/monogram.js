/**
 * monogram.js — Le Image Photo Booth Monogram Builder
 *
 * Features:
 *  - 38 Google Fonts sorted alphabetically
 *  - Dual color pickers (linked by default) for names + date
 *  - 16 flourish styles drawn programmatically
 *  - Live canvas preview (always transparent background)
 *  - Realistic print mock with sample photos
 *  - 2×6 export: doubled for 4×6 sheet (printer cuts in half)
 *  - Full-res PNG export
 *
 * Canvas specs:
 *  - 4×6 print: 1844 × 1240 px (landscape)
 *  - 2×6 strip: 1240 × 1844 px (portrait) — but EXPORT is 1844×1240 doubled
 */

'use strict';

/* ================================================================
   FONT LIST — 38 fonts, sorted A-Z
================================================================ */
const MONOGRAM_FONTS = [
  { name: 'Alex Brush',          family: 'Alex Brush' },
  { name: 'Allura',              family: 'Allura' },
  { name: 'Amatic SC',           family: 'Amatic SC' },
  { name: 'Ballet',              family: 'Ballet' },
  { name: 'Birthstone',          family: 'Birthstone' },
  { name: 'Bonheur Royale',      family: 'Bonheur Royale' },
  { name: 'Carattere',           family: 'Carattere' },
  { name: 'Caveat',              family: 'Caveat' },
  { name: 'Cinzel',              family: 'Cinzel' },
  { name: 'Cookie',              family: 'Cookie' },
  { name: 'Corinthia',           family: 'Corinthia' },
  { name: 'Cormorant Garamond',  family: 'Cormorant Garamond' },
  { name: 'Courgette',           family: 'Courgette' },
  { name: 'Crimson Text',        family: 'Crimson Text' },
  { name: 'Dancing Script',      family: 'Dancing Script' },
  { name: 'Fleur De Leah',       family: 'Fleur De Leah' },
  { name: 'Great Vibes',         family: 'Great Vibes' },
  { name: 'Herr Von Muellerhoff',family: 'Herr Von Muellerhoff' },
  { name: 'Italianno',           family: 'Italianno' },
  { name: 'Josefin Sans',        family: 'Josefin Sans' },
  { name: 'Kaushan Script',      family: 'Kaushan Script' },
  { name: 'Libre Baskerville',   family: 'Libre Baskerville' },
  { name: 'Lobster',             family: 'Lobster' },
  { name: 'Lora',                family: 'Lora' },
  { name: 'Luxurious Script',    family: 'Luxurious Script' },
  { name: 'Marck Script',        family: 'Marck Script' },
  { name: 'Meow Script',         family: 'Meow Script' },
  { name: 'Montserrat',          family: 'Montserrat' },
  { name: 'Ms Madi',             family: 'Ms Madi' },
  { name: 'Parisienne',          family: 'Parisienne' },
  { name: 'Petit Formal Script', family: 'Petit Formal Script' },
  { name: 'Pinyon Script',       family: 'Pinyon Script' },
  { name: 'Playfair Display',    family: 'Playfair Display' },
  { name: 'Rochester',           family: 'Rochester' },
  { name: 'Sacramento',          family: 'Sacramento' },
  { name: 'Satisfy',             family: 'Satisfy' },
  { name: 'Style Script',        family: 'Style Script' },
  { name: 'Tangerine',           family: 'Tangerine' },
];

/* ================================================================
   CANVAS SPECS
================================================================ */
const CANVAS_SPECS = {
  '4x6': { w: 1844, h: 1240 },
  '2x6': { w: 1240, h: 1844 },
};

const MONOGRAM_ZONE_HEIGHT_RATIO = 0.28;
const PADDING_RATIO = 0.06;

/* ================================================================
   FLOURISH STYLES
================================================================ */
const FLOURISH_STYLES = [
  { id: 'classic',   name: 'Classic Lines' },
  { id: 'swirl',     name: 'Elegant Swirl' },
  { id: 'laurel',    name: 'Laurel Wreath' },
  { id: 'double',    name: 'Double Lines' },
  { id: 'dots',      name: 'Dots' },
  { id: 'ornate',    name: 'Ornate' },
  { id: 'minimal',   name: 'Minimal' },
  { id: 'none',      name: 'None' },
  { id: 'hearts',    name: 'Hearts' },
  { id: 'stars',     name: 'Stars' },
  { id: 'infinity',  name: 'Infinity' },
  { id: 'arrows',    name: 'Arrows' },
  { id: 'leafvine',  name: 'Leaf Vine' },
  { id: 'artdeco',   name: 'Art Deco' },
  { id: 'waves',     name: 'Waves' },
  { id: 'celtic',    name: 'Celtic Knot' },
];

/* ================================================================
   STATE
================================================================ */
const MonogramState = {
  line1:         '',
  line2:         '',
  fontFamily:    MONOGRAM_FONTS[0].family,
  textColor1:    '#333333',
  textColor2:    '#333333',
  colorsLinked:  true,
  flourish:      'classic',
  printSize:     '4x6',
  canvas:        null,
  mockCanvas:    null,
  backdropColor: null,
};

const _loadedFonts = new Set();
const _sampleImages = [];
let _sampleImagesLoaded = false;

/* ================================================================
   FONT LOADING
================================================================ */
function loadGoogleFont(family) {
  if (_loadedFonts.has(family)) return Promise.resolve();
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(family);
    const href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`;
    if (document.querySelector(`link[href="${href}"]`)) {
      _loadedFonts.add(family);
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => { _loadedFonts.add(family); document.fonts.ready.then(resolve); };
    link.onerror = () => { resolve(); };
    document.head.appendChild(link);
  });
}

/* ================================================================
   SAMPLE IMAGES FOR PRINT MOCK
================================================================ */
function loadSampleImages() {
  const srcs = [
    'assets/images/booth-setup/booth-action-props.jpg',
    'assets/images/booth-setup/booth-props-table.jpg',
    'assets/images/booth-setup/booth-ballroom.jpg',
  ];
  let loaded = 0;
  srcs.forEach((src, i) => {
    const img = new Image();
    img.onload = () => { loaded++; if (loaded === srcs.length) { _sampleImagesLoaded = true; renderPrintMock(); } };
    img.onerror = () => { loaded++; if (loaded === srcs.length) { _sampleImagesLoaded = true; renderPrintMock(); } };
    img.src = src;
    _sampleImages[i] = img;
  });
}

/* ================================================================
   FONT SELECT
================================================================ */
function populateFontSelect() {
  const sel = document.getElementById('mono-font');
  if (!sel) return;
  MONOGRAM_FONTS.forEach((f, i) => {
    const opt = document.createElement('option');
    opt.value = f.family;
    opt.textContent = f.name;
    if (i === 0) opt.selected = true;
    sel.appendChild(opt);
  });
}

/* ================================================================
   FLOURISH DRAWING — 16 styles
================================================================ */
function drawFlourish(ctx, style, x, y, width, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const hw = width / 2;
  const lw = Math.max(1, width * 0.003);
  ctx.lineWidth = lw;

  switch (style) {
    case 'classic': {
      ctx.globalAlpha = 0.55;
      const gap = width * 0.08;
      ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x - gap, y); ctx.moveTo(x + gap, y); ctx.lineTo(x + hw, y); ctx.stroke();
      ctx.globalAlpha = 0.75;
      const d = width * 0.018;
      ctx.beginPath(); ctx.moveTo(x, y - d); ctx.lineTo(x + d, y); ctx.lineTo(x, y + d); ctx.lineTo(x - d, y); ctx.closePath(); ctx.fill();
      break;
    }
    case 'swirl': {
      ctx.globalAlpha = 0.6;
      const r = width * 0.06;
      // Left swirl
      ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x - r * 2, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x - r, y, r, Math.PI, 0, false); ctx.stroke();
      // Right swirl
      ctx.beginPath(); ctx.moveTo(x + hw, y); ctx.lineTo(x + r * 2, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + r, y, r, Math.PI, 0, true); ctx.stroke();
      break;
    }
    case 'laurel': {
      ctx.globalAlpha = 0.6;
      const leafW = width * 0.025;
      const leafH = width * 0.05;
      for (let i = 0; i < 6; i++) {
        const offset = width * 0.04 + i * width * 0.06;
        // Left side
        ctx.beginPath();
        ctx.ellipse(x - offset, y - leafH * 0.3, leafW, leafH, -0.5 - i * 0.08, 0, Math.PI * 2);
        ctx.stroke();
        // Right side
        ctx.beginPath();
        ctx.ellipse(x + offset, y - leafH * 0.3, leafW, leafH, 0.5 + i * 0.08, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'double': {
      ctx.globalAlpha = 0.5;
      const gap = width * 0.008;
      ctx.beginPath(); ctx.moveTo(x - hw, y - gap); ctx.lineTo(x + hw, y - gap); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - hw, y + gap); ctx.lineTo(x + hw, y + gap); ctx.stroke();
      break;
    }
    case 'dots': {
      ctx.globalAlpha = 0.6;
      const dotR = width * 0.005;
      const count = 20;
      const spacing = width / (count + 1);
      for (let i = 1; i <= count; i++) {
        const dx = x - hw + i * spacing;
        const r = (i === Math.floor(count/2) || i === Math.ceil(count/2)) ? dotR * 2 : dotR;
        ctx.beginPath(); ctx.arc(dx, y, r, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'ornate': {
      ctx.globalAlpha = 0.55;
      const r = width * 0.04;
      // Center ornament
      ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2); ctx.stroke();
      // Left loops
      ctx.beginPath(); ctx.arc(x - r * 2, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - r * 3, y); ctx.lineTo(x - hw, y); ctx.stroke();
      // Right loops
      ctx.beginPath(); ctx.arc(x + r * 2, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + r * 3, y); ctx.lineTo(x + hw, y); ctx.stroke();
      break;
    }
    case 'minimal': {
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.moveTo(x - hw * 0.6, y); ctx.lineTo(x + hw * 0.6, y); ctx.stroke();
      break;
    }
    case 'none': break;
    case 'hearts': {
      ctx.globalAlpha = 0.6;
      const s = width * 0.02;
      // Lines
      ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x - s * 2, y); ctx.moveTo(x + s * 2, y); ctx.lineTo(x + hw, y); ctx.stroke();
      // Heart
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.6);
      ctx.bezierCurveTo(x - s * 1.5, y - s, x - s * 0.2, y - s * 1.5, x, y - s * 0.3);
      ctx.bezierCurveTo(x + s * 0.2, y - s * 1.5, x + s * 1.5, y - s, x, y + s * 0.6);
      ctx.fill();
      break;
    }
    case 'stars': {
      ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x - width * 0.12, y); ctx.moveTo(x + width * 0.12, y); ctx.lineTo(x + hw, y); ctx.stroke();
      // 5-pointed star
      const sr = width * 0.025;
      const ir = sr * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r2 = i % 2 === 0 ? sr : ir;
        const angle = (i * Math.PI / 5) - Math.PI / 2;
        const px = x + r2 * Math.cos(angle);
        const py = y + r2 * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'infinity': {
      ctx.globalAlpha = 0.6;
      const r = width * 0.04;
      ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x - r * 2.5, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + hw, y); ctx.lineTo(x + r * 2.5, y); ctx.stroke();
      // Infinity symbol (two circles)
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + r, y - r * 1.5, x + r * 2.5, y - r * 0.5, x + r * 2, y);
      ctx.bezierCurveTo(x + r * 2.5, y + r * 0.5, x + r, y + r * 1.5, x, y);
      ctx.bezierCurveTo(x - r, y - r * 1.5, x - r * 2.5, y - r * 0.5, x - r * 2, y);
      ctx.bezierCurveTo(x - r * 2.5, y + r * 0.5, x - r, y + r * 1.5, x, y);
      ctx.stroke();
      break;
    }
    case 'arrows': {
      ctx.globalAlpha = 0.6;
      const aw = width * 0.03;
      // Left arrow
      ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x - aw, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - hw + aw, y - aw); ctx.lineTo(x - hw, y); ctx.lineTo(x - hw + aw, y + aw); ctx.stroke();
      // Right arrow
      ctx.beginPath(); ctx.moveTo(x + hw, y); ctx.lineTo(x + aw, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + hw - aw, y - aw); ctx.lineTo(x + hw, y); ctx.lineTo(x + hw - aw, y + aw); ctx.stroke();
      // Center dot
      ctx.beginPath(); ctx.arc(x, y, width * 0.006, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'leafvine': {
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(x - hw * 0.8, y); ctx.lineTo(x + hw * 0.8, y); ctx.stroke();
      const leafS = width * 0.018;
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        const lx = x + i * width * 0.08;
        const dir = i % 2 === 0 ? -1 : 1;
        ctx.beginPath();
        ctx.ellipse(lx, y + dir * leafS * 0.5, leafS * 0.6, leafS, dir * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'artdeco': {
      ctx.globalAlpha = 0.6;
      const s = width * 0.03;
      // Center chevron
      ctx.beginPath();
      ctx.moveTo(x - s, y); ctx.lineTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.closePath();
      ctx.stroke();
      // Extending lines with small chevrons
      ctx.beginPath(); ctx.moveTo(x - s * 1.5, y); ctx.lineTo(x - hw, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 1.5, y); ctx.lineTo(x + hw, y); ctx.stroke();
      // Small ticks
      for (let i = 1; i <= 3; i++) {
        const tx = hw * 0.3 + i * hw * 0.15;
        ctx.beginPath(); ctx.moveTo(x - tx, y - s * 0.3); ctx.lineTo(x - tx, y + s * 0.3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + tx, y - s * 0.3); ctx.lineTo(x + tx, y + s * 0.3); ctx.stroke();
      }
      break;
    }
    case 'waves': {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      const amp = width * 0.012;
      const freq = width * 0.04;
      ctx.moveTo(x - hw * 0.8, y);
      for (let px = x - hw * 0.8; px <= x + hw * 0.8; px += 2) {
        const py = y + Math.sin((px - x) / freq * Math.PI) * amp;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
    }
    case 'celtic': {
      ctx.globalAlpha = 0.6;
      const r = width * 0.03;
      // Interlocking loops
      ctx.beginPath(); ctx.arc(x - r * 0.8, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + r * 0.8, y, r, 0, Math.PI * 2); ctx.stroke();
      // Extending lines
      ctx.beginPath(); ctx.moveTo(x - r * 1.8, y); ctx.lineTo(x - hw, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + r * 1.8, y); ctx.lineTo(x + hw, y); ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/* ================================================================
   FLOURISH PICKER — render preview canvases
================================================================ */
function initFlourishPicker() {
  const grid = document.getElementById('flourish-picker-grid');
  if (!grid) return;
  grid.innerHTML = '';

  FLOURISH_STYLES.forEach(style => {
    const card = document.createElement('div');
    card.className = 'flourish-card' + (style.id === MonogramState.flourish ? ' selected' : '');
    card.dataset.flourish = style.id;

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 48;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 160, 48);
    if (style.id !== 'none') {
      drawFlourish(ctx, style.id, 80, 24, 140, '#c9a84c');
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No Flourish', 80, 24);
    }

    const label = document.createElement('span');
    label.className = 'flourish-label';
    label.textContent = style.name;

    card.appendChild(canvas);
    card.appendChild(label);
    grid.appendChild(card);

    card.addEventListener('click', () => {
      grid.querySelectorAll('.flourish-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      MonogramState.flourish = style.id;
      renderMonogram();
      renderPrintMock();
    });
  });
}

/* ================================================================
   CANVAS RENDERING
================================================================ */
function fitFontSize(ctx, text, fontFamily, maxWidth, maxSize, minSize = 16) {
  let size = maxSize;
  ctx.font = `${size}px "${fontFamily}"`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px "${fontFamily}"`;
  }
  return size;
}

function renderMonogram() {
  const canvas = MonogramState.canvas;
  if (!canvas) return;

  const spec = CANVAS_SPECS[MonogramState.printSize] || CANVAS_SPECS['4x6'];
  if (canvas.width !== spec.w || canvas.height !== spec.h) {
    canvas.width = spec.w;
    canvas.height = spec.h;
  }

  const ctx = canvas.getContext('2d');
  const font = MonogramState.fontFamily;
  const line1 = MonogramState.line1.trim();
  const line2 = MonogramState.line2.trim();
  const color1 = MonogramState.textColor1;
  const color2 = MonogramState.textColor2;

  ctx.clearRect(0, 0, spec.w, spec.h);

  if (!line1 && !line2) {
    ctx.fillStyle = 'rgba(100,100,100,0.3)';
    ctx.font = `${Math.floor(spec.h * 0.025)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Enter text above to preview your monogram', spec.w / 2, spec.h / 2);
    return;
  }

  const zoneTop = spec.h * (1 - MONOGRAM_ZONE_HEIGHT_RATIO);
  const zoneH = spec.h * MONOGRAM_ZONE_HEIGHT_RATIO;
  const centerX = spec.w / 2;
  const padding = spec.w * PADDING_RATIO;
  const maxW = spec.w - padding * 2;

  const maxLine1Size = Math.floor(zoneH * 0.38);
  const maxLine2Size = Math.floor(zoneH * 0.22);

  let size1 = line1 ? fitFontSize(ctx, line1, font, maxW, maxLine1Size) : 0;
  let size2 = line2 ? fitFontSize(ctx, line2, font, maxW, maxLine2Size) : 0;

  const flourishH = (MonogramState.flourish !== 'none') ? zoneH * 0.06 : 0;
  const lineGap = zoneH * 0.06;
  const totalH = (line1 ? size1 : 0) + (line2 ? size2 + lineGap : 0) + (flourishH > 0 ? flourishH * 2 + lineGap * 2 : 0);

  let cursor = zoneTop + (zoneH - totalH) / 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Use the average/first color for flourish
  const flourishColor = color1;

  if (flourishH > 0) {
    drawFlourish(ctx, MonogramState.flourish, centerX, cursor + flourishH / 2, maxW * 0.7, flourishColor);
    cursor += flourishH + lineGap;
  }

  if (line1) {
    ctx.fillStyle = color1;
    ctx.font = `${size1}px "${font}"`;
    ctx.fillText(line1, centerX, cursor + size1 * 0.85);
    cursor += size1 + lineGap;
  }

  if (line2) {
    ctx.fillStyle = color2;
    ctx.font = `${size2}px "${font}"`;
    ctx.fillText(line2, centerX, cursor + size2 * 0.85);
    cursor += size2 + lineGap;
  }

  if (flourishH > 0) {
    drawFlourish(ctx, MonogramState.flourish, centerX, cursor + flourishH / 2, maxW * 0.7, flourishColor);
  }
}

/* ================================================================
   PRINT MOCK — realistic preview with photos
================================================================ */
function drawPhotoIcon(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  const s = size * 0.5;
  ctx.strokeRect(x - s, y - s * 0.7, s * 2, s * 1.4);
  ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.2, s * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.7); ctx.lineTo(x, y); ctx.lineTo(x + s * 0.5, y + s * 0.4); ctx.lineTo(x + s, y + s * 0.7); ctx.fill();
  ctx.restore();
}

function renderPrintMock() {
  const mock = MonogramState.mockCanvas;
  if (!mock) return;

  const printSize = MonogramState.printSize;
  const spec = CANVAS_SPECS[printSize];

  // For 2x6, show the doubled layout (two strips side by side = 4x6 landscape)
  const is2x6 = printSize === '2x6';
  const displayW = is2x6 ? 460 : 460;
  const displayH = is2x6 ? Math.round(460 * 1240 / 1844) : Math.round(460 * spec.h / spec.w);

  mock.width = displayW;
  mock.height = displayH;
  mock.style.width = displayW + 'px';
  mock.style.height = displayH + 'px';

  const ctx = mock.getContext('2d');
  const bgColor = MonogramState.backdropColor || '#2a2a3e';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, displayW, displayH);

  const monoZoneH = Math.round(displayH * MONOGRAM_ZONE_HEIGHT_RATIO);
  const photoAreaH = displayH - monoZoneH;

  if (is2x6) {
    // Two 2x6 strips side by side
    const stripW = Math.floor(displayW / 2) - 1;
    for (let s = 0; s < 2; s++) {
      const sx = s * (stripW + 2);
      // 3 stacked photos per strip
      const ph = Math.floor(photoAreaH / 3) - 2;
      for (let i = 0; i < 3; i++) {
        const py = 2 + i * (ph + 2);
        if (_sampleImagesLoaded && _sampleImages[i] && _sampleImages[i].complete) {
          ctx.drawImage(_sampleImages[i], sx + 2, py, stripW - 4, ph);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(sx + 2, py, stripW - 4, ph);
          drawPhotoIcon(ctx, sx + stripW / 2, py + ph / 2, ph * 0.25);
        }
      }
    }
    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(displayW / 2, 0); ctx.lineTo(displayW / 2, displayH); ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // 4x6: two photos side by side
    const pw = Math.floor(displayW / 2) - 3;
    const ph = photoAreaH - 4;
    for (let i = 0; i < 2; i++) {
      const px = 2 + i * (pw + 2);
      if (_sampleImagesLoaded && _sampleImages[i] && _sampleImages[i].complete) {
        ctx.drawImage(_sampleImages[i], px, 2, pw, ph);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(px, 2, pw, ph);
        drawPhotoIcon(ctx, px + pw / 2, 2 + ph / 2, pw * 0.2);
      }
    }
  }

  // Monogram strip at bottom
  const monoY = displayH - monoZoneH;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillRect(0, monoY, displayW, monoZoneH);

  // Draw monogram content
  const monoCanvas = MonogramState.canvas;
  if (monoCanvas && monoCanvas.width > 0) {
    const srcSpec = CANVAS_SPECS[printSize];
    const srcZoneY = srcSpec.h * (1 - MONOGRAM_ZONE_HEIGHT_RATIO);
    const srcZoneH = srcSpec.h * MONOGRAM_ZONE_HEIGHT_RATIO;

    if (is2x6) {
      // Draw monogram in both strips
      const stripW = Math.floor(displayW / 2) - 1;
      ctx.drawImage(monoCanvas, 0, srcZoneY, srcSpec.w, srcZoneH, 0, monoY, stripW, monoZoneH);
      ctx.drawImage(monoCanvas, 0, srcZoneY, srcSpec.w, srcZoneH, stripW + 2, monoY, stripW, monoZoneH);
    } else {
      ctx.drawImage(monoCanvas, 0, srcZoneY, srcSpec.w, srcZoneH, 0, monoY, displayW, monoZoneH);
    }
  }

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, displayW - 2, displayH - 2);
}

/* ================================================================
   DEBOUNCE
================================================================ */
let _renderTimer = null;
function scheduleRender() {
  clearTimeout(_renderTimer);
  _renderTimer = setTimeout(() => { renderMonogram(); renderPrintMock(); }, 60);
}

/* ================================================================
   EXPORT — transparent PNG
================================================================ */
function exportMonogramPNG() {
  return new Promise((resolve) => {
    const exportCanvas = getExportCanvas();
    exportCanvas.toBlob(resolve, 'image/png');
  });
}

function exportMonogramDataURL() {
  return getExportCanvas().toDataURL('image/png');
}

function getExportCanvas() {
  const printSize = MonogramState.printSize;

  if (printSize === '2x6') {
    // 2x6 export: create 1844×1240 with monogram doubled side by side
    const doubled = document.createElement('canvas');
    doubled.width = 1844;
    doubled.height = 1240;
    const ctx = doubled.getContext('2d');

    const singleCanvas = MonogramState.canvas; // 1240×1844
    // Each half: 922×1240
    const halfW = 922;

    // Draw left half
    ctx.drawImage(singleCanvas, 0, 0, singleCanvas.width, singleCanvas.height, 0, 0, halfW, 1240);
    // Draw right half (identical)
    ctx.drawImage(singleCanvas, 0, 0, singleCanvas.width, singleCanvas.height, halfW, 0, halfW, 1240);

    return doubled;
  }

  // 4x6: return canvas as-is
  return MonogramState.canvas;
}

/* ================================================================
   COLOR HELPERS
================================================================ */
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let l = (max + min) / 2;
  return { l: l * 100 };
}

function isColorTooLight(hex) {
  return hexToHSL(hex).l > 85;
}

/* ================================================================
   INIT
================================================================ */
async function initMonogramBuilder() {
  populateFontSelect();
  loadSampleImages();

  // Create main canvas
  const outer = document.getElementById('canvas-outer');
  if (!outer) return;
  const canvas = document.createElement('canvas');
  const spec = CANVAS_SPECS['4x6'];
  canvas.width = spec.w;
  canvas.height = spec.h;
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '400px';
  canvas.style.display = 'block';
  outer.appendChild(canvas);
  MonogramState.canvas = canvas;

  // Create mock canvas
  const mockWrap = document.getElementById('print-mock-canvas-wrap');
  if (mockWrap) {
    const mock = document.createElement('canvas');
    mock.id = 'print-mock-canvas';
    mock.style.maxWidth = '100%';
    mock.style.display = 'block';
    mock.style.borderRadius = '6px';
    mock.style.border = '1px solid rgba(255,255,255,0.1)';
    mockWrap.appendChild(mock);
    MonogramState.mockCanvas = mock;
  }

  // Init flourish picker
  initFlourishPicker();

  await loadGoogleFont(MonogramState.fontFamily);
  renderMonogram();
  renderPrintMock();

  // --- Wire controls ---

  const line1Input = document.getElementById('mono-line1');
  const line2Input = document.getElementById('mono-line2');

  if (line1Input) line1Input.addEventListener('input', () => { MonogramState.line1 = line1Input.value; scheduleRender(); });
  if (line2Input) line2Input.addEventListener('input', () => { MonogramState.line2 = line2Input.value; scheduleRender(); });

  // Font
  const fontSel = document.getElementById('mono-font');
  const fontPreview = document.getElementById('font-preview-strip');
  if (fontSel) {
    fontSel.addEventListener('change', async () => {
      MonogramState.fontFamily = fontSel.value;
      if (fontPreview) {
        fontPreview.style.fontFamily = `"${fontSel.value}", serif`;
        fontPreview.textContent = line1Input?.value || fontSel.value;
      }
      await loadGoogleFont(fontSel.value);
      renderMonogram();
      renderPrintMock();
    });
  }
  if (fontPreview) {
    fontPreview.style.fontFamily = `"${MonogramState.fontFamily}", serif`;
  }

  // --- Dual color pickers ---
  const color1Input = document.getElementById('mono-color1');
  const color1Hex = document.getElementById('mono-color1-hex');
  const color2Input = document.getElementById('mono-color2');
  const color2Hex = document.getElementById('mono-color2-hex');
  const linkBtn = document.getElementById('color-link-toggle');
  const matchToDate = document.getElementById('match-to-date');
  const matchToNames = document.getElementById('match-to-names');
  const warn1 = document.getElementById('color1-warning');
  const warn2 = document.getElementById('color2-warning');

  function updateColorWarnings() {
    if (warn1) warn1.classList.toggle('hidden', !isColorTooLight(MonogramState.textColor1));
    if (warn2) warn2.classList.toggle('hidden', !isColorTooLight(MonogramState.textColor2));
  }

  function updateMatchButtons() {
    const diff = MonogramState.textColor1 !== MonogramState.textColor2;
    const unlinked = !MonogramState.colorsLinked;
    if (matchToDate) matchToDate.classList.toggle('hidden', !(unlinked && diff));
    if (matchToNames) matchToNames.classList.toggle('hidden', !(unlinked && diff));
  }

  if (color1Input) {
    color1Input.addEventListener('input', () => {
      MonogramState.textColor1 = color1Input.value;
      if (color1Hex) color1Hex.textContent = color1Input.value;
      if (MonogramState.colorsLinked) {
        MonogramState.textColor2 = color1Input.value;
        if (color2Input) color2Input.value = color1Input.value;
        if (color2Hex) color2Hex.textContent = color1Input.value;
      }
      updateColorWarnings();
      updateMatchButtons();
      scheduleRender();
    });
  }

  if (color2Input) {
    color2Input.addEventListener('input', () => {
      MonogramState.textColor2 = color2Input.value;
      if (color2Hex) color2Hex.textContent = color2Input.value;
      if (MonogramState.colorsLinked) {
        MonogramState.textColor1 = color2Input.value;
        if (color1Input) color1Input.value = color2Input.value;
        if (color1Hex) color1Hex.textContent = color2Input.value;
      }
      updateColorWarnings();
      updateMatchButtons();
      scheduleRender();
    });
  }

  if (linkBtn) {
    linkBtn.addEventListener('click', () => {
      MonogramState.colorsLinked = !MonogramState.colorsLinked;
      linkBtn.classList.toggle('linked', MonogramState.colorsLinked);
      linkBtn.textContent = MonogramState.colorsLinked ? '🔗' : '🔓';
      if (MonogramState.colorsLinked) {
        // Sync color2 to color1
        MonogramState.textColor2 = MonogramState.textColor1;
        if (color2Input) color2Input.value = MonogramState.textColor1;
        if (color2Hex) color2Hex.textContent = MonogramState.textColor1;
      }
      updateMatchButtons();
      scheduleRender();
    });
  }

  if (matchToDate) {
    matchToDate.addEventListener('click', () => {
      MonogramState.textColor1 = MonogramState.textColor2;
      if (color1Input) color1Input.value = MonogramState.textColor2;
      if (color1Hex) color1Hex.textContent = MonogramState.textColor2;
      updateColorWarnings();
      updateMatchButtons();
      scheduleRender();
    });
  }

  if (matchToNames) {
    matchToNames.addEventListener('click', () => {
      MonogramState.textColor2 = MonogramState.textColor1;
      if (color2Input) color2Input.value = MonogramState.textColor1;
      if (color2Hex) color2Hex.textContent = MonogramState.textColor1;
      updateColorWarnings();
      updateMatchButtons();
      scheduleRender();
    });
  }

  // Download button
  const dlBtn = document.getElementById('btn-download-preview');
  if (dlBtn) {
    dlBtn.addEventListener('click', async () => {
      const blob = await exportMonogramPNG();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const event = new URLSearchParams(window.location.search).get('event') || 'monogram';
      a.href = url;
      a.download = `${event}-monogram.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Zoom mock button
  const zoomMockBtn = document.getElementById('btn-zoom-mock');
  if (zoomMockBtn) {
    zoomMockBtn.addEventListener('click', () => {
      const modal = document.getElementById('zoom-modal');
      const content = document.getElementById('zoom-modal-content');
      if (!modal || !content || !MonogramState.mockCanvas) return;

      content.innerHTML = '';
      const zoomed = document.createElement('canvas');
      const src = MonogramState.mockCanvas;
      zoomed.width = src.width * 2;
      zoomed.height = src.height * 2;
      const ctx = zoomed.getContext('2d');
      ctx.drawImage(src, 0, 0, zoomed.width, zoomed.height);
      zoomed.style.maxWidth = '100%';
      content.appendChild(zoomed);
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close zoom modal
  const zoomClose = document.getElementById('zoom-modal-close');
  const zoomBackdrop = document.getElementById('zoom-modal-backdrop');
  function closeZoomModal() {
    const modal = document.getElementById('zoom-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  if (zoomClose) zoomClose.addEventListener('click', closeZoomModal);
  if (zoomBackdrop) zoomBackdrop.addEventListener('click', closeZoomModal);
}

/* ================================================================
   HOOKS for app.js
================================================================ */
function updateMonogramPrintSize(size) {
  MonogramState.printSize = size;
  renderMonogram();
  renderPrintMock();
}

function updateMonogramBackdropColor(color) {
  MonogramState.backdropColor = color;
  renderPrintMock();
}

/* ================================================================
   PUBLIC API
================================================================ */
window.MonogramBuilder = {
  init:                  initMonogramBuilder,
  render:                renderMonogram,
  renderMock:            renderPrintMock,
  updatePrintSize:       updateMonogramPrintSize,
  updateBackdropColor:   updateMonogramBackdropColor,
  exportPNG:             exportMonogramPNG,
  exportDataURL:         exportMonogramDataURL,
  state:                 MonogramState,
  fonts:                 MONOGRAM_FONTS,
};
