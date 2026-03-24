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

  // Submit
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmit);
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
  document.querySelectorAll('.toggle-selectable').forEach(card => {
    card.addEventListener('click', (e) => {
      // If clicking directly on the lightbox-trigger (image area), open lightbox
      // but do NOT toggle the selection state — just select without deselect behavior
      const isImageClick = !!e.target.closest('.lightbox-trigger');
      if (isImageClick) {
        // Still select the card if not already selected, but never deselect via image click
        const group = card.dataset.group;
        const value = card.dataset.value;
        if (!card.classList.contains('selected')) {
          document.querySelectorAll(`.toggle-selectable[data-group="${group}"]`).forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          setGroupValue(group, value);
        }
        return; // lightbox opens via document delegation
      }

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
   LIGHTBOX
================================================================ */
function initLightbox() {
  const lb         = document.getElementById('lightbox');
  const lbImg      = document.getElementById('lightbox-img');
  const lbBackdrop = document.getElementById('lightbox-backdrop');
  const lbClose    = document.getElementById('lightbox-close');

  if (!lb || !lbImg) return;

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.add('hidden');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  // Attach to all current and future lightbox triggers using delegation
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.lightbox-trigger');
    if (!trigger) return;
    e.stopPropagation(); // prevent card toggle

    const src = trigger.dataset.src || trigger.querySelector('img')?.src;
    const alt = trigger.dataset.alt || trigger.querySelector('img')?.alt || '';
    if (src) openLightbox(src, alt);
  });

  lbBackdrop.addEventListener('click', closeLightbox);
  lbClose.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lb.classList.contains('hidden')) {
      closeLightbox();
    }
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
      text_color:     mono.textColor,
      flourish_style: mono.flourishStyle,
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
