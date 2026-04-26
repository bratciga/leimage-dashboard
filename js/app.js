/**
 * app.js — Le Image Photo Booth Configurator
 *
 * Handles:
 *  - Multi-step wizard navigation & progress bar
 *  - Step validation before advancing
 *  - Toggle selection (deselect on re-click) for backdrop & print size
 *  - Lightbox for all images
 *  - Review step population
 *  - Form submit → localStorage + PHP JSON backend
 */

'use strict';

/* ================================================================
   API CONFIG
================================================================ */
const PROJECT_API = {
  get:  'api/get-project.php',
  save: 'api/save-project.php',
};

const PROJECT_LS_PREFIX = 'leimage_pb_project_';
let ActiveProjectRecord = null;

/* ================================================================
   WIZARD STATE
================================================================ */
const WizardState = {
  currentStep: 1,
  totalSteps:  8,

  // Selections
  parking:    null,
  backdrop:   null,
  printSize:  null,
};

/* ================================================================
   DOM READY
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setFooterYear();

  // Initialize monogram builder
  await window.MonogramBuilder.init();

  // Wizard setup
  initWizardNavigation();
  initToggleSelections();
  initLightbox();
  addZoomOverlays();

  // Submit
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmit);
  }

  // Review page download button
  const reviewDlBtn = document.getElementById('review-download-btn');
  if (reviewDlBtn) {
    reviewDlBtn.addEventListener('click', async () => {
      const blob = await window.MonogramBuilder.exportPNG();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const event = new URLSearchParams(window.location.search).get('event') || 'monogram';
      a.href     = url;
      a.download = `${event}-monogram.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Fullscreen print preview
  const fullscreenBtn = document.getElementById('review-fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', openFullscreenPrintPreview);
  }

  const fsModal = document.getElementById('print-fullscreen-modal');
  if (fsModal) {
    fsModal.querySelector('.print-fullscreen-close')?.addEventListener('click', closeFullscreenPrintPreview);
    fsModal.querySelector('.print-fullscreen-backdrop')?.addEventListener('click', closeFullscreenPrintPreview);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !fsModal.classList.contains('hidden')) closeFullscreenPrintPreview();
    });
  }

  // Show step 1
  goToStep(1);

  // Load project from token / local draft
  const loaded = await loadProject();
  if (loaded) {
    showToast('Welcome back! Your progress has been restored.');
  }

  // Save button
  const saveBtn = document.getElementById('save-project-btn');
  if (saveBtn) saveBtn.addEventListener('click', () => saveProject());

  const reviewSaveBtn = document.getElementById('review-save-btn');
  if (reviewSaveBtn) reviewSaveBtn.addEventListener('click', () => saveProject());
}

/* ================================================================
   UTILITIES
================================================================ */
function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

function getProjectToken() {
  return new URLSearchParams(window.location.search).get('project') || '';
}

function getEventSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get('event') || ActiveProjectRecord?.event_slug || 'demo-event';
}

function updateEventBanner() {
  const label = ActiveProjectRecord?.client_name || ActiveProjectRecord?.event_slug || getEventSlug();
  const eventNameEl = document.getElementById('event-name');
  const clientNameEl = document.getElementById('client-name-display');
  const eventDateEl = document.getElementById('event-date-display');
  const statusWrap = document.getElementById('project-status-wrap');
  const statusEl = document.getElementById('project-status-display');

  if (eventNameEl) eventNameEl.textContent = label;
  if (clientNameEl) clientNameEl.textContent = ActiveProjectRecord?.client_name || label;
  if (eventDateEl) eventDateEl.textContent = ActiveProjectRecord?.event_date || '—';

  if (statusWrap && statusEl && ActiveProjectRecord?.status) {
    const normalized = String(ActiveProjectRecord.status).toLowerCase();
    statusWrap.classList.remove('hidden');
    statusEl.className = `status-pill status-pill--${normalized}`;
    statusEl.textContent = normalized === 'in_progress'
      ? 'In Progress'
      : normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}

function applyProjectLockState() {
  const locked = String(ActiveProjectRecord?.status || '').toLowerCase() === 'approved';
  const saveBtn = document.getElementById('save-project-btn');
  const reviewSaveBtn = document.getElementById('review-save-btn');
  const submitBtn = document.getElementById('submit-btn');
  const statusEl = document.getElementById('submit-status');

  if (saveBtn) saveBtn.disabled = locked;
  if (reviewSaveBtn) reviewSaveBtn.disabled = locked;
  if (submitBtn) submitBtn.disabled = locked;

  if (locked && statusEl) {
    statusEl.textContent = 'This project has been approved and locked by Le Image.';
    statusEl.className = 'submit-status success';
  }
}

function getProjectStorageKey() {
  const token = getProjectToken();
  return `${PROJECT_LS_PREFIX}${token || getEventSlug()}`;
}

/* ================================================================
   WIZARD NAVIGATION
================================================================ */
function initWizardNavigation() {
  // Next buttons
  document.querySelectorAll('.wizard-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = parseInt(btn.dataset.next, 10);
      const current = WizardState.currentStep;

      if (!validateStep(current)) return;
      goToStep(next);
    });
  });

  // Back buttons
  document.querySelectorAll('.wizard-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const back = parseInt(btn.dataset.back, 10);
      goToStep(back);
    });
  });

  // Review "Edit" links
  document.querySelectorAll('.review-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.dataset.goto, 10);
      goToStep(target);
    });
  });

  // Progress bar step bubbles — allow clicking completed steps
  document.querySelectorAll('.wizard-step').forEach(bubble => {
    bubble.addEventListener('click', () => {
      const stepNum = parseInt(bubble.dataset.step, 10);
      if (stepNum < WizardState.currentStep) {
        goToStep(stepNum);
      }
    });
  });
}

function goToStep(step) {
  const prev = WizardState.currentStep;
  WizardState.currentStep = step;

  // Hide all panels, show target
  document.querySelectorAll('.wizard-step-panel').forEach(panel => {
    const panelStep = parseInt(panel.dataset.step, 10);
    if (panelStep === step) {
      panel.classList.remove('hidden');
      // Scroll to top of panel
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      panel.classList.add('hidden');
    }
  });

  // Update progress bar
  updateProgressBar(step);

  // If entering step 7 (monogram), sync print size & backdrop
  if (step === 7) {
    const printSize = document.getElementById('print-size-value')?.value;
    if (printSize) window.MonogramBuilder.updatePrintSize(printSize);
    const backdrop = document.getElementById('backdrop-value')?.value;
    if (backdrop) window.MonogramBuilder.updateBackdropColor(backdrop);
  }

  // If entering step 8 (review), populate it
  if (step === 8) {
    populateReview();
  }

  // Clear errors when going back or forward
  clearStepErrors(prev);
}

function updateProgressBar(currentStep) {
  const steps = document.querySelectorAll('.wizard-step');
  steps.forEach(stepEl => {
    const num = parseInt(stepEl.dataset.step, 10);
    stepEl.classList.remove('active', 'completed');
    if (num === currentStep) {
      stepEl.classList.add('active');
    } else if (num < currentStep) {
      stepEl.classList.add('completed');
    }
  });

  // Fill the progress track
  const fill = document.getElementById('wizard-fill');
  if (fill) {
    const pct = ((currentStep - 1) / (WizardState.totalSteps - 1)) * 100;
    fill.style.width = `${pct}%`;
  }
}

/* ================================================================
   STEP VALIDATION
================================================================ */
function validateStep(step) {
  clearStepErrors(step);

  if (step === 4) {
    if (!WizardState.parking) {
      showError('error-parking', 'Please indicate whether parking is arranged.');
      return false;
    }
  }

  if (step === 5) {
    if (!WizardState.backdrop) {
      showError('error-backdrop', 'Please select a backdrop color.');
      return false;
    }
  }

  if (step === 6) {
    if (!WizardState.printSize) {
      showError('error-print', 'Please select a print size.');
      return false;
    }
  }

  if (step === 7) {
    const mono = window.MonogramBuilder.state;
    if (!mono.line1.trim() && !mono.line2.trim()) {
      showError('error-monogram', 'Please enter at least one line of monogram text.');
      return false;
    }
  }

  return true;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function clearStepErrors(step) {
  const panel = document.getElementById(`step-panel-${step}`);
  if (panel) {
    panel.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
  }
}

/* ================================================================
   TOGGLE SELECTIONS  (backdrop, print size, parking)
================================================================ */
function initToggleSelections() {
  // Generic toggle-selectable cards (backdrop, print size)
  // Single click = select/deselect. Double-click on image = lightbox (handled separately).
  // Debounce: ignore rapid second click (prevents dblclick from deselecting)
  let lastToggleTime = 0;
  document.querySelectorAll('.toggle-selectable').forEach(card => {
    card.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastToggleTime < 400) return; // ignore second click of dblclick
      lastToggleTime = now;

      const group = card.dataset.group;
      const value = card.dataset.value;

      // Check if already selected → deselect
      if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        setGroupValue(group, null);
      } else {
        // Deselect others in same group
        document.querySelectorAll(`.toggle-selectable[data-group="${group}"]`).forEach(c => {
          c.classList.remove('selected');
        });
        card.classList.add('selected');
        setGroupValue(group, value);
      }
    });
  });

  // Parking toggle cards
  document.querySelectorAll('.toggle-card[data-group="parking"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        WizardState.parking = null;
        const hidden = document.getElementById('parking-value');
        if (hidden) hidden.value = '';
      } else {
        document.querySelectorAll('.toggle-card[data-group="parking"]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        WizardState.parking = value;
        const hidden = document.getElementById('parking-value');
        if (hidden) hidden.value = value;
      }
    });
  });
}

function setGroupValue(group, value) {
  if (group === 'backdrop') {
    WizardState.backdrop = value;
    const hidden = document.getElementById('backdrop-value');
    if (hidden) hidden.value = value || '';
    // Update monogram backdrop if we're already on monogram step
    if (WizardState.currentStep === 7) {
      window.MonogramBuilder.updateBackdropColor(value);
    }
  }

  if (group === 'print_size') {
    WizardState.printSize = value;
    const hidden = document.getElementById('print-size-value');
    if (hidden) hidden.value = value || '';
    // Sync monogram canvas
    if (value) {
      window.MonogramBuilder.updatePrintSize(value);
    }
  }
}

/* ================================================================
   ZOOM ICON OVERLAYS
================================================================ */
function addZoomOverlays() {
  document.querySelectorAll('.lightbox-trigger').forEach(trigger => {
    // Don't add if already has one
    if (trigger.querySelector('.zoom-icon-overlay')) return;
    const btn = document.createElement('button');
    btn.className = 'zoom-icon-overlay';
    btn.textContent = '🔍';
    btn.title = 'Double-click to preview';
    btn.setAttribute('aria-label', 'Zoom preview');
    // Clicking the zoom icon opens lightbox immediately (single click shortcut)
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = trigger.dataset.src || trigger.querySelector('img')?.src || '';
      const alt = trigger.dataset.alt || trigger.querySelector('img')?.alt || '';
      if (src) {
        // Dispatch a synthetic dblclick to trigger lightbox
        trigger.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });
    trigger.appendChild(btn);
  });
}

/* ================================================================
   LIGHTBOX
================================================================ */
function initLightbox() {
  const lb         = document.getElementById('lightbox');
  const lbImg      = document.getElementById('lightbox-img');
  const lbBackdrop = document.getElementById('lightbox-backdrop');
  const lbClose    = document.getElementById('lightbox-close');
  const lbPrev     = document.getElementById('lightbox-prev');
  const lbNext     = document.getElementById('lightbox-next');

  if (!lb || !lbImg) return;

  // Track current gallery of images for prev/next navigation
  let currentGallery = []; // array of {src, alt}
  let currentIndex = 0;

  function updateArrows() {
    if (lbPrev) lbPrev.classList.toggle('hidden', currentGallery.length <= 1 || currentIndex <= 0);
    if (lbNext) lbNext.classList.toggle('hidden', currentGallery.length <= 1 || currentIndex >= currentGallery.length - 1);
  }

  function showImage(index) {
    if (index < 0 || index >= currentGallery.length) return;
    currentIndex = index;
    lbImg.src = currentGallery[index].src;
    lbImg.alt = currentGallery[index].alt;
    updateArrows();
  }

  function openLightbox(src, alt, gallery, index) {
    currentGallery = gallery || [{src, alt}];
    currentIndex = index || 0;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    updateArrows();
  }

  function closeLightbox() {
    lb.classList.add('hidden');
    document.body.style.overflow = '';
    lbImg.src = '';
    currentGallery = [];
    currentIndex = 0;
  }

  // Build gallery from sibling lightbox-trigger elements
  function buildGallery(trigger) {
    const parent = trigger.closest('.photo-grid, .backdrop-grid, .print-grid, section');
    if (!parent) return { gallery: [{src: getSrc(trigger), alt: getAlt(trigger)}], index: 0 };

    const triggers = Array.from(parent.querySelectorAll('.lightbox-trigger'));
    const gallery = triggers.map(t => ({
      src: t.dataset.src || t.querySelector('img')?.src || '',
      alt: t.dataset.alt || t.querySelector('img')?.alt || ''
    })).filter(item => item.src);

    const index = triggers.indexOf(trigger);
    return { gallery, index: Math.max(0, index) };
  }

  function getSrc(trigger) {
    return trigger.dataset.src || trigger.querySelector('img')?.src || '';
  }

  function getAlt(trigger) {
    return trigger.dataset.alt || trigger.querySelector('img')?.alt || '';
  }

  // DOUBLE-CLICK to open lightbox (single click = select)
  document.addEventListener('dblclick', (e) => {
    const trigger = e.target.closest('.lightbox-trigger');
    if (!trigger) return;
    e.stopPropagation();

    const src = getSrc(trigger);
    const alt = getAlt(trigger);
    if (!src) return;

    const { gallery, index } = buildGallery(trigger);
    openLightbox(src, alt, gallery, index);
  });

  // Zoom toggle in lightbox
  const lbZoom = document.getElementById('lightbox-zoom');
  const lbScrollWrap = document.getElementById('lightbox-scroll-wrap');
  let isZoomed = false;

  if (lbZoom && lbScrollWrap) {
    lbZoom.addEventListener('click', (e) => {
      e.stopPropagation();
      isZoomed = !isZoomed;
      if (isZoomed) {
        lbImg.style.maxWidth = 'none';
        lbImg.style.maxHeight = 'none';
        lbImg.style.width = '150%';
        lbScrollWrap.style.overflow = 'auto';
        lbZoom.textContent = '🔍 150%';
      } else {
        lbImg.style.maxWidth = '90vw';
        lbImg.style.maxHeight = '85vh';
        lbImg.style.width = '';
        lbScrollWrap.style.overflow = 'hidden';
        lbZoom.textContent = '🔍 Fit';
      }
    });
  }

  // Reset zoom on close
  const origClose = closeLightbox;
  closeLightbox = function() {
    isZoomed = false;
    if (lbImg) { lbImg.style.maxWidth = '90vw'; lbImg.style.maxHeight = '85vh'; lbImg.style.width = ''; }
    if (lbScrollWrap) lbScrollWrap.style.overflow = 'hidden';
    if (lbZoom) lbZoom.textContent = '🔍 Fit';
    origClose();
  };

  // Arrow navigation
  if (lbPrev) lbPrev.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
  if (lbNext) lbNext.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

  lbBackdrop.addEventListener('click', closeLightbox);
  lbClose.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (lb.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });
}

/* ================================================================
   REVIEW STEP POPULATION
================================================================ */
function populateReview() {
  // Parking
  const parkingEl = document.getElementById('review-parking');
  if (parkingEl) {
    const v = WizardState.parking;
    parkingEl.textContent = v ? (v === 'yes' ? '✅ Yes' : '❌ No') : '— not selected —';
  }

  // Backdrop
  const backdropEl = document.getElementById('review-backdrop');
  if (backdropEl) {
    backdropEl.textContent = WizardState.backdrop || '— not selected —';
  }

  // Print Size
  const printEl = document.getElementById('review-print-size');
  if (printEl) {
    const ps = WizardState.printSize;
    printEl.textContent = ps === '4x6' ? '4×6 Print'
                        : ps === '2x6' ? '2×6 Strip'
                        : '— not selected —';
  }

  // Props
  const propsEl = document.getElementById('review-props');
  if (propsEl) {
    const checked = Array.from(document.querySelectorAll('input[name="props"]:checked')).map(i => i.value);
    propsEl.textContent = checked.length ? checked.join(', ') : '— none selected —';
  }

  // Notes
  const notesEl = document.getElementById('review-notes');
  if (notesEl) {
    const notes = document.getElementById('special-instructions')?.value.trim();
    notesEl.textContent = notes || '— none —';
  }

  // Monogram text summary
  const monoTextEl = document.getElementById('review-monogram-text');
  if (monoTextEl) {
    const mono = window.MonogramBuilder.state;
    const parts = [mono.line1, mono.line2].filter(Boolean);
    monoTextEl.textContent = parts.length ? parts.join(' · ') : '— not entered —';
  }

  // Monogram thumbnail
  const thumbCanvas = document.getElementById('review-monogram-canvas');
  if (thumbCanvas) {
    const srcCanvas = window.MonogramBuilder.state.canvas;
    if (srcCanvas && srcCanvas.width > 0) {
      thumbCanvas.width  = 120;
      thumbCanvas.height = Math.round(120 * srcCanvas.height / srcCanvas.width);
      const ctx = thumbCanvas.getContext('2d');
      ctx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
      ctx.drawImage(srcCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }
  }

  // Print layout preview with backdrop + photo placeholders + monogram
  buildPrintLayoutPreview();
}

function buildPrintLayoutPreview() {
  const container = document.getElementById('review-print-layout');
  if (!container) return;
  container.innerHTML = '';
  container.className = 'review-print-layout';

  const printSize = WizardState.printSize || '4x6';
  const is2x6 = printSize === '2x6';
  const gap = 2; // % gap between cells

  container.classList.add(is2x6 ? 'review-print-layout--2x6' : 'review-print-layout--4x6');

  // White background like real prints
  container.style.backgroundColor = '#ffffff';
  container.style.backgroundImage = 'none';

  // Find backdrop image URL
  let backdropUrl = '';
  const backdrop = WizardState.backdrop;
  if (backdrop) {
    const backdropCard = document.querySelector(`.toggle-selectable[data-value="${backdrop}"]`);
    const backdropImg = backdropCard?.querySelector('img');
    if (backdropImg) backdropUrl = backdropImg.src;
  }

  function makePhotoSlot(left, top, width, height, label) {
    const ph = document.createElement('div');
    ph.className = 'photo-placeholder';
    ph.style.cssText = `left:${left}%; top:${top}%; width:${width}%; height:${height}%;`;
    if (backdropUrl) {
      ph.style.backgroundImage = `url('${backdropUrl}')`;
      ph.style.backgroundSize = 'cover';
      ph.style.backgroundPosition = 'center';
      ph.style.border = 'none';
    }
    ph.textContent = label;
    return ph;
  }

  if (is2x6) {
    // 2x6 strip: 4 photos stacked + monogram same size as a photo
    // 5 equal slots with gaps: each ~18% height, 1.5% gap
    const slotH = 18;
    const gap = 1.5;
    const startY = 1;
    for (let i = 0; i < 4; i++) {
      const y = startY + i * (slotH + gap);
      container.appendChild(makePhotoSlot(3, y, 94, slotH, `Photo ${i + 1}`));
    }
    // Monogram — same size as photo slots
    const mono = document.createElement('div');
    mono.className = 'monogram-placeholder';
    const monoY = startY + 4 * (slotH + gap);
    mono.style.cssText = `left:3%; top:${monoY}%; width:94%; height:${slotH}%;`;
    addMonogramToPlaceholder(mono);
    container.appendChild(mono);
  } else {
    // 4x6 landscape: 2 photos across top, 1 photo bottom-right, monogram bottom-left
    const halfW = 48;
    const halfH = 47;

    // Top-left photo
    container.appendChild(makePhotoSlot(1.5, 1.5, halfW, halfH, 'Photo 1'));
    // Top-right photo
    container.appendChild(makePhotoSlot(50.5, 1.5, halfW, halfH, 'Photo 2'));
    // Bottom-right photo
    container.appendChild(makePhotoSlot(50.5, 51, halfW, halfH, 'Photo 3'));

    // Monogram bottom-left — force square
    const mono = document.createElement('div');
    mono.className = 'monogram-placeholder';
    mono.style.cssText = 'left:1.5%; top:51%; width:48%; height:47%;';
    addMonogramToPlaceholder(mono);
    container.appendChild(mono);
  }
}

function addMonogramToPlaceholder(container) {
  const state = window.MonogramBuilder?.state;
  const is4x6 = (state?.printSize || '4x6') === '4x6';
  if (!state || (!state.line1.trim() && !state.line2.trim())) {
    container.style.color = 'rgba(0,0,0,0.25)';
    container.style.fontSize = '0.65rem';
    container.style.fontFamily = "'Cinzel', serif";
    container.textContent = 'Monogram';
    return;
  }

  // Use the actual monogram canvas — it already has frame + text rendered
  const srcCanvas = state.canvas;
  if (!srcCanvas || srcCanvas.width === 0) {
    container.style.color = 'rgba(0,0,0,0.25)';
    container.style.fontSize = '0.65rem';
    container.style.fontFamily = "'Cinzel', serif";
    container.textContent = 'Monogram';
    return;
  }

  const miniCanvas = document.createElement('canvas');
  miniCanvas.style.maxWidth = is4x6 ? '80%' : '100%';
  miniCanvas.style.maxHeight = is4x6 ? '80%' : '100%';

  // Crop to the monogram zone (bottom 96% — matching MONOGRAM_ZONE_HEIGHT_RATIO)
  const zoneRatio = 0.96;
  const zoneH = srcCanvas.height * zoneRatio;
  const zoneY = srcCanvas.height - zoneH;

  miniCanvas.width = srcCanvas.width;
  miniCanvas.height = Math.round(zoneH);
  const ctx = miniCanvas.getContext('2d');
  ctx.drawImage(srcCanvas, 0, zoneY, srcCanvas.width, zoneH, 0, 0, miniCanvas.width, miniCanvas.height);

  container.appendChild(miniCanvas);
}

function openFullscreenPrintPreview() {
  const modal = document.getElementById('print-fullscreen-modal');
  const layout = document.getElementById('print-fullscreen-layout');
  if (!modal || !layout) return;

  layout.innerHTML = '';
  layout.className = '';
  layout.style.cssText = '';

  const printSize = WizardState.printSize || '4x6';
  const is2x6 = printSize === '2x6';

  // Responsive: fit within viewport while maintaining exact print ratio
  const vw = window.innerWidth * 0.92;
  const vh = window.innerHeight * 0.88;

  if (is2x6) {
    const ratio = 430 / 1280; // w:h
    let h = vh;
    let w = h * ratio;
    if (w > vw) { w = vw; h = w / ratio; }
    layout.style.cssText = `position:relative; width:${w}px; height:${h}px; background:#fff;`;
  } else {
    const ratio = 1280 / 861; // w:h
    let w = vw;
    let h = w / ratio;
    if (h > vh) { h = vh; w = h * ratio; }
    layout.style.cssText = `position:relative; width:${w}px; height:${h}px; background:#fff;`;
  }

  // Find backdrop
  let backdropUrl = '';
  const backdrop = WizardState.backdrop;
  if (backdrop) {
    const card = document.querySelector(`.toggle-selectable[data-value="${backdrop}"]`);
    const img = card?.querySelector('img');
    if (img) backdropUrl = img.src;
  }

  function makeSlot(left, top, width, height, label) {
    const el = document.createElement('div');
    el.className = 'photo-placeholder';
    el.style.cssText = `left:${left}%; top:${top}%; width:${width}%; height:${height}%;`;
    if (backdropUrl) {
      el.style.backgroundImage = `url('${backdropUrl}')`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    }
    el.textContent = label;
    return el;
  }

  if (is2x6) {
    const slotH = 18, gap = 1.5, startY = 1;
    for (let i = 0; i < 4; i++) {
      layout.appendChild(makeSlot(3, startY + i * (slotH + gap), 94, slotH, `Photo ${i + 1}`));
    }
    const mono = document.createElement('div');
    mono.className = 'monogram-placeholder';
    const monoY = startY + 4 * (slotH + gap);
    mono.style.cssText = `left:3%; top:${monoY}%; width:94%; height:${slotH}%;`;
    addMonogramToPlaceholder(mono);
    layout.appendChild(mono);
  } else {
    const halfW = 48, halfH = 47;
    layout.appendChild(makeSlot(1.5, 1.5, halfW, halfH, 'Photo 1'));
    layout.appendChild(makeSlot(50.5, 1.5, halfW, halfH, 'Photo 2'));
    layout.appendChild(makeSlot(50.5, 51, halfW, halfH, 'Photo 3'));
    const mono = document.createElement('div');
    mono.className = 'monogram-placeholder';
    mono.style.cssText = 'left:1.5%; top:51%; width:48%; height:47%;';
    addMonogramToPlaceholder(mono);
    layout.appendChild(mono);
  }

  modal.classList.remove('hidden');
}

function closeFullscreenPrintPreview() {
  document.getElementById('print-fullscreen-modal')?.classList.add('hidden');
}

/* ================================================================
   COLLECT FORM DATA
================================================================ */
function collectFormData() {
  const mono  = window.MonogramBuilder.state;
  const props = Array.from(document.querySelectorAll('input[name="props"]:checked')).map(el => el.value);

  return {
    project_token:        getProjectToken() || null,
    event_slug:           ActiveProjectRecord?.event_slug || getEventSlug(),
    client_name:          ActiveProjectRecord?.client_name || getEventSlug(),
    event_date:           ActiveProjectRecord?.event_date || null,
    currentStep:          WizardState.currentStep,
    parking:              WizardState.parking,
    backdrop:             WizardState.backdrop,
    print_size:           WizardState.printSize,
    monogram: {
      line1:          mono.line1,
      line2:          mono.line2,
      font:           mono.fontFamily,
      fontFamily:     mono.fontFamily,
      text_color1:    mono.textColor1,
      text_color2:    mono.textColor2,
      colorsLinked:   mono.colorsLinked,
      flourish_style: mono.flourish,
      frame:          mono.frame,
      frame_color:    mono.frameColor,
      bg_transparent: true,
    },
    props,
    special_instructions: document.getElementById('special-instructions')?.value.trim() || '',
  };
}

/* ================================================================
   LOCAL STORAGE + PHP PROJECT API
================================================================ */
function saveProjectToLocalStorage(project) {
  try {
    localStorage.setItem(getProjectStorageKey(), JSON.stringify(project));
    return true;
  } catch (e) {
    console.error('[App] local project save failed:', e);
    return false;
  }
}

function loadProjectFromLocalStorage() {
  try {
    const raw = localStorage.getItem(getProjectStorageKey());
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[App] local project load failed:', e);
    return null;
  }
}

async function fetchProjectFromServer(token) {
  if (!token) return null;

  try {
    const res = await fetch(`${PROJECT_API.get}?token=${encodeURIComponent(token)}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) return null;
    const payload = await res.json();
    return payload?.project || null;
  } catch (e) {
    console.error('[App] project load failed:', e);
    return null;
  }
}

async function saveProjectToServer(project) {
  try {
    const res = await fetch(PROJECT_API.save, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(project),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.ok) {
      throw new Error(payload?.error || `Save failed (${res.status})`);
    }

    return { success: true, project: payload.project || project };
  } catch (e) {
    console.error('[App] project save failed:', e);
    return { success: false, error: e.message };
  }
}

function buildProjectRecord({ status, monogramDataURL, submittedAt } = {}) {
  const formData = collectFormData();
  const token = getProjectToken();
  const nextStatus = status || ActiveProjectRecord?.status || (formData.monogram.line1 || formData.monogram.line2 ? 'in_progress' : 'draft');

  return {
    ...(ActiveProjectRecord || {}),
    token,
    event_slug: ActiveProjectRecord?.event_slug || formData.event_slug,
    client_name: ActiveProjectRecord?.client_name || formData.event_slug,
    event_date: ActiveProjectRecord?.event_date || null,
    status: nextStatus,
    last_saved_at: new Date().toISOString(),
    submitted_at: submittedAt || ActiveProjectRecord?.submitted_at || null,
    project_data: formData,
    monogram_png: monogramDataURL || ActiveProjectRecord?.monogram_png || null,
  };
}

/* ================================================================
   SUBMIT HANDLER
================================================================ */
async function handleSubmit() {
  const submitBtn = document.getElementById('submit-btn');

  if (String(ActiveProjectRecord?.status || '').toLowerCase() === 'approved') {
    setStatus('This project has already been approved and locked by Le Image.', 'success');
    return;
  }

  if (!WizardState.parking) {
    setStatus('Please go back and select a parking option (Step 2).', 'error');
    return;
  }
  if (!WizardState.backdrop) {
    setStatus('Please go back and select a backdrop (Step 3).', 'error');
    return;
  }
  if (!WizardState.printSize) {
    setStatus('Please go back and select a print size (Step 4).', 'error');
    return;
  }

  submitBtn.disabled = true;
  setStatus('Submitting your configuration…', 'loading');

  try {
    const monogramURL = window.MonogramBuilder.exportDataURL();
    const submittedAt = new Date().toISOString();
    const project = buildProjectRecord({
      status: 'submitted',
      monogramDataURL: monogramURL,
      submittedAt,
    });

    saveProjectToLocalStorage(project);
    ActiveProjectRecord = project;

    const token = getProjectToken();
    if (token) {
      const result = await saveProjectToServer(project);
      if (result.success && result.project) ActiveProjectRecord = result.project;
      if (!result.success) console.warn('[App] server submit failed, project kept locally:', result.error);
    }

    showSuccessOverlay(project.client_name || project.event_slug);
    setStatus('Submitted successfully.', 'success');
  } catch (err) {
    console.error('[App] Unexpected submit error:', err);
    setStatus('Something went wrong. Your data has been saved locally. Please try again or contact us.', 'error');
    submitBtn.disabled = false;
  }
}

function setStatus(msg, type) {
  const el = document.getElementById('submit-status');
  if (!el) return;
  el.textContent = msg;
  el.className   = `submit-status ${type}`;
}

function showSuccessOverlay(eventSlug) {
  const overlay = document.getElementById('success-overlay');
  const nameEl  = document.getElementById('success-event-name');
  if (nameEl) nameEl.textContent = eventSlug;
  if (overlay) overlay.classList.remove('hidden');
}

/* ================================================================
   SAVE / LOAD PROJECT
================================================================ */
async function saveProject() {
  if (String(ActiveProjectRecord?.status || '').toLowerCase() === 'approved') {
    showToast('This project is locked because it was already approved.');
    return;
  }

  const project = buildProjectRecord({
    status: ActiveProjectRecord?.status === 'submitted' ? 'submitted' : 'in_progress',
    monogramDataURL: window.MonogramBuilder.exportDataURL(),
  });

  saveProjectToLocalStorage(project);
  ActiveProjectRecord = project;
  updateEventBanner();

  const token = getProjectToken();
  if (token) {
    const result = await saveProjectToServer(project);
    if (result.success && result.project) ActiveProjectRecord = result.project;
  }

  showToast('Project saved. Your link will keep this draft connected to your event.');
  applyProjectLockState();
}

async function loadProject() {
  const token = getProjectToken();
  let project = null;

  if (token) {
    project = await fetchProjectFromServer(token);
  }

  if (!project) {
    project = loadProjectFromLocalStorage();
  }

  if (!project) {
    ActiveProjectRecord = {
      token,
      event_slug: getEventSlug(),
      client_name: getEventSlug(),
      status: 'draft',
      project_data: null,
    };
    updateEventBanner();
    applyProjectLockState();
    return false;
  }

  try {
    ActiveProjectRecord = project;
    updateEventBanner();
    applyProjectLockState();
    const payload = project.project_data || project;

    // Restore props
    if (payload.props) {
      document.querySelectorAll('input[name="props"]').forEach(cb => {
        cb.checked = payload.props.includes(cb.value);
      });
    }

    if (payload.special_instructions || payload.specialInstructions) {
      const ta = document.getElementById('special-instructions');
      if (ta) ta.value = payload.special_instructions || payload.specialInstructions;
    }

    if (payload.parking) {
      WizardState.parking = payload.parking;
      const parkingBtn = document.querySelector(`.toggle-card[data-value="${payload.parking}"]`);
      if (parkingBtn) parkingBtn.classList.add('selected');
      const parkingHidden = document.getElementById('parking-value');
      if (parkingHidden) parkingHidden.value = payload.parking;
    }

    if (payload.backdrop) {
      WizardState.backdrop = payload.backdrop;
      const bdCard = document.querySelector(`.toggle-selectable[data-value="${payload.backdrop}"]`);
      if (bdCard) {
        document.querySelectorAll('.toggle-selectable[data-group="backdrop"]').forEach(c => c.classList.remove('selected'));
        bdCard.classList.add('selected');
      }
      const bdHidden = document.getElementById('backdrop-value');
      if (bdHidden) bdHidden.value = payload.backdrop;
    }

    if (payload.print_size || payload.printSize) {
      const savedPrintSize = payload.print_size || payload.printSize;
      WizardState.printSize = savedPrintSize;
      const psCard = document.querySelector(`.toggle-selectable[data-value="${savedPrintSize}"]`);
      if (psCard) {
        document.querySelectorAll('.toggle-selectable[data-group="print_size"]').forEach(c => c.classList.remove('selected'));
        psCard.classList.add('selected');
      }
      const psHidden = document.getElementById('print-size-value');
      if (psHidden) psHidden.value = savedPrintSize;
    }

    // Restore monogram state
    if (payload.monogram) {
      const m = payload.monogram;
      const mono = window.MonogramBuilder.state;

      if (m.line1) { mono.line1 = m.line1; const el = document.getElementById('mono-line1'); if (el) el.value = m.line1; }
      if (m.line2) { mono.line2 = m.line2; const el = document.getElementById('mono-line2'); if (el) el.value = m.line2; }
      if (m.fontFamily) { mono.fontFamily = m.fontFamily; const el = document.getElementById('mono-font'); if (el) el.value = m.fontFamily; }
      if (m.textColor1) { mono.textColor1 = m.textColor1; const el = document.getElementById('mono-color1'); if (el) el.value = m.textColor1; }
      if (m.textColor2) { mono.textColor2 = m.textColor2; const el = document.getElementById('mono-color2'); if (el) el.value = m.textColor2; }
      if (m.colorsLinked !== undefined) { mono.colorsLinked = m.colorsLinked; ['color-link-toggle','color-link-toggle-2'].forEach(id => { const btn = document.getElementById(id); if (btn) { btn.classList.toggle('linked', m.colorsLinked); btn.textContent = m.colorsLinked ? '🔗' : '🔓'; } }); }
      if (m.frame) { mono.frame = m.frame; mono.flourish = m.frame; }
      if (m.frameColor) { mono.frameColor = m.frameColor; }
    }

    // Navigate to saved step
    if (payload.currentStep && payload.currentStep > 1) {
      goToStep(payload.currentStep);
    }

    return true;
  } catch (e) {
    console.error('Failed to load project:', e);
    return false;
  }
}

function showToast(message) {
  const existing = document.querySelector('.save-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'save-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
