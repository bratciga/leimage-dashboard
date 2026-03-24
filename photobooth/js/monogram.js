/**
 * monogram.js — Le Image Photo Booth Monogram Builder
 *
 * Handles:
 *  - Font list definition and dynamic Google Fonts loading
 *  - HTML5 Canvas rendering (live preview + full-res export)
 *  - Auto-scaling text to fit the canvas
 *  - Optional decorative flourish lines above/below text
 *
 * Canvas specs:
 *  - 2×6 strip:  1240 × 1844 px  (portrait)
 *  - 4×6 print:  1844 × 1240 px  (landscape)
 *
 * The monogram block occupies the bottom ~30% of the canvas,
 * centered horizontally.
 */

'use strict';

/* ================================================================
   FONT LIST
   Add/remove fonts here. Each entry:
     name:     Display name in the dropdown
     family:   CSS font-family value (must match Google Fonts URL)
     url:      Google Fonts CSS2 URL (generated automatically below)
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

/* The monogram block occupies the bottom N% of the canvas */
const MONOGRAM_ZONE_HEIGHT_RATIO = 0.28;

/* Horizontal padding as fraction of canvas width */
const PADDING_RATIO = 0.06;

/* ================================================================
   STATE
   Shared with app.js through window.MonogramBuilder
================================================================ */
const MonogramState = {
  line1:       '',
  line2:       '',
  fontFamily:  MONOGRAM_FONTS[0].family,
  textColor:   '#ffffff',
  bgColor:     '#000000',
  bgTransparent: true,
  flourish:    true,
  printSize:   '4x6',   // updated by app.js when print size changes
  canvas:      null,    // the <canvas> element
};

/* Track which fonts have been loaded so we don't re-inject links */
const _loadedFonts = new Set();

/* ================================================================
   FONT LOADING
================================================================ */

/**
 * Dynamically inject a Google Fonts stylesheet for the given family.
 * Uses document.fonts.ready to know when it's safe to re-render.
 */
function loadGoogleFont(family) {
  if (_loadedFonts.has(family)) return Promise.resolve();

  return new Promise((resolve) => {
    const encoded = encodeURIComponent(family);
    const href    = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`;

    // Check if link already in DOM (e.g. loaded by index.html)
    if (document.querySelector(`link[href="${href}"]`)) {
      _loadedFonts.add(family);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel   = 'stylesheet';
    link.href  = href;
    link.onload = () => {
      _loadedFonts.add(family);
      // Give browser a moment to parse & apply
      document.fonts.ready.then(resolve);
    };
    link.onerror = () => {
      console.warn(`[Monogram] Failed to load font: ${family}`);
      resolve(); // don't block on error
    };
    document.head.appendChild(link);
  });
}

/* ================================================================
   SELECT POPULATION
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
   CANVAS RENDERING
================================================================ */

/**
 * Calculates the largest font size where the given text fits within
 * maxWidth pixels using the canvas 2d context.
 */
function fitFontSize(ctx, text, fontFamily, maxWidth, maxSize, minSize = 16) {
  let size = maxSize;
  ctx.font = `${size}px "${fontFamily}"`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px "${fontFamily}"`;
  }
  return size;
}

/**
 * Draw a simple horizontal flourish line with center ornament.
 * x, y = center point of the flourish line
 */
function drawFlourish(ctx, x, y, width, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;

  const hw = width / 2;
  const gap = width * 0.08; // gap around center diamond

  ctx.lineWidth = Math.max(1, width * 0.002);
  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x - gap, y);
  ctx.moveTo(x + gap, y);
  ctx.lineTo(x + hw, y);
  ctx.stroke();

  // Center diamond
  const d = width * 0.018;
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - d);
  ctx.lineTo(x + d, y);
  ctx.lineTo(x, y + d);
  ctx.lineTo(x - d, y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Main render function. Draws onto MonogramState.canvas.
 */
async function renderMonogram() {
  const canvas = MonogramState.canvas;
  if (!canvas) return;

  const spec   = CANVAS_SPECS[MonogramState.printSize] || CANVAS_SPECS['4x6'];
  const cw     = spec.w;
  const ch     = spec.h;

  // Resize canvas if print size changed
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width  = cw;
    canvas.height = ch;
  }

  const ctx    = canvas.getContext('2d');
  const font   = MonogramState.fontFamily;
  const line1  = MonogramState.line1.trim();
  const line2  = MonogramState.line2.trim();
  const tColor = MonogramState.textColor;

  /* ---- Background ---- */
  ctx.clearRect(0, 0, cw, ch);

  if (!MonogramState.bgTransparent) {
    ctx.fillStyle = MonogramState.bgColor;
    ctx.fillRect(0, 0, cw, ch);
  }

  /* ---- Skip if no text ---- */
  if (!line1 && !line2) {
    // Draw a placeholder hint
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = `${Math.floor(ch * 0.025)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Enter text above to preview your monogram', cw / 2, ch / 2);
    return;
  }

  /* ---- Layout zone: bottom MONOGRAM_ZONE_HEIGHT_RATIO of canvas ---- */
  const zoneTop = ch * (1 - MONOGRAM_ZONE_HEIGHT_RATIO);
  const zoneH   = ch * MONOGRAM_ZONE_HEIGHT_RATIO;
  const zoneBot = ch;
  const centerX = cw / 2;
  const padding = cw * PADDING_RATIO;
  const maxW    = cw - padding * 2;

  /* ---- Size constraints per line ---- */
  const maxLine1Size = Math.floor(zoneH * 0.38);
  const maxLine2Size = Math.floor(zoneH * 0.22);

  /* ---- Measure line sizes ---- */
  let size1 = line1 ? fitFontSize(ctx, line1, font, maxW, maxLine1Size) : 0;
  let size2 = line2 ? fitFontSize(ctx, line2, font, maxW, maxLine2Size) : 0;

  /* ---- Vertical layout within zone ---- */
  const flourishH   = MonogramState.flourish ? zoneH * 0.06 : 0;
  const lineGap     = zoneH * 0.06;
  const totalH      = (line1 ? size1 : 0)
                    + (line2 ? size2 + lineGap : 0)
                    + (MonogramState.flourish ? flourishH * 2 + lineGap * 2 : 0);

  // Center the block within the zone
  let cursor = zoneTop + (zoneH - totalH) / 2;

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle    = tColor;

  if (MonogramState.flourish) {
    const fy = cursor + flourishH / 2;
    drawFlourish(ctx, centerX, fy, maxW * 0.7, tColor);
    cursor += flourishH + lineGap;
  }

  if (line1) {
    ctx.font = `${size1}px "${font}"`;
    ctx.fillText(line1, centerX, cursor + size1 * 0.85);
    cursor += size1 + lineGap;
  }

  if (line2) {
    ctx.font = `${size2}px "${font}"`;
    ctx.fillText(line2, centerX, cursor + size2 * 0.85);
    cursor += size2 + lineGap;
  }

  if (MonogramState.flourish) {
    const fy = cursor + flourishH / 2;
    drawFlourish(ctx, centerX, fy, maxW * 0.7, tColor);
  }
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

/**
 * Returns a Promise<Blob> of the full-resolution PNG.
 */
function exportMonogramPNG() {
  return new Promise((resolve) => {
    MonogramState.canvas.toBlob(resolve, 'image/png');
  });
}

/**
 * Returns the monogram as a base64 data URL (for storage).
 */
function exportMonogramDataURL() {
  return MonogramState.canvas.toDataURL('image/png');
}

/* ================================================================
   INIT — called by app.js after DOM ready
================================================================ */

async function initMonogramBuilder() {
  /* Populate font dropdown */
  populateFontSelect();

  /* Create canvas */
  const outer = document.getElementById('canvas-outer');
  if (!outer) return;

  const canvas = document.createElement('canvas');
  const spec   = CANVAS_SPECS['4x6'];
  canvas.width  = spec.w;
  canvas.height = spec.h;
  canvas.style.maxWidth  = '100%';
  canvas.style.maxHeight = '400px';
  canvas.style.display   = 'block';
  outer.appendChild(canvas);
  MonogramState.canvas = canvas;

  /* Load initial font */
  await loadGoogleFont(MonogramState.fontFamily);
  renderMonogram();

  /* ---- Wire up controls ---- */

  // Line 1
  const line1Input = document.getElementById('mono-line1');
  if (line1Input) {
    line1Input.addEventListener('input', () => {
      MonogramState.line1 = line1Input.value;
      scheduleRender();
    });
  }

  // Line 2
  const line2Input = document.getElementById('mono-line2');
  if (line2Input) {
    line2Input.addEventListener('input', () => {
      MonogramState.line2 = line2Input.value;
      scheduleRender();
    });
  }

  // Font selector
  const fontSel = document.getElementById('mono-font');
  const fontPreview = document.getElementById('font-preview-strip');
  if (fontSel) {
    fontSel.addEventListener('change', async () => {
      const family = fontSel.value;
      MonogramState.fontFamily = family;

      // Update preview strip
      if (fontPreview) {
        fontPreview.style.fontFamily = `"${family}", serif`;
        fontPreview.textContent = line1Input?.value || family;
      }

      await loadGoogleFont(family);
      renderMonogram();
    });
  }

  // Text color
  const textColorInput = document.getElementById('mono-text-color');
  const textColorHex   = document.getElementById('mono-text-color-hex');
  if (textColorInput) {
    textColorInput.addEventListener('input', () => {
      MonogramState.textColor = textColorInput.value;
      if (textColorHex) textColorHex.textContent = textColorInput.value;
      scheduleRender();
    });
  }

  // Background color
  const bgColorInput  = document.getElementById('mono-bg-color');
  const bgColorHex    = document.getElementById('mono-bg-color-hex');
  const bgTransparent = document.getElementById('mono-bg-transparent');

  if (bgColorInput) {
    bgColorInput.addEventListener('input', () => {
      MonogramState.bgColor = bgColorInput.value;
      if (bgColorHex) bgColorHex.textContent = bgColorInput.value;
      scheduleRender();
    });
  }

  if (bgTransparent) {
    bgTransparent.addEventListener('change', () => {
      MonogramState.bgTransparent = bgTransparent.checked;
      if (bgColorInput) bgColorInput.disabled = bgTransparent.checked;
      scheduleRender();
    });
    // Sync initial state
    if (bgColorInput) bgColorInput.disabled = bgTransparent.checked;
  }

  // Flourish toggle
  const flourishToggle = document.getElementById('mono-flourish');
  if (flourishToggle) {
    flourishToggle.addEventListener('change', () => {
      MonogramState.flourish = flourishToggle.checked;
      scheduleRender();
    });
  }

  // Download preview button
  const dlBtn = document.getElementById('btn-download-preview');
  if (dlBtn) {
    dlBtn.addEventListener('click', async () => {
      const blob = await exportMonogramPNG();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const event = new URLSearchParams(window.location.search).get('event') || 'monogram';
      a.href     = url;
      a.download = `${event}-monogram-preview.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Font preview strip initial font
  if (fontPreview) {
    fontPreview.style.fontFamily = `"${MonogramState.fontFamily}", serif`;
    fontPreview.textContent = 'Font Preview';
  }
}

/* ================================================================
   PRINT SIZE CHANGE HOOK
   Called from app.js when user picks a print size
================================================================ */
function updateMonogramPrintSize(size) {
  MonogramState.printSize = size;
  renderMonogram();
}

/* ================================================================
   EXPOSE PUBLIC API
================================================================ */
window.MonogramBuilder = {
  init:              initMonogramBuilder,
  render:            renderMonogram,
  updatePrintSize:   updateMonogramPrintSize,
  exportPNG:         exportMonogramPNG,
  exportDataURL:     exportMonogramDataURL,
  state:             MonogramState,
  fonts:             MONOGRAM_FONTS,
};
