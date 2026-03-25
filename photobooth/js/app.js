/**
 * app.js — Le Image Photo Booth Configurator
 *
 * Handles:
 *  - Multi-step wizard navigation & progress bar
 *  - Step validation before advancing
 *  - Toggle selection (deselect on re-click) for backdrop & print size
 *  - Lightbox for all images
 *  - Review step population
 *  - Form submit → localStorage + Supabase
 *
 * SUPABASE CONFIG — replace with your project values
 */

'use strict';

/* ================================================================
   SUPABASE CONFIG
================================================================ */
const SUPABASE_CONFIG = {
  url:     'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
  table:   'submissions',
};

const SUPABASE_ENABLED = (
  SUPABASE_CONFIG.url     !== 'YOUR_SUPABASE_URL' &&
  SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

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
  parseEventSlug();

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

  // Show step 1
  goToStep(1);
}

/* ================================================================
   UTILITIES
================================================================ */
function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

function parseEventSlug() {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('event') || 'demo-event';
  const el     = document.getElementById('event-name');
  if (el) el.textContent = slug;
  return slug;
}

function getEventSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get('event') || 'demo-event';
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

  // If entering step 6 (monogram), sync print size & backdrop
  if (step === 6) {
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

  if (step === 2) {
    if (!WizardState.parking) {
      showError('error-parking', 'Please indicate whether parking is arranged.');
      return false;
    }
  }

  if (step === 3) {
    if (!WizardState.backdrop) {
      showError('error-backdrop', 'Please select a backdrop color.');
      return false;
    }
  }

  if (step === 4) {
    if (!WizardState.printSize) {
      showError('error-print', 'Please select a print size.');
      return false;
    }
  }

  if (step === 6) {
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
  document.querySelectorAll('.toggle-selectable').forEach(card => {
    card.addEventListener('click', (e) => {
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
    // Update monogram backdrop if we're already on step 7
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
    // 2x6 strip: 4 photos stacked (each ~18.5% height) + monogram footer (~20%)
    const photoH = 18.5;
    const photoGap = 1.5;
    const startY = 1.5;
    for (let i = 0; i < 4; i++) {
      const y = startY + i * (photoH + photoGap);
      container.appendChild(makePhotoSlot(3, y, 94, photoH, `Photo ${i + 1}`));
    }
    // Monogram footer
    const mono = document.createElement('div');
    mono.className = 'monogram-placeholder';
    mono.style.cssText = 'left:10%; top:80%; width:80%; height:18%;';
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

    // Monogram bottom-left
    const mono = document.createElement('div');
    mono.className = 'monogram-placeholder';
    mono.style.cssText = 'left:1.5%; top:51%; width:48%; height:47%;';
    addMonogramToPlaceholder(mono);
    container.appendChild(mono);
  }
}

function addMonogramToPlaceholder(container) {
  const srcCanvas = window.MonogramBuilder?.state?.canvas;
  if (!srcCanvas || srcCanvas.width === 0) {
    container.style.color = 'rgba(0,0,0,0.25)';
    container.style.fontSize = '0.65rem';
    container.style.fontFamily = "'Cinzel', serif";
    container.textContent = 'Monogram';
    return;
  }

  // Canvas is square — draw it directly to fill the placeholder
  const miniCanvas = document.createElement('canvas');
  miniCanvas.width = 500;
  miniCanvas.height = 500;
  const ctx = miniCanvas.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0, miniCanvas.width, miniCanvas.height);
  container.appendChild(miniCanvas);
}

/* ================================================================
   COLLECT FORM DATA
================================================================ */
function collectFormData() {
  const mono  = window.MonogramBuilder.state;
  const props = Array.from(document.querySelectorAll('input[name="props"]:checked')).map(el => el.value);

  return {
    event_slug:           getEventSlug(),
    submitted_at:         new Date().toISOString(),
    parking:              WizardState.parking,
    backdrop:             WizardState.backdrop,
    print_size:           WizardState.printSize,
    monogram: {
      line1:          mono.line1,
      line2:          mono.line2,
      font:           mono.fontFamily,
      text_color1:    mono.textColor1,
      text_color2:    mono.textColor2,
      flourish_style: mono.flourish,
      bg_transparent: true,
    },
    props,
    special_instructions: document.getElementById('special-instructions')?.value.trim() || '',
  };
}

/* ================================================================
   LOCAL STORAGE FALLBACK
================================================================ */
const LS_KEY = 'leimage_photobooth_submissions';

function saveToLocalStorage(submission) {
  try {
    const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    existing.push(submission);
    localStorage.setItem(LS_KEY, JSON.stringify(existing));
    return true;
  } catch (e) {
    console.error('[App] localStorage save failed:', e);
    return false;
  }
}

/* ================================================================
   SUPABASE SUBMIT
================================================================ */
async function submitToSupabase(data, monogramDataURL) {
  if (!SUPABASE_ENABLED) return { success: false, error: 'Supabase not configured' };

  const payload = {
    event_slug:   data.event_slug,
    submitted_at: data.submitted_at,
    data:         data,
    monogram_png: monogramDataURL,
  };

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase error ${res.status}: ${errText}`);
    }

    return { success: true, error: null };
  } catch (e) {
    console.error('[App] Supabase submit failed:', e);
    return { success: false, error: e.message };
  }
}

/* ================================================================
   SUBMIT HANDLER
================================================================ */
async function handleSubmit() {
  const submitBtn = document.getElementById('submit-btn');
  const statusEl  = document.getElementById('submit-status');

  // Basic review-step validation
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
  setStatus('Saving your configuration…', 'loading');

  try {
    const formData    = collectFormData();
    const monogramURL = window.MonogramBuilder.exportDataURL();
    const submission  = { ...formData, monogram_png: monogramURL };

    saveToLocalStorage(submission);

    if (SUPABASE_ENABLED) {
      const result = await submitToSupabase(formData, monogramURL);
      if (!result.success) {
        console.warn('[App] Supabase failed, stored locally:', result.error);
      }
    }

    showSuccessOverlay(formData.event_slug);
  } catch (err) {
    console.error('[App] Unexpected submit error:', err);
    setStatus('Something went wrong. Your data has been saved locally — please try again or contact us.', 'error');
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
