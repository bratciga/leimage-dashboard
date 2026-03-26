/**
 * monogram.js — Le Image Photo Booth Monogram Builder
 *
 * Features:
 *  - 38 Google Fonts sorted alphabetically
 *  - Dual color pickers (linked by default) for names + date
 *  - Per-field font selection (linked by default)
 *  - Font size controls (auto-fit or manual)
 *  - Text X/Y offset controls
 *  - Frame scale + X/Y offset controls
 *  - 24 SVG frame templates (from frames.js)
 *  - Live canvas preview (always transparent background)
 *  - Realistic print mock with sample photos
 *  - 2×6 export: doubled for 4×6 sheet (printer cuts in half)
 *  - Full-res transparent PNG export at 1650px wide
 *
 * Canvas specs:
 *  - 4×6 print: 1844 × 1240 px (landscape)
 *  - 2×6 strip: 1240 × 1844 px (portrait) — EXPORT is 1844×1240 doubled
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
  '4x6': { w: 1200, h: 800 },
  '2x6': { w: 1200, h: 800 },
};

const MONOGRAM_ZONE_HEIGHT_RATIO = 0.96;
const PADDING_RATIO = 0.02;
// How much of the final PRINT the monogram strip occupies (bottom portion)
const PRINT_STRIP_RATIO = 0.18;

/* ================================================================
   STATE
================================================================ */
const MonogramState = {
  line1:          '',
  line2:          '',
  // Legacy single font (kept for backward compat)
  fontFamily:     MONOGRAM_FONTS[0].family,
  // Per-field fonts
  fontFamily1:    MONOGRAM_FONTS[0].family,
  fontFamily2:    MONOGRAM_FONTS[0].family,
  fontsLinked:    true,
  // Colors
  textColor1:     '#333333',
  textColor2:     '#333333',
  colorsLinked:   true,
  // Font sizes (0 = auto-fit)
  fontSize1:      0,
  fontSize2:      0,
  // Text offsets
  offsetX1:       0,
  offsetY1:       0,
  offsetX2:       0,
  offsetY2:       0,
  // Frame
  flourish:       'none',   // kept for backward compat
  frame:          'none',
  frameColor:     '#333333', // defaults to text color
  // Frame transform
  frameScale:     1.0,
  frameOffsetX:   0,
  frameOffsetY:   0,
  // Print
  printSize:      '4x6',
  // Canvas refs
  canvas:         null,
  mockCanvas:     null,
  backdropColor:  null,
};

const _defaultMonogramState = {
  line1:          '',
  line2:          '',
  fontFamily:     MONOGRAM_FONTS[0].family,
  fontFamily1:    MONOGRAM_FONTS[0].family,
  fontFamily2:    MONOGRAM_FONTS[0].family,
  fontsLinked:    true,
  textColor1:     '#333333',
  textColor2:     '#333333',
  colorsLinked:   true,
  fontSize1:      0,
  fontSize2:      0,
  offsetX1:       0,
  offsetY1:       0,
  offsetX2:       0,
  offsetY2:       0,
  flourish:       'none',
  frame:          'none',
  frameColor:     '#333333',
  frameScale:     1.0,
  frameOffsetX:   0,
  frameOffsetY:   0,
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
   FONT PICKER — builds per-field font selects
================================================================ */
function _buildFontSelectEl(selectId, previewId, fieldIndex) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '';
  MONOGRAM_FONTS.forEach((f, i) => {
    const opt = document.createElement('option');
    opt.value = f.family;
    opt.textContent = f.name;
    opt.style.fontFamily = `"${f.family}", serif`;
    if (i === 0) opt.selected = true;
    sel.appendChild(opt);
  });

  sel.addEventListener('change', async () => {
    const family = sel.value;
    if (fieldIndex === 1) {
      MonogramState.fontFamily1 = family;
      MonogramState.fontFamily = family;
      if (MonogramState.fontsLinked) {
        MonogramState.fontFamily2 = family;
        const sel2 = document.getElementById('mono-font2');
        if (sel2) sel2.value = family;
      }
    } else {
      MonogramState.fontFamily2 = family;
      if (MonogramState.fontsLinked) {
        MonogramState.fontFamily1 = family;
        MonogramState.fontFamily = family;
        const sel1 = document.getElementById('mono-font1');
        if (sel1) sel1.value = family;
      }
    }
    const strip = document.getElementById(previewId);
    const line1Input = document.getElementById('mono-line1');
    if (strip) {
      strip.style.fontFamily = `"${family}", serif`;
      strip.textContent = line1Input?.value || family;
    }
    await loadGoogleFont(family);
    await renderMonogram();
  });
}

function buildFontPicker() {
  // Legacy single picker
  const sel = document.getElementById('mono-font');
  if (sel) {
    sel.innerHTML = '';
    MONOGRAM_FONTS.forEach((f, i) => {
      const opt = document.createElement('option');
      opt.value = f.family;
      opt.textContent = f.name;
      opt.style.fontFamily = `"${f.family}", serif`;
      if (i === 0) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', async () => {
      const family = sel.value;
      MonogramState.fontFamily = family;
      MonogramState.fontFamily1 = family;
      if (MonogramState.fontsLinked) MonogramState.fontFamily2 = family;
      const strip = document.getElementById('font-preview-strip');
      const line1Input = document.getElementById('mono-line1');
      if (strip) {
        strip.style.fontFamily = `"${family}", serif`;
        strip.textContent = line1Input?.value || family;
      }
      await loadGoogleFont(family);
      await renderMonogram();
    });
  }

  // Per-field pickers
  _buildFontSelectEl('mono-font1', 'font-preview-strip', 1);
  _buildFontSelectEl('mono-font2', 'font-preview-strip2', 2);

  // Pre-load all fonts in background (non-blocking)
  setTimeout(() => {
    MONOGRAM_FONTS.forEach(f => loadGoogleFont(f.family));
  }, 500);
}

function populateFontSelect() {
  buildFontPicker();
}

/* ================================================================
   FRAME PICKER — render preview cards grouped by category
================================================================ */

const FRAME_CATEGORY_LABELS = {
  botanical: 'Botanical',
  simple:    'Simple',
  elegant:   'Elegant',
  classic:   'Classic',
  geometric: 'Geometric',
  ornate:    'Ornate',
  nature:    'Nature',
  romantic:  'Romantic',
  royal:     'Royal',
  divider:   'Line Dividers',
  monogram:  'Monogram Frames',
};

function updateFramePreviewColors() {
  const color = MonogramState.frameColor;
  const grid = document.getElementById('flourish-picker-grid');
  if (!grid) return;

  grid.querySelectorAll('.frame-option').forEach(card => {
    const frameId = card.dataset.frame;
    const templates = window.FrameTemplates ? window.FrameTemplates.templates : [];
    const tpl = templates.find(f => f.id === frameId);
    if (!tpl) return;

    const svgEl = card.querySelector('.frame-preview-svg');
    if (!svgEl) return;

    if (tpl.svg) {
      const colored = tpl.svg.split('FRAME_COLOR').join(color);
      svgEl.innerHTML = colored;
      const svgTag = svgEl.querySelector('svg');
      if (svgTag) {
        svgTag.setAttribute('width', '100%');
        svgTag.setAttribute('height', '100%');
        svgTag.style.display = 'block';
      }
    } else if (tpl.svgFile && window.FrameTemplates.fetchSvgText) {
      window.FrameTemplates.fetchSvgText(tpl.svgFile).then(text => {
        if (!text) return;
        let colored;
        if (text.includes('FRAME_COLOR')) {
          colored = text.split('FRAME_COLOR').join(color);
        } else {
          colored = text.replace(/<svg([^>]*)>/, (match, attrs) => {
            if (/fill=/.test(attrs)) return match;
            return `<svg${attrs} fill="${color}">`;
          });
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(colored, 'image/svg+xml');
        const svgTag = doc.querySelector('svg');
        if (svgTag) {
          svgTag.setAttribute('width', '100%');
          svgTag.setAttribute('height', '100%');
          svgTag.style.display = 'block';
          svgEl.innerHTML = svgTag.outerHTML;
        }
      });
    }
  });
}

function initFramePicker() {
  const grid = document.getElementById('flourish-picker-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const PREVIEW_COLOR = MonogramState.frameColor;
  const templates = window.FrameTemplates ? window.FrameTemplates.templates : [];

  // ---- Frame Color Selector ----
  const colorRow = document.createElement('div');
  colorRow.className = 'frame-color-selector';

  const colorLabel = document.createElement('span');
  colorLabel.className = 'frame-color-label';
  colorLabel.textContent = 'Frame Color';
  colorRow.appendChild(colorLabel);

  const swatchWrap = document.createElement('div');
  swatchWrap.className = 'frame-color-swatches';

  const presets = [
    { name: 'Gold', color: '#c9a84c' },
    { name: 'Rose', color: '#b76e79' },
  ];

  presets.forEach(preset => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'frame-color-swatch' + (MonogramState.frameColor === preset.color ? ' active' : '');
    swatch.style.backgroundColor = preset.color;
    swatch.title = preset.name;
    swatch.dataset.color = preset.color;

    const swatchLabel = document.createElement('span');
    swatchLabel.className = 'frame-color-swatch-label';
    swatchLabel.textContent = preset.name;

    const swatchGroup = document.createElement('div');
    swatchGroup.className = 'frame-color-swatch-group';
    swatchGroup.appendChild(swatch);
    swatchGroup.appendChild(swatchLabel);
    swatchWrap.appendChild(swatchGroup);

    swatch.addEventListener('click', () => {
      MonogramState.frameColor = preset.color;
      window.FrameTemplates.clearCache();
      colorRow.querySelectorAll('.frame-color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      customInput.value = preset.color;
      customHex.textContent = preset.color;
      updateFramePreviewColors();
      renderMonogram();
    });
  });

  // Custom color picker
  const customGroup = document.createElement('div');
  customGroup.className = 'frame-color-swatch-group';

  const customInput = document.createElement('input');
  customInput.type = 'color';
  customInput.className = 'frame-color-custom';
  customInput.value = MonogramState.frameColor;
  customInput.title = 'Custom color';

  const customHex = document.createElement('span');
  customHex.className = 'frame-color-swatch-label frame-color-hex';
  customHex.textContent = MonogramState.frameColor;

  customInput.addEventListener('input', () => {
    MonogramState.frameColor = customInput.value;
    window.FrameTemplates.clearCache();
    colorRow.querySelectorAll('.frame-color-swatch').forEach(s => s.classList.remove('active'));
    customHex.textContent = customInput.value;
    updateFramePreviewColors();
    renderMonogram();
  });

  customGroup.appendChild(customInput);
  customGroup.appendChild(customHex);
  swatchWrap.appendChild(customGroup);

  // Eyedropper button
  const eyedropperGroup = document.createElement('div');
  eyedropperGroup.className = 'frame-color-swatch-group';

  const eyedropperBtn = document.createElement('button');
  eyedropperBtn.type = 'button';
  eyedropperBtn.className = 'frame-color-eyedropper';
  eyedropperBtn.title = 'Pick color from screen';
  eyedropperBtn.innerHTML = '🎨';

  const eyedropperLabel = document.createElement('span');
  eyedropperLabel.className = 'frame-color-swatch-label';
  eyedropperLabel.textContent = 'Pick';

  eyedropperBtn.addEventListener('click', async () => {
    if (window.EyeDropper) {
      try {
        const dropper = new EyeDropper();
        const result = await dropper.open();
        const pickedColor = result.sRGBHex;
        MonogramState.frameColor = pickedColor;
        window.FrameTemplates.clearCache();
        colorRow.querySelectorAll('.frame-color-swatch').forEach(s => s.classList.remove('active'));
        customInput.value = pickedColor;
        customHex.textContent = pickedColor;
        updateFramePreviewColors();
        renderMonogram();
      } catch (e) {
        // User cancelled
      }
    } else {
      customInput.click();
    }
  });

  eyedropperGroup.appendChild(eyedropperBtn);
  eyedropperGroup.appendChild(eyedropperLabel);
  swatchWrap.appendChild(eyedropperGroup);

  colorRow.appendChild(swatchWrap);

  // Add scale slider to the color row (shares sticky positioning)
  const scaleWrap = document.createElement('div');
  scaleWrap.style.cssText = 'display:flex;align-items:center;gap:0.4rem;margin-left:auto;white-space:nowrap;';
  const scaleLabel = document.createElement('span');
  scaleLabel.className = 'frame-color-label';
  scaleLabel.textContent = 'Scale';
  const scaleRange = document.createElement('input');
  scaleRange.type = 'range'; scaleRange.id = 'mono-frame-scale';
  scaleRange.className = 'range-input';
  scaleRange.min = '0.5'; scaleRange.max = '2.0'; scaleRange.step = '0.05'; scaleRange.value = '1.0';
  scaleRange.style.width = '80px';
  const scaleVal = document.createElement('span');
  scaleVal.id = 'mono-frame-scale-val';
  scaleVal.className = 'range-val';
  scaleVal.textContent = '1.00x';
  scaleVal.style.fontSize = '0.7rem';
  scaleWrap.appendChild(scaleLabel);
  scaleWrap.appendChild(scaleRange);
  scaleWrap.appendChild(scaleVal);
  colorRow.appendChild(scaleWrap);

  grid.appendChild(colorRow);

  // Group templates by category preserving order of first appearance
  const categoryOrder = [];
  const byCategory = {};
  templates.forEach(template => {
    const cat = template.category || 'simple';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
      categoryOrder.push(cat);
    }
    byCategory[cat].push(template);
  });

  categoryOrder.forEach(cat => {
    // Skip heading for 'simple' category (only "None" left)
    if (cat !== 'simple') {
      const heading = document.createElement('div');
      heading.className = 'frame-category-label';
      heading.textContent = FRAME_CATEGORY_LABELS[cat] || cat;
      grid.appendChild(heading);
    }

    const catGrid = document.createElement('div');
    catGrid.className = 'frame-category-grid';
    grid.appendChild(catGrid);

    byCategory[cat].forEach(template => {
      const isSelected = template.id === MonogramState.frame;

      const card = document.createElement('div');
      card.className = 'flourish-option frame-option' + (isSelected ? ' selected' : '');
      card.dataset.frame = template.id;

      const isBotanical = template.category === 'botanical';
      const previewWrap = document.createElement('div');
      previewWrap.className = 'frame-preview-inner' + (isBotanical ? ' botanical-frame-preview' : '');

      if (template.svg) {
        const colored = template.svg.split('FRAME_COLOR').join(PREVIEW_COLOR);
        const svgEl = document.createElement('div');
        svgEl.className = 'frame-preview-svg';
        svgEl.innerHTML = colored;
        const svgTag = svgEl.querySelector('svg');
        if (svgTag) {
          svgTag.setAttribute('width', '100%');
          svgTag.setAttribute('height', '100%');
          svgTag.style.display = 'block';
        }
        previewWrap.appendChild(svgEl);
      } else if (template.svgFile) {
        const svgEl = document.createElement('div');
        svgEl.className = 'frame-preview-svg botanical-preview-loading';
        svgEl.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
        const placeholder = document.createElement('span');
        placeholder.textContent = '✿';
        placeholder.style.cssText = 'color:var(--gold-dim);font-size:1.1rem;';
        svgEl.appendChild(placeholder);
        previewWrap.appendChild(svgEl);

        if (window.FrameTemplates && window.FrameTemplates.fetchSvgText) {
          window.FrameTemplates.fetchSvgText(template.svgFile).then(text => {
            if (!text) return;
            let colored;
            if (text.includes('FRAME_COLOR')) {
              colored = text.split('FRAME_COLOR').join(PREVIEW_COLOR);
            } else {
              colored = text.replace(/<svg([^>]*)>/, (match, attrs) => {
                if (/fill=/.test(attrs)) return match;
                return `<svg${attrs} fill="${PREVIEW_COLOR}">`;
              });
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(colored, 'image/svg+xml');
            const svgTag = doc.querySelector('svg');
            if (svgTag) {
              svgTag.setAttribute('width', '100%');
              svgTag.setAttribute('height', '100%');
              svgTag.style.display = 'block';
              svgEl.innerHTML = svgTag.outerHTML;
              svgEl.classList.remove('botanical-preview-loading');
            }
          });
        }
      } else {
        previewWrap.classList.add('frame-preview-none');
        const noText = document.createElement('span');
        noText.textContent = '—';
        noText.style.cssText = 'font-size:1.4rem;color:rgba(255,255,255,0.3);line-height:1';
        previewWrap.appendChild(noText);
      }

      const label = document.createElement('span');
      label.className = 'flourish-option-label';
      label.textContent = template.name;

      card.appendChild(previewWrap);
      card.appendChild(label);
      catGrid.appendChild(card);

      card.addEventListener('click', () => {
        grid.querySelectorAll('.frame-option').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        MonogramState.frame = template.id;
        MonogramState.flourish = template.id;
        renderMonogram();
      });
    });
  });
}

const initFlourishPicker = initFramePicker;

/* ================================================================
   CANVAS RENDERING HELPERS
================================================================ */
function fitFontSize(ctx, text, fontFamily, maxWidth, maxSize, minSize = 16) {
  const lines = text.split('\n');
  const longest = lines.reduce((a, b) => a.length >= b.length ? a : b, '');
  let size = maxSize;
  ctx.font = `${size}px "${fontFamily}"`;
  while (size > minSize && ctx.measureText(longest).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px "${fontFamily}"`;
  }
  return size;
}

/**
 * Draw monogram text + optional SVG frame onto a canvas context.
 */
async function drawMonogramContent(ctx, spec, state, transparent = false) {
  if (!transparent) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, spec.w, spec.h);
  } else {
    ctx.clearRect(0, 0, spec.w, spec.h);
  }

  const font1   = state.fontFamily1 || state.fontFamily || MONOGRAM_FONTS[0].family;
  const font2   = state.fontFamily2 || state.fontFamily || MONOGRAM_FONTS[0].family;
  const line1   = state.line1.trim();
  const line2   = state.line2.trim();
  const color1  = state.textColor1;
  const color2  = state.textColor2;
  const frameId = state.frame || state.flourish || 'none';
  const fScale  = (state.frameScale != null && state.frameScale > 0) ? state.frameScale : 1.0;
  const fOffX   = state.frameOffsetX || 0;
  const fOffY   = state.frameOffsetY || 0;

  if (!line1 && !line2) {
    if (!transparent) {
      ctx.fillStyle = 'rgba(100,100,100,0.3)';
      ctx.font = `${Math.floor(spec.h * 0.025)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Enter text above to preview your monogram', spec.w / 2, spec.h / 2);
    }
    return;
  }

  const zoneH    = spec.h * MONOGRAM_ZONE_HEIGHT_RATIO;
  const zoneTop  = (spec.h - zoneH) / 2;
  const centerX  = spec.w / 2;
  const padding  = spec.w * PADDING_RATIO;
  const maxW     = spec.w - padding * 2;

  const templates = window.FrameTemplates ? window.FrameTemplates.templates : [];
  const frameTpl = templates.find(f => f.id === frameId) || templates.find(f => f.id === 'none');
  const hasFrame = frameTpl && (frameTpl.svg || frameTpl.svgFile);

  let textZoneW, textZoneH, textZoneTop, textZoneCenterX;

  if (hasFrame && frameTpl.textZone && frameTpl.viewBoxW && frameTpl.viewBoxH) {
    // Text zone is always calculated at scale 1.0 with no offset
    // so text stays fixed regardless of frame scale/position
    const tz = frameTpl.textZone;
    const vbAspect   = frameTpl.viewBoxW / frameTpl.viewBoxH;
    let drawW, drawH;
    if (vbAspect > spec.w / spec.h) {
      drawW = spec.w; drawH = spec.w / vbAspect;
    } else {
      drawH = spec.h; drawW = spec.h * vbAspect;
    }
    const drawX = centerX - drawW / 2;
    const drawY = (spec.h - drawH) / 2;

    const safeLeft   = drawX + drawW * tz.left;
    const safeRight  = drawX + drawW * tz.right;
    const safeTop    = drawY + drawH * tz.top;
    const safeBottom = drawY + drawH * tz.bottom;

    textZoneW = safeRight - safeLeft;
    textZoneH = safeBottom - safeTop;
    textZoneTop = safeTop;
    textZoneCenterX = safeLeft + textZoneW / 2;
  } else {
    const px = hasFrame ? (frameTpl.textPadding ? frameTpl.textPadding.x : 0.18) : 0.04;
    const py = hasFrame ? (frameTpl.textPadding ? frameTpl.textPadding.y : 0.18) : 0.04;
    textZoneW    = maxW * (1 - px * 2);
    textZoneH    = zoneH * (1 - py * 2);
    textZoneTop  = zoneTop + zoneH * py;
    textZoneCenterX = centerX;
  }

  const frameSizeReduction = hasFrame ? 0.80 : 1.0;
  const maxLine1Size = Math.floor(textZoneH * (line2 ? 0.46 : 0.60) * frameSizeReduction);
  const maxLine2Size = Math.floor(textZoneH * (line1 ? 0.34 : 0.60) * frameSizeReduction);

  // Font sizes: use manual if set (> 0), else auto-fit
  let size1 = 0;
  let size2 = 0;
  if (line1) {
    if (state.fontSize1 && state.fontSize1 > 0) {
      size1 = state.fontSize1;
    } else {
      size1 = fitFontSize(ctx, line1, font1, textZoneW, maxLine1Size);
    }
  }
  if (line2) {
    if (state.fontSize2 && state.fontSize2 > 0) {
      size2 = state.fontSize2;
    } else {
      size2 = fitFontSize(ctx, line2, font2, textZoneW, maxLine2Size);
    }
  }

  const lineGap = zoneH * 0.04;
  const totalTextH = (line1 ? size1 : 0) + (line2 ? size2 + lineGap : 0);

  // Draw frame first (behind text)
  if (hasFrame && window.FrameTemplates) {
    const frameImg = await window.FrameTemplates.getImage(frameId, state.frameColor || '#c9a84c');
    if (frameImg) {
      if (frameTpl.viewBoxW && frameTpl.viewBoxH) {
        const vbAspect   = frameTpl.viewBoxW / frameTpl.viewBoxH;
        const canvasMaxW = spec.w * fScale;
        const canvasMaxH = spec.h * fScale;
        let drawW, drawH;
        if (vbAspect > canvasMaxW / canvasMaxH) {
          drawW = canvasMaxW;
          drawH = canvasMaxW / vbAspect;
        } else {
          drawH = canvasMaxH;
          drawW = canvasMaxH * vbAspect;
        }
        const drawX = centerX - drawW / 2 + fOffX;
        const drawY = (spec.h - drawH) / 2 + fOffY;
        ctx.drawImage(frameImg, drawX, drawY, drawW, drawH);
      } else {
        const frameW = spec.w * fScale;
        const frameH = spec.h * fScale;
        const frameX = (spec.w - frameW) / 2 + fOffX;
        const frameY = (spec.h - frameH) / 2 + fOffY;
        ctx.drawImage(frameImg, frameX, frameY, frameW, frameH);
      }
    }
  }

  // Draw text centered in the text zone
  const textStartY = textZoneTop + (textZoneH - totalTextH) / 2;
  let cursor = textStartY;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (line1) {
    ctx.fillStyle = color1;
    const subLines1 = line1.split('\n');
    const sub1Size = subLines1.length > 1 ? Math.floor(size1 / subLines1.length * 1.2) : size1;
    ctx.font = `${sub1Size}px "${font1}"`;
    const cx1 = textZoneCenterX + (state.offsetX1 || 0);
    subLines1.forEach((sl, i) => {
      ctx.fillText(sl, cx1, cursor + sub1Size * 0.82 + i * sub1Size * 1.1 + (state.offsetY1 || 0));
    });
    cursor += (subLines1.length > 1 ? sub1Size * 1.1 * subLines1.length : size1) + lineGap;
  }

  if (line2) {
    ctx.fillStyle = color2;
    const subLines2 = line2.split('\n');
    const sub2Size = subLines2.length > 1 ? Math.floor(size2 / subLines2.length * 1.2) : size2;
    ctx.font = `${sub2Size}px "${font2}"`;
    const cx2 = textZoneCenterX + (state.offsetX2 || 0);
    subLines2.forEach((sl, i) => {
      ctx.fillText(sl, cx2, cursor + sub2Size * 0.82 + i * sub2Size * 1.1 + (state.offsetY2 || 0));
    });
  }
}

/* ================================================================
   CANVAS RENDERING
================================================================ */
async function renderMonogram() {
  const canvas = MonogramState.canvas;
  if (!canvas) return;

  const spec = CANVAS_SPECS[MonogramState.printSize] || CANVAS_SPECS['4x6'];
  if (canvas.width !== spec.w || canvas.height !== spec.h) {
    canvas.width  = spec.w;
    canvas.height = spec.h;
  }

  const ctx = canvas.getContext('2d');

  // Clip to the monogram zone (what actually shows in the print)
  // This prevents frames from appearing outside the printable area
  const clipTop = spec.h * (1 - MONOGRAM_ZONE_HEIGHT_RATIO);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, clipTop, spec.w, spec.h - clipTop);
  ctx.clip();

  await drawMonogramContent(ctx, spec, MonogramState, false);

  ctx.restore();

  // Draw a subtle boundary line at the clip edge so users can see the limit
  ctx.strokeStyle = 'rgba(180,180,180,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(0, clipTop);
  ctx.lineTo(spec.w, clipTop);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ================================================================
   PRINT MOCK — realistic preview with photos
================================================================ */
function drawPhotoIcon(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle   = 'rgba(255,255,255,0.12)';
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth   = 1;
  const s = size * 0.5;
  ctx.strokeRect(x - s, y - s * 0.7, s * 2, s * 1.4);
  ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.2, s * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s, y + s * 0.7);
  ctx.lineTo(x, y);
  ctx.lineTo(x + s * 0.5, y + s * 0.4);
  ctx.lineTo(x + s, y + s * 0.7);
  ctx.fill();
  ctx.restore();
}

async function renderPrintMock() {
  const mock = MonogramState.mockCanvas;
  if (!mock) return;

  const printSize = MonogramState.printSize;
  const spec      = CANVAS_SPECS[printSize];
  const is2x6     = printSize === '2x6';

  const displayW  = 460;
  const displayH  = is2x6
    ? Math.round(460 * 1240 / 1844)
    : Math.round(460 * spec.h / spec.w);

  mock.width  = displayW;
  mock.height = displayH;
  mock.style.width  = displayW + 'px';
  mock.style.height = displayH + 'px';

  const ctx     = mock.getContext('2d');
  const bgColor = MonogramState.backdropColor || '#2a2a3e';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, displayW, displayH);

  const monoZoneH  = Math.round(displayH * PRINT_STRIP_RATIO);
  const photoAreaH = displayH - monoZoneH;

  if (is2x6) {
    const stripW = Math.floor(displayW / 2) - 1;
    for (let s = 0; s < 2; s++) {
      const sx = s * (stripW + 2);
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
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(displayW / 2, 0); ctx.lineTo(displayW / 2, displayH); ctx.stroke();
    ctx.setLineDash([]);
  } else {
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

  const monoCanvas = MonogramState.canvas;
  if (monoCanvas && monoCanvas.width > 0) {
    const srcSpec  = CANVAS_SPECS[printSize];
    const srcZoneY = srcSpec.h * (1 - MONOGRAM_ZONE_HEIGHT_RATIO);
    const srcZoneH = srcSpec.h * MONOGRAM_ZONE_HEIGHT_RATIO;

    const mockSrcAspect = srcSpec.w / srcZoneH;
    if (is2x6) {
      const stripW = Math.floor(displayW / 2) - 1;
      for (let si = 0; si < 2; si++) {
        const sx = si * (stripW + 2);
        let dw = stripW; let dh = dw / mockSrcAspect;
        if (dh > monoZoneH) { dh = monoZoneH; dw = dh * mockSrcAspect; }
        const dx = sx + (stripW - dw) / 2;
        const dy = monoY + (monoZoneH - dh) / 2;
        ctx.drawImage(monoCanvas, 0, srcZoneY, srcSpec.w, srcZoneH, dx, dy, dw, dh);
      }
    } else {
      let dw = displayW; let dh = dw / mockSrcAspect;
      if (dh > monoZoneH) { dh = monoZoneH; dw = dh * mockSrcAspect; }
      const dx = (displayW - dw) / 2;
      const dy = monoY + (monoZoneH - dh) / 2;
      ctx.drawImage(monoCanvas, 0, srcZoneY, srcSpec.w, srcZoneH, dx, dy, dw, dh);
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 2;
  ctx.strokeRect(1, 1, displayW - 2, displayH - 2);
}

/* ================================================================
   DEBOUNCE
================================================================ */
let _renderTimer = null;
function scheduleRender() {
  clearTimeout(_renderTimer);
  _renderTimer = setTimeout(async () => {
    await renderMonogram();
  }, 80);
}

/* ================================================================
   EXPORT — full print-size transparent PNG
   4x6 = 1844 × 1240 (landscape)
   2x6 = 1240 × 1844 (portrait), doubled side-by-side for cutting
================================================================ */
const PRINT_DIMS = {
  '4x6': { w: 1844, h: 1240 },
  '2x6': { w: 1240, h: 1844 },
};

function exportMonogramPNG() {
  return new Promise(async (resolve) => {
    const exportCanvas = await getExportCanvas();
    exportCanvas.toBlob(resolve, 'image/png');
  });
}

function exportMonogramDataURL() {
  return getExportCanvas().then(c => c.toDataURL('image/png'));
}

async function getExportCanvas() {
  const printSize = MonogramState.printSize;
  const print     = PRINT_DIMS[printSize] || PRINT_DIMS['4x6'];
  const is2x6     = printSize === '2x6';

  // Render the monogram at the internal spec resolution first
  const spec = CANVAS_SPECS[printSize];
  const monoCanvas = document.createElement('canvas');
  monoCanvas.width  = spec.w;
  monoCanvas.height = spec.h;
  const mctx = monoCanvas.getContext('2d');
  await drawMonogramContent(mctx, spec, MonogramState, true);

  // Create full-print-size canvas (transparent)
  const singleW = is2x6 ? print.w / 2 : print.w;   // single strip width
  const singleH = print.h;

  // Monogram strip at bottom — same proportion as preview mock
  const monoStripH = Math.round(singleH * PRINT_STRIP_RATIO);
  const monoY      = singleH - monoStripH;

  // Source: crop the monogram canvas to just the visible zone area
  const srcZoneY = spec.h * (1 - MONOGRAM_ZONE_HEIGHT_RATIO);
  const srcZoneH = spec.h * MONOGRAM_ZONE_HEIGHT_RATIO;

  // Fit monogram into strip zone while preserving aspect ratio
  const srcAspect = spec.w / srcZoneH;

  if (is2x6) {
    // Two strips side by side on one 1240×1844 sheet
    const out = document.createElement('canvas');
    out.width  = print.w;
    out.height = print.h;
    const ctx = out.getContext('2d');

    for (let s = 0; s < 2; s++) {
      const sx = s * singleW;
      // Fit: try full width first, then check height
      let dw = singleW;
      let dh = dw / srcAspect;
      if (dh > monoStripH) { dh = monoStripH; dw = dh * srcAspect; }
      const dx = sx + (singleW - dw) / 2;
      const dy = monoY + (monoStripH - dh) / 2;
      ctx.drawImage(monoCanvas, 0, srcZoneY, spec.w, srcZoneH, dx, dy, dw, dh);
    }
    return out;
  } else {
    // Single 1844×1240 sheet
    const out = document.createElement('canvas');
    out.width  = print.w;
    out.height = print.h;
    const ctx = out.getContext('2d');

    let dw = print.w;
    let dh = dw / srcAspect;
    if (dh > monoStripH) { dh = monoStripH; dw = dh * srcAspect; }
    const dx = (print.w - dw) / 2;
    const dy = monoY + (monoStripH - dh) / 2;
    ctx.drawImage(monoCanvas, 0, srcZoneY, spec.w, srcZoneH, dx, dy, dw, dh);
    return out;
  }
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
   DATE PLACEHOLDER HELPER
================================================================ */
function getTodayDateString() {
  const now = new Date();
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const month = months[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();
  return `${month} ${day}, ${year}`;
}

/* ================================================================
   POSITION NUDGE CONTROLS — +/- buttons to move text/frame
================================================================ */
const NUDGE_STEP = 10; // pixels per click

function buildNudgeControls(targetLabel, xKey, yKey) {
  const wrap = document.createElement('div');
  wrap.className = 'nudge-controls';

  const label = document.createElement('span');
  label.className = 'nudge-label';
  label.textContent = targetLabel;

  const makeBtn = (text, dx, dy) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost btn-nudge';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      MonogramState[xKey] = (MonogramState[xKey] || 0) + dx * NUDGE_STEP;
      MonogramState[yKey] = (MonogramState[yKey] || 0) + dy * NUDGE_STEP;
      const hx = document.getElementById(xKey.replace('offset', 'mono-offset').replace('X', 'x').replace('Y', 'y').replace('frame', 'frame-offset'));
      const hy = document.getElementById(yKey.replace('offset', 'mono-offset').replace('X', 'x').replace('Y', 'y').replace('frame', 'frame-offset'));
      if (hx) hx.value = MonogramState[xKey];
      if (hy) hy.value = MonogramState[yKey];
      scheduleRender();
    });
    return btn;
  };

  wrap.appendChild(label);
  wrap.appendChild(makeBtn('←', -1, 0));
  wrap.appendChild(makeBtn('→', 1, 0));
  wrap.appendChild(makeBtn('↑', 0, -1));
  wrap.appendChild(makeBtn('↓', 0, 1));

  return wrap;
}

function initPositionControls() {
  const container = document.getElementById('position-controls');
  if (!container) return;
  container.innerHTML = '';

  container.appendChild(buildNudgeControls('Names', 'offsetX1', 'offsetY1'));
  container.appendChild(buildNudgeControls('Date', 'offsetX2', 'offsetY2'));
  container.appendChild(buildNudgeControls('Frame', 'frameOffsetX', 'frameOffsetY'));
}

/* ================================================================
   INIT
================================================================ */
async function initMonogramBuilder() {
  populateFontSelect();

  // Create main canvas
  const outer = document.getElementById('canvas-outer');
  if (!outer) return;
  const canvas = document.createElement('canvas');
  const spec   = CANVAS_SPECS['4x6'];
  canvas.width  = spec.w;
  canvas.height = spec.h;
  canvas.style.width   = '100%';
  canvas.style.height  = 'auto';
  canvas.style.display = 'block';
  outer.appendChild(canvas);
  MonogramState.canvas = canvas;

  // Init frame picker
  initFramePicker();

  await loadGoogleFont(MonogramState.fontFamily);
  await renderMonogram();

  /* ---- Position nudge controls ---- */
  initPositionControls();

  /* ---- Wire controls ---- */

  const line1Input = document.getElementById('mono-line1');
  const line2Input = document.getElementById('mono-line2');

  // Set date placeholder to today's date
  if (line2Input) {
    line2Input.placeholder = getTodayDateString();
  }

  if (line1Input) line1Input.addEventListener('input', () => {
    MonogramState.line1 = line1Input.value;
    const fontPreview = document.getElementById('font-preview-strip');
    if (fontPreview) fontPreview.textContent = line1Input.value || MonogramState.fontFamily;
    scheduleRender();
  });
  if (line2Input) line2Input.addEventListener('input', () => { MonogramState.line2 = line2Input.value; scheduleRender(); });

  // Font preview strip init
  const fontPreview = document.getElementById('font-preview-strip');
  if (fontPreview) {
    fontPreview.style.fontFamily = `"${MonogramState.fontFamily}", serif`;
  }

  /* ---- Font size controls ---- */
  const fontSize1Input = document.getElementById('mono-fontsize1');
  const fontSize1Range = document.getElementById('mono-fontsize1-range');
  const fontSize2Input = document.getElementById('mono-fontsize2');
  const fontSize2Range = document.getElementById('mono-fontsize2-range');

  function syncFontSize1(val) {
    const v = parseInt(val) || 0;
    MonogramState.fontSize1 = v;
    if (fontSize1Input && fontSize1Input !== document.activeElement) fontSize1Input.value = v || '';
    if (fontSize1Range) fontSize1Range.value = v;
    scheduleRender();
  }
  function syncFontSize2(val) {
    const v = parseInt(val) || 0;
    MonogramState.fontSize2 = v;
    if (fontSize2Input && fontSize2Input !== document.activeElement) fontSize2Input.value = v || '';
    if (fontSize2Range) fontSize2Range.value = v;
    scheduleRender();
  }

  if (fontSize1Input) fontSize1Input.addEventListener('input', () => syncFontSize1(fontSize1Input.value));
  if (fontSize1Range) fontSize1Range.addEventListener('input', () => syncFontSize1(fontSize1Range.value));
  if (fontSize2Input) fontSize2Input.addEventListener('input', () => syncFontSize2(fontSize2Input.value));
  if (fontSize2Range) fontSize2Range.addEventListener('input', () => syncFontSize2(fontSize2Range.value));

  /* ---- Text position controls ---- */
  const offsetX1 = document.getElementById('mono-offsetx1');
  const offsetY1 = document.getElementById('mono-offsety1');
  const offsetX2 = document.getElementById('mono-offsetx2');
  const offsetY2 = document.getElementById('mono-offsety2');

  if (offsetX1) offsetX1.addEventListener('input', () => { MonogramState.offsetX1 = parseInt(offsetX1.value) || 0; scheduleRender(); });
  if (offsetY1) offsetY1.addEventListener('input', () => { MonogramState.offsetY1 = parseInt(offsetY1.value) || 0; scheduleRender(); });
  if (offsetX2) offsetX2.addEventListener('input', () => { MonogramState.offsetX2 = parseInt(offsetX2.value) || 0; scheduleRender(); });
  if (offsetY2) offsetY2.addEventListener('input', () => { MonogramState.offsetY2 = parseInt(offsetY2.value) || 0; scheduleRender(); });

  const resetPosBtn = document.getElementById('btn-reset-position');
  if (resetPosBtn) {
    resetPosBtn.addEventListener('click', () => {
      MonogramState.offsetX1 = 0; MonogramState.offsetY1 = 0;
      MonogramState.offsetX2 = 0; MonogramState.offsetY2 = 0;
      [offsetX1, offsetY1, offsetX2, offsetY2].forEach(el => { if (el) el.value = 0; });
      scheduleRender();
    });
  }

  /* ---- Frame transform controls ---- */
  const frameScaleRange = document.getElementById('mono-frame-scale');
  const frameScaleVal   = document.getElementById('mono-frame-scale-val');
  const frameOffXInput  = document.getElementById('mono-frame-offsetx');
  const frameOffYInput  = document.getElementById('mono-frame-offsety');

  if (frameScaleRange) {
    frameScaleRange.addEventListener('input', () => {
      const v = parseFloat(frameScaleRange.value) || 1.0;
      MonogramState.frameScale = v;
      if (frameScaleVal) frameScaleVal.textContent = v.toFixed(2) + 'x';
      scheduleRender();
    });
  }
  if (frameOffXInput) frameOffXInput.addEventListener('input', () => { MonogramState.frameOffsetX = parseInt(frameOffXInput.value) || 0; scheduleRender(); });
  if (frameOffYInput) frameOffYInput.addEventListener('input', () => { MonogramState.frameOffsetY = parseInt(frameOffYInput.value) || 0; scheduleRender(); });

  /* ---- Reset all to default ---- */
  const resetAllBtn = document.getElementById('btn-reset-all');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      // Reset state fields (preserve canvas/mock refs and printSize/backdropColor)
      Object.assign(MonogramState, _defaultMonogramState);

      // Reset UI inputs
      if (line1Input) line1Input.value = '';
      if (line2Input) line2Input.value = '';

      // Fonts
      const sel1 = document.getElementById('mono-font1');
      const sel2 = document.getElementById('mono-font2');
      const selLegacy = document.getElementById('mono-font');
      if (sel1) sel1.value = MONOGRAM_FONTS[0].family;
      if (sel2) sel2.value = MONOGRAM_FONTS[0].family;
      if (selLegacy) selLegacy.value = MONOGRAM_FONTS[0].family;
      if (fontPreview) { fontPreview.style.fontFamily = `"${MONOGRAM_FONTS[0].family}", serif`; fontPreview.textContent = 'Font Preview'; }

      // Font link
      const fontLinkBtn = document.getElementById('font-link-toggle');
      if (fontLinkBtn) { fontLinkBtn.classList.add('linked'); fontLinkBtn.textContent = '🔗'; }

      // Font sizes
      if (fontSize1Input) fontSize1Input.value = '';
      if (fontSize1Range) fontSize1Range.value = 0;
      if (fontSize2Input) fontSize2Input.value = '';
      if (fontSize2Range) fontSize2Range.value = 0;

      // Offsets
      [offsetX1, offsetY1, offsetX2, offsetY2].forEach(el => { if (el) el.value = 0; });

      // Frame controls
      if (frameScaleRange) frameScaleRange.value = 1.0;
      if (frameScaleVal) frameScaleVal.textContent = '1.00x';
      if (frameOffXInput) frameOffXInput.value = 0;
      if (frameOffYInput) frameOffYInput.value = 0;

      // Colors
      const color1Input = document.getElementById('mono-color1');
      const color1Hex   = document.getElementById('mono-color1-hex');
      const color2Input = document.getElementById('mono-color2');
      const color2Hex   = document.getElementById('mono-color2-hex');
      if (color1Input) color1Input.value = '#333333';
      if (color1Hex)   color1Hex.textContent = '#333333';
      if (color2Input) color2Input.value = '#333333';
      if (color2Hex)   color2Hex.textContent = '#333333';

      // Color link buttons
      ['color-link-toggle', 'color-link-toggle-2'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) { btn.classList.add('linked'); btn.textContent = '🔗'; }
      });

      // Frame picker: deselect all, select none
      const grid = document.getElementById('flourish-picker-grid');
      if (grid) {
        grid.querySelectorAll('.frame-option').forEach(c => {
          c.classList.toggle('selected', c.dataset.frame === 'none');
        });
      }

      scheduleRender();
    });
  }

  /* ---- Font link toggle ---- */
  const fontLinkBtn = document.getElementById('font-link-toggle');
  function toggleFontLink() {
    MonogramState.fontsLinked = !MonogramState.fontsLinked;
    const icon = MonogramState.fontsLinked ? '🔗' : '🔓';
    if (fontLinkBtn) {
      fontLinkBtn.classList.toggle('linked', MonogramState.fontsLinked);
      fontLinkBtn.textContent = icon;
    }
    if (MonogramState.fontsLinked) {
      MonogramState.fontFamily2 = MonogramState.fontFamily1;
      const sel2 = document.getElementById('mono-font2');
      if (sel2) sel2.value = MonogramState.fontFamily1;
    }
    scheduleRender();
  }
  if (fontLinkBtn) fontLinkBtn.addEventListener('click', toggleFontLink);

  /* ---- Dual color pickers ---- */
  const color1Input = document.getElementById('mono-color1');
  const color1Hex   = document.getElementById('mono-color1-hex');
  const color2Input = document.getElementById('mono-color2');
  const color2Hex   = document.getElementById('mono-color2-hex');
  const linkBtn     = document.getElementById('color-link-toggle');
  const linkBtn2    = document.getElementById('color-link-toggle-2');
  const matchToDate  = document.getElementById('match-to-date');
  const matchToNames = document.getElementById('match-to-names');
  const warn1 = document.getElementById('color1-warning');
  const warn2 = document.getElementById('color2-warning');

  function updateColorWarnings() {
    if (warn1) warn1.classList.toggle('hidden', !isColorTooLight(MonogramState.textColor1));
    if (warn2) warn2.classList.toggle('hidden', !isColorTooLight(MonogramState.textColor2));
  }

  function updateMatchButtons() {
    const diff     = MonogramState.textColor1 !== MonogramState.textColor2;
    const unlinked = !MonogramState.colorsLinked;
    if (matchToDate)  matchToDate.classList.toggle('hidden',  !(unlinked && diff));
    if (matchToNames) matchToNames.classList.toggle('hidden', !(unlinked && diff));
  }

  if (color1Input) {
    color1Input.addEventListener('input', () => {
      MonogramState.textColor1 = color1Input.value;
      if (color1Hex) color1Hex.textContent = color1Input.value;
      if (MonogramState.colorsLinked) {
        MonogramState.textColor2 = color1Input.value;
        if (color2Input) color2Input.value = color1Input.value;
        if (color2Hex)   color2Hex.textContent = color1Input.value;
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
        if (color1Hex)   color1Hex.textContent = color2Input.value;
      }
      updateColorWarnings();
      updateMatchButtons();
      scheduleRender();
    });
  }

  function toggleColorLink() {
    MonogramState.colorsLinked = !MonogramState.colorsLinked;
    const icon = MonogramState.colorsLinked ? '🔗' : '🔓';
    [linkBtn, linkBtn2].forEach(btn => {
      if (btn) {
        btn.classList.toggle('linked', MonogramState.colorsLinked);
        btn.textContent = icon;
      }
    });
    if (MonogramState.colorsLinked) {
      MonogramState.textColor2 = MonogramState.textColor1;
      if (color2Input) color2Input.value = MonogramState.textColor1;
      if (color2Hex)   color2Hex.textContent = MonogramState.textColor1;
    }
    updateMatchButtons();
    scheduleRender();
  }

  if (linkBtn) linkBtn.addEventListener('click', toggleColorLink);
  if (linkBtn2) linkBtn2.addEventListener('click', toggleColorLink);

  if (matchToDate) {
    matchToDate.addEventListener('click', () => {
      MonogramState.textColor1 = MonogramState.textColor2;
      if (color1Input) color1Input.value = MonogramState.textColor2;
      if (color1Hex)   color1Hex.textContent = MonogramState.textColor2;
      updateColorWarnings();
      updateMatchButtons();
      scheduleRender();
    });
  }

  if (matchToNames) {
    matchToNames.addEventListener('click', () => {
      MonogramState.textColor2 = MonogramState.textColor1;
      if (color2Input) color2Input.value = MonogramState.textColor1;
      if (color2Hex)   color2Hex.textContent = MonogramState.textColor1;
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
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const event = new URLSearchParams(window.location.search).get('event') || 'monogram';
      a.href     = url;
      a.download = `${event}-monogram.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

/* ================================================================
   HOOKS for app.js
================================================================ */
function updateMonogramPrintSize(size) {
  MonogramState.printSize = size;
  renderMonogram();
}

function updateMonogramBackdropColor(color) {
  MonogramState.backdropColor = color;
  renderPrintMock();
}

/* ================================================================
   PUBLIC API
================================================================ */
window.MonogramBuilder = {
  init:                initMonogramBuilder,
  render:              renderMonogram,
  renderMock:          renderPrintMock,
  updatePrintSize:     updateMonogramPrintSize,
  updateBackdropColor: updateMonogramBackdropColor,
  exportPNG:           exportMonogramPNG,
  exportDataURL:       exportMonogramDataURL,
  state:               MonogramState,
  fonts:               MONOGRAM_FONTS,
};
