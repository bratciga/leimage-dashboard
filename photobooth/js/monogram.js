/**
 * monogram.js — Le Image Photo Booth Monogram Builder
 *
 * Canvas specs (production-ready, always transparent background):
 *  - 2×6 strip:  1240 × 1844 px  (portrait)
 *  - 4×6 print:  1844 × 1240 px  (landscape)
 *
 * Flourish styles: classic | swirl | laurel | double | dots | ornate | minimal | none
 */

'use strict';

/* ================================================================
   FONT LIST
================================================================ */
const MONOGRAM_FONTS = [
  { name: 'Great Vibes',         family: 'Great Vibes' },
  { name: 'Alex Brush',          family: 'Alex Brush' },
  { name: 'Allura',              family: 'Allura' },
  { name: 'Cormorant Garamond',  family: 'Cormorant Garamond' },
  { name: 'Playfair Display',    family: 'Playfair Display' },
  { name: 'Cinzel',              family: 'Cinzel' },
  { name: 'Libre Baskerville',   family: 'Libre Baskerville' },
  { name: 'Dancing Script',      family: 'Dancing Script' },
  { name: 'Sacramento',          family: 'Sacramento' },
  { name: 'Parisienne',          family: 'Parisienne' },
  { name: 'Tangerine',           family: 'Tangerine' },
  { name: 'Montserrat',          family: 'Montserrat' },
  { name: 'Lora',                family: 'Lora' },
  { name: 'Josefin Sans',        family: 'Josefin Sans' },
  { name: 'Crimson Text',        family: 'Crimson Text' },
  { name: 'Petit Formal Script', family: 'Petit Formal Script' },
  { name: 'Pinyon Script',       family: 'Pinyon Script' },
  { name: 'Rochester',           family: 'Rochester' },
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
   BACKDROP COLOR LOOKUP (for print mock preview)
================================================================ */
const BACKDROP_COLORS = {
  'Marble White': '#ece8e0',
  'Marble Black': '#1e1e22',
  'Lollipop':     '#d88ca0',
  'Romb':         '#3a3a5e',
  'Red':          '#6e1414',
  'Silver':       '#828296',
  'Pink':         '#e8a8bc',
  'Gold':         '#7a6020',
  'Own Backdrop': '#383848',
};

/* ================================================================
   FLOURISH STYLES
================================================================ */

/** Draw: Classic Lines — lines + center diamond */
function drawFlourishClassic(ctx, cx, cy, width, color) {
  const hw  = width * 0.46;
  const gap = hw * 0.07;
  const d   = width * 0.018;
  const lw  = Math.max(0.5, width * 0.0022);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = lw;
  ctx.globalAlpha = 0.72;

  ctx.beginPath();
  ctx.moveTo(cx - hw, cy); ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + hw, cy);
  ctx.stroke();

  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(cx, cy - d);
  ctx.lineTo(cx + d * 1.4, cy);
  ctx.lineTo(cx, cy + d);
  ctx.lineTo(cx - d * 1.4, cy);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/** Draw: Elegant Swirl — symmetric scroll curves */
function drawFlourishSwirl(ctx, cx, cy, width, color) {
  const hw = width * 0.44;
  const h  = width * 0.028;
  const lw = Math.max(0.5, width * 0.002);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.globalAlpha = 0.72;
  ctx.lineCap     = 'round';

  // Left scroll arm
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy);
  ctx.lineTo(cx - hw * 0.30, cy);
  ctx.bezierCurveTo(
    cx - hw * 0.15, cy,
    cx - hw * 0.07, cy - h * 2.4,
    cx - hw * 0.015, cy - h * 1.4
  );
  ctx.bezierCurveTo(
    cx + hw * 0.015, cy - h * 0.3,
    cx,              cy + h * 0.7,
    cx - hw * 0.025, cy + h * 0.35
  );
  ctx.stroke();

  // Right scroll arm (mirror)
  ctx.beginPath();
  ctx.moveTo(cx + hw, cy);
  ctx.lineTo(cx + hw * 0.30, cy);
  ctx.bezierCurveTo(
    cx + hw * 0.15, cy,
    cx + hw * 0.07, cy - h * 2.4,
    cx + hw * 0.015, cy - h * 1.4
  );
  ctx.bezierCurveTo(
    cx - hw * 0.015, cy - h * 0.3,
    cx,              cy + h * 0.7,
    cx + hw * 0.025, cy + h * 0.35
  );
  ctx.stroke();

  ctx.restore();
}

/** Draw: Laurel Wreath — leaf ellipses arcing outward */
function drawFlourishLaurel(ctx, cx, cy, width, color) {
  const hw     = width * 0.44;
  const leafW  = width * 0.012;
  const leafH  = width * 0.038;
  const count  = 7;

  ctx.save();
  ctx.fillStyle   = color;
  ctx.globalAlpha = 0.62;

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count; // 0..1 from outer to inner
    const baseAngle = -Math.PI * 0.32 + t * Math.PI * 0.32;

    // Left side
    const lx = cx - hw * (1 - t * 0.88);
    ctx.save();
    ctx.translate(lx, cy);
    ctx.rotate(baseAngle - Math.PI * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, -leafH * 0.5, leafW, leafH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right side (mirror)
    const rx = cx + hw * (1 - t * 0.88);
    ctx.save();
    ctx.translate(rx, cy);
    ctx.rotate(-(baseAngle - Math.PI * 0.5));
    ctx.beginPath();
    ctx.ellipse(0, -leafH * 0.5, leafW, leafH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/** Draw: Double Lines — two thin parallel lines */
function drawFlourishDouble(ctx, cx, cy, width, color) {
  const hw  = width * 0.46;
  const gap = width * 0.009;
  const lw  = Math.max(0.5, width * 0.0014);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.globalAlpha = 0.65;

  ctx.beginPath();
  ctx.moveTo(cx - hw, cy - gap); ctx.lineTo(cx + hw, cy - gap);
  ctx.moveTo(cx - hw, cy + gap); ctx.lineTo(cx + hw, cy + gap);
  ctx.stroke();

  ctx.restore();
}

/** Draw: Dots — evenly-spaced circles with larger center cluster */
function drawFlourishDots(ctx, cx, cy, width, color) {
  const hw       = width * 0.44;
  const count    = 11;
  const baseR    = width * 0.007;
  const midIndex = Math.floor(count / 2);

  ctx.save();
  ctx.fillStyle   = color;
  ctx.globalAlpha = 0.68;

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = cx - hw + t * hw * 2;
    const distFromMid = Math.abs(i - midIndex);
    // Center dots slightly larger
    const r = distFromMid <= 1 ? baseR * (1.6 - distFromMid * 0.3) : baseR;

    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Draw: Ornate — lines + diamond + small loops + end dots */
function drawFlourishOrnate(ctx, cx, cy, width, color) {
  const hw  = width * 0.46;
  const gap = hw * 0.16;
  const d   = width * 0.015;
  const h   = width * 0.018;
  const lw  = Math.max(0.5, width * 0.002);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = lw;
  ctx.globalAlpha = 0.7;
  ctx.lineCap     = 'round';

  // Main lines
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy); ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + hw, cy);
  ctx.stroke();

  // Center diamond
  ctx.globalAlpha = 0.88;
  ctx.beginPath();
  ctx.moveTo(cx, cy - d);
  ctx.lineTo(cx + d * 1.4, cy);
  ctx.lineTo(cx, cy + d);
  ctx.lineTo(cx - d * 1.4, cy);
  ctx.closePath();
  ctx.fill();

  // Small loops near inner ends
  ctx.globalAlpha = 0.5;
  ctx.lineWidth   = lw * 0.75;
  [-1, 1].forEach(side => {
    const lx = cx + side * gap;
    ctx.beginPath();
    ctx.arc(lx + side * h * 1.1, cy, h * 1.05, 0, Math.PI * 2);
    ctx.stroke();
  });

  // End dots at outer tips
  ctx.globalAlpha = 0.72;
  ctx.fillStyle   = color;
  ctx.beginPath();
  ctx.arc(cx - hw, cy, d * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + hw, cy, d * 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Draw: Minimal — single thin continuous line */
function drawFlourishMinimal(ctx, cx, cy, width, color) {
  const hw = width * 0.46;
  const lw = Math.max(0.5, width * 0.001);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.globalAlpha = 0.48;

  ctx.beginPath();
  ctx.moveTo(cx - hw, cy);
  ctx.lineTo(cx + hw, cy);
  ctx.stroke();

  ctx.restore();
}

/** None — no-op */
function drawFlourishNone() {}

/* Exported registry */
const FLOURISH_STYLES = [
  { id: 'classic', name: 'Classic Lines',  draw: drawFlourishClassic },
  { id: 'swirl',   name: 'Elegant Swirl',  draw: drawFlourishSwirl   },
  { id: 'laurel',  name: 'Laurel Wreath',  draw: drawFlourishLaurel  },
  { id: 'double',  name: 'Double Lines',   draw: drawFlourishDouble  },
  { id: 'dots',    name: 'Dots',           draw: drawFlourishDots    },
  { id: 'ornate',  name: 'Ornate',         draw: drawFlourishOrnate  },
  { id: 'minimal', name: 'Minimal',        draw: drawFlourishMinimal },
  { id: 'none',    name: 'None',           draw: drawFlourishNone    },
];

/* ================================================================
   STATE
================================================================ */
const MonogramState = {
  line1:         '',
  line2:         '',
  fontFamily:    MONOGRAM_FONTS[0].family,
  textColor:     '#ffffff',
  flourishStyle: 'classic',
  printSize:     '4x6',
  backdropColor: null,  // set by app.js when backdrop chosen
  canvas:        null,  // main preview canvas
  mockCanvas:    null,  // print-layout mock canvas
};

const _loadedFonts = new Set();

/* ================================================================
   FONT LOADING
================================================================ */
function loadGoogleFont(family) {
  if (_loadedFonts.has(family)) return Promise.resolve();

  return new Promise((resolve) => {
    const encoded = encodeURIComponent(family);
    const href    = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`;

    if (document.querySelector(`link[href="${href}"]`)) {
      _loadedFonts.add(family);
      resolve();
      return;
    }

    const link    = document.createElement('link');
    link.rel      = 'stylesheet';
    link.href     = href;
    link.onload   = () => { _loadedFonts.add(family); document.fonts.ready.then(resolve); };
    link.onerror  = () => resolve();
    document.head.appendChild(link);
  });
}

/* ================================================================
   FONT SELECT POPULATION
================================================================ */
function populateFontSelect() {
  const sel = document.getElementById('mono-font');
  if (!sel) return;
  MONOGRAM_FONTS.forEach((f, i) => {
    const opt       = document.createElement('option');
    opt.value       = f.family;
    opt.textContent = f.name;
    if (i === 0) opt.selected = true;
    sel.appendChild(opt);
  });
}

/* ================================================================
   FIT FONT SIZE
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

/* ================================================================
   RENDER MONOGRAM  (always transparent background)
================================================================ */
async function renderMonogram() {
  const canvas = MonogramState.canvas;
  if (!canvas) return;

  const spec = CANVAS_SPECS[MonogramState.printSize] || CANVAS_SPECS['4x6'];
  const cw   = spec.w;
  const ch   = spec.h;

  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width  = cw;
    canvas.height = ch;
  }

  const ctx    = canvas.getContext('2d');
  const font   = MonogramState.fontFamily;
  const line1  = MonogramState.line1.trim();
  const line2  = MonogramState.line2.trim();
  const tColor = MonogramState.textColor;

  // Always transparent background
  ctx.clearRect(0, 0, cw, ch);

  if (!line1 && !line2) {
    ctx.fillStyle    = 'rgba(255,255,255,0.12)';
    ctx.font         = `${Math.floor(ch * 0.022)}px sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Enter text above to preview your monogram', cw / 2, ch / 2);
    renderPrintMock();
    return;
  }

  const zoneTop = ch * (1 - MONOGRAM_ZONE_HEIGHT_RATIO);
  const zoneH   = ch * MONOGRAM_ZONE_HEIGHT_RATIO;
  const centerX = cw / 2;
  const padding = cw * PADDING_RATIO;
  const maxW    = cw - padding * 2;

  const maxLine1Size = Math.floor(zoneH * 0.38);
  const maxLine2Size = Math.floor(zoneH * 0.22);

  let size1 = line1 ? fitFontSize(ctx, line1, font, maxW, maxLine1Size) : 0;
  let size2 = line2 ? fitFontSize(ctx, line2, font, maxW, maxLine2Size) : 0;

  const flourishObj = FLOURISH_STYLES.find(f => f.id === MonogramState.flourishStyle) || FLOURISH_STYLES[0];
  const hasFlourish = flourishObj.id !== 'none';
  const flourishH   = hasFlourish ? zoneH * 0.07 : 0;
  const lineGap     = zoneH * 0.06;

  const totalH = (line1 ? size1 : 0)
               + (line2 ? size2 + lineGap : 0)
               + (hasFlourish ? flourishH * 2 + lineGap * 2 : 0);

  let cursor = zoneTop + (zoneH - totalH) / 2;

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle    = tColor;

  if (hasFlourish) {
    flourishObj.draw(ctx, centerX, cursor + flourishH / 2, maxW * 0.72, tColor);
    cursor += flourishH + lineGap;
  }

  if (line1) {
    ctx.font = `${size1}px "${font}"`;
    ctx.fillStyle = tColor;
    ctx.fillText(line1, centerX, cursor + size1 * 0.85);
    cursor += size1 + lineGap;
  }

  if (line2) {
    ctx.font = `${size2}px "${font}"`;
    ctx.fillStyle = tColor;
    ctx.fillText(line2, centerX, cursor + size2 * 0.85);
    cursor += size2 + lineGap;
  }

  if (hasFlourish) {
    flourishObj.draw(ctx, centerX, cursor + flourishH / 2, maxW * 0.72, tColor);
  }

  renderPrintMock();
}

/* ================================================================
   RENDER PRINT MOCK — shows monogram on a print layout preview
================================================================ */
function renderPrintMock() {
  const mock = MonogramState.mockCanvas;
  if (!mock) return;

  const printSize = MonogramState.printSize;
  const spec      = CANVAS_SPECS[printSize];

  // Display at a large size so clients can clearly see the print
  const displayW = printSize === '4x6' ? 460 : 240;
  const displayH = Math.round(displayW * spec.h / spec.w);

  mock.width  = displayW;
  mock.height = displayH;
  mock.style.width  = displayW + 'px';
  mock.style.height = displayH + 'px';

  const ctx  = mock.getContext('2d');
  const mw   = displayW;
  const mh   = displayH;

  // Background: backdrop tint or neutral
  const bgColor = MonogramState.backdropColor || '#2a2a3e';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, mw, mh);

  // Photo placeholder areas
  ctx.fillStyle   = 'rgba(255,255,255,0.07)';
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1;

  const monoZoneH = Math.round(mh * MONOGRAM_ZONE_HEIGHT_RATIO);
  const photoAreaH = mh - monoZoneH;

  if (printSize === '4x6') {
    // Two photo areas side by side
    const pw = Math.floor(mw / 2) - 2;
    const ph = photoAreaH - 4;
    ctx.fillRect(2,      2, pw, ph);
    ctx.strokeRect(2,    2, pw, ph);
    ctx.fillRect(pw + 4, 2, pw, ph);
    ctx.strokeRect(pw + 4, 2, pw, ph);

    // Photo icon hints
    drawPhotoIcon(ctx, 2 + pw/2,    2 + ph/2,    pw * 0.2);
    drawPhotoIcon(ctx, pw + 4 + pw/2, 2 + ph/2,  pw * 0.2);
  } else {
    // 2x6: three stacked photo areas
    const ph = Math.floor(photoAreaH / 3) - 2;
    for (let i = 0; i < 3; i++) {
      const py = 2 + i * (ph + 2);
      ctx.fillRect(2, py, mw - 4, ph);
      ctx.strokeRect(2, py, mw - 4, ph);
      drawPhotoIcon(ctx, mw / 2, py + ph / 2, ph * 0.25);
    }
  }

  // Monogram strip at bottom
  const monoY  = mh - monoZoneH;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, monoY, mw, monoZoneH);

  // Draw the monogram content scaled into the strip
  const monoCanvas = MonogramState.canvas;
  if (monoCanvas && monoCanvas.width > 0) {
    const srcSpec  = CANVAS_SPECS[printSize];
    const srcZoneY = srcSpec.h * (1 - MONOGRAM_ZONE_HEIGHT_RATIO);
    const srcZoneH = srcSpec.h * MONOGRAM_ZONE_HEIGHT_RATIO;

    ctx.drawImage(
      monoCanvas,
      0, srcZoneY, srcSpec.w, srcZoneH,    // source: just the monogram zone
      0, monoY,    mw,        monoZoneH    // dest: bottom strip of mock
    );
  } else {
    // Placeholder text
    ctx.fillStyle    = 'rgba(255,255,255,0.2)';
    ctx.font         = `${Math.floor(monoZoneH * 0.22)}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Monogram', mw / 2, monoY + monoZoneH / 2);
  }

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(0.5, 0.5, mw - 1, mh - 1);
}

function drawPhotoIcon(ctx, cx, cy, size) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = Math.max(0.5, size * 0.07);

  // Simple camera-like icon
  const hw = size * 0.7;
  const hh = size * 0.5;
  ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/* ================================================================
   FLOURISH PICKER — draw preview canvases
================================================================ */
function initFlourishPicker() {
  const grid = document.getElementById('flourish-picker-grid');
  if (!grid) return;

  grid.innerHTML = '';

  FLOURISH_STYLES.forEach(style => {
    const option = document.createElement('div');
    option.className  = 'flourish-option';
    option.dataset.id = style.id;
    if (style.id === MonogramState.flourishStyle) option.classList.add('selected');

    const previewCanvas  = document.createElement('canvas');
    previewCanvas.width  = 160;
    previewCanvas.height = 48;
    previewCanvas.style.width  = '100%';
    previewCanvas.style.display = 'block';

    // Draw flourish preview
    const pctx = previewCanvas.getContext('2d');
    pctx.clearRect(0, 0, 160, 48);

    if (style.id !== 'none') {
      style.draw(pctx, 80, 24, 140, '#c9a84c');
    } else {
      pctx.fillStyle    = 'rgba(200,200,200,0.2)';
      pctx.font         = '10px sans-serif';
      pctx.textAlign    = 'center';
      pctx.textBaseline = 'middle';
      pctx.fillText('— no flourish —', 80, 24);
    }

    const label       = document.createElement('div');
    label.className   = 'flourish-option-label';
    label.textContent = style.name;

    option.appendChild(previewCanvas);
    option.appendChild(label);
    grid.appendChild(option);

    option.addEventListener('click', () => {
      grid.querySelectorAll('.flourish-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      MonogramState.flourishStyle = style.id;
      scheduleRender();
    });
  });
}

/* ================================================================
   DEBOUNCED RENDER
================================================================ */
let _renderTimer = null;

function scheduleRender() {
  clearTimeout(_renderTimer);
  _renderTimer = setTimeout(renderMonogram, 60);
}

/* ================================================================
   EXPORT
================================================================ */
function exportMonogramPNG() {
  return new Promise((resolve) => {
    MonogramState.canvas.toBlob(resolve, 'image/png');
  });
}

function exportMonogramDataURL() {
  return MonogramState.canvas.toDataURL('image/png');
}

/* ================================================================
   INIT
================================================================ */
async function initMonogramBuilder() {
  populateFontSelect();

  // Create main canvas
  const outer = document.getElementById('canvas-outer');
  if (!outer) return;

  const canvas     = document.createElement('canvas');
  const spec       = CANVAS_SPECS['4x6'];
  canvas.width     = spec.w;
  canvas.height    = spec.h;
  canvas.style.maxWidth  = '100%';
  canvas.style.maxHeight = '380px';
  canvas.style.display   = 'block';
  outer.innerHTML  = '';
  outer.appendChild(canvas);
  MonogramState.canvas = canvas;

  // Create mock canvas
  const mockWrap = document.getElementById('print-mock-canvas-wrap');
  if (mockWrap) {
    const mock       = document.createElement('canvas');
    mock.id          = 'print-mock-canvas';
    mock.style.borderRadius = '4px';
    mockWrap.innerHTML = '';
    mockWrap.appendChild(mock);
    MonogramState.mockCanvas = mock;
  }

  // Init flourish picker
  initFlourishPicker();

  // Load initial font and render
  await loadGoogleFont(MonogramState.fontFamily);
  renderMonogram();

  /* ---- Wire up controls ---- */

  const line1Input  = document.getElementById('mono-line1');
  const line2Input  = document.getElementById('mono-line2');
  const fontSel     = document.getElementById('mono-font');
  const fontPreview = document.getElementById('font-preview-strip');

  if (line1Input) {
    line1Input.addEventListener('input', () => {
      MonogramState.line1 = line1Input.value;
      if (fontPreview) fontPreview.textContent = line1Input.value || 'Font Preview';
      scheduleRender();
    });
  }

  if (line2Input) {
    line2Input.addEventListener('input', () => {
      MonogramState.line2 = line2Input.value;
      scheduleRender();
    });
  }

  if (fontSel) {
    fontSel.addEventListener('change', async () => {
      const family = fontSel.value;
      MonogramState.fontFamily = family;
      if (fontPreview) {
        fontPreview.style.fontFamily = `"${family}", serif`;
        fontPreview.textContent = line1Input?.value || 'Font Preview';
      }
      await loadGoogleFont(family);
      renderMonogram();
    });
  }

  const textColorInput = document.getElementById('mono-text-color');
  const textColorHex   = document.getElementById('mono-text-color-hex');
  if (textColorInput) {
    textColorInput.addEventListener('input', () => {
      MonogramState.textColor = textColorInput.value;
      if (textColorHex) textColorHex.textContent = textColorInput.value;
      scheduleRender();
    });
  }

  const dlBtn = document.getElementById('btn-download-preview');
  if (dlBtn) {
    dlBtn.addEventListener('click', async () => {
      const blob  = await exportMonogramPNG();
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      const event = new URLSearchParams(window.location.search).get('event') || 'monogram';
      a.href     = url;
      a.download = `${event}-monogram-${MonogramState.printSize}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (fontPreview) {
    fontPreview.style.fontFamily = `"${MonogramState.fontFamily}", serif`;
    fontPreview.textContent      = 'Font Preview';
  }
}

/* ================================================================
   PUBLIC HOOKS — called from app.js
================================================================ */
function updateMonogramPrintSize(size) {
  MonogramState.printSize = size;
  renderMonogram();
}

function updateMonogramBackdropColor(backdropName) {
  MonogramState.backdropColor = BACKDROP_COLORS[backdropName] || null;
  renderPrintMock();
}

/* ================================================================
   EXPOSE PUBLIC API
================================================================ */
window.MonogramBuilder = {
  init:                 initMonogramBuilder,
  render:               renderMonogram,
  updatePrintSize:      updateMonogramPrintSize,
  updateBackdropColor:  updateMonogramBackdropColor,
  exportPNG:            exportMonogramPNG,
  exportDataURL:        exportMonogramDataURL,
  state:                MonogramState,
  fonts:                MONOGRAM_FONTS,
  flourishStyles:       FLOURISH_STYLES,
};
