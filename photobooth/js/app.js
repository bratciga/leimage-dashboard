/**
 * app.js — Le Image Photo Booth Configurator — Main Application Logic
 *
 * Responsibilities:
 *  - Parse event slug from URL (?event=…)
 *  - Coordinate monogram builder updates (print size sync)
 *  - Form validation
 *  - Submit: save to localStorage + POST to Supabase
 *  - Show success/error states
 *
 * SUPABASE CONFIGURATION
 * ──────────────────────
 * 1. Create a free project at https://supabase.com
 * 2. In your project's SQL editor, create the submissions table:
 *
 *    CREATE TABLE submissions (
 *      id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *      event_slug  text NOT NULL,
 *      submitted_at timestamptz DEFAULT now(),
 *      data        jsonb NOT NULL,
 *      monogram_png text   -- base64 data URL
 *    );
 *
 * 3. Enable Row Level Security (RLS) and add a policy:
 *    - Allow INSERT for anon role
 *    - For admin reads: restrict to authenticated role or use service key
 *
 * 4. Replace SUPABASE_URL and SUPABASE_ANON_KEY below with your values.
 *    Find them in: Project Settings → API
 */

'use strict';

/* ================================================================
   SUPABASE CONFIG — replace with your project values
================================================================ */
const SUPABASE_CONFIG = {
  url:     'YOUR_SUPABASE_URL',       // e.g. https://abcxyz.supabase.co
  anonKey: 'YOUR_SUPABASE_ANON_KEY',  // Project API key (anon/public)
  table:   'submissions',
};

/* Set to false to disable Supabase entirely (localStorage only) */
const SUPABASE_ENABLED = (
  SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' &&
  SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

/* ================================================================
   DOM READY
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setFooterYear();
  parseEventSlug();

  // Initialize monogram builder (defined in monogram.js)
  await window.MonogramBuilder.init();

  // Wire print size → monogram canvas resize
  wirePrintSizeSync();

  // Form submission
  const form = document.getElementById('configurator-form');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
}

/* ================================================================
   UTILITIES
================================================================ */

function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/**
 * Read ?event= from the URL, display it in the banner, and return it.
 */
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
   PRINT SIZE → MONOGRAM SYNC
================================================================ */

function wirePrintSizeSync() {
  const radios = document.querySelectorAll('input[name="print_size"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        window.MonogramBuilder.updatePrintSize(radio.value);
      }
    });
  });
}

/* ================================================================
   FORM VALIDATION
================================================================ */

/**
 * Validate all required fields.
 * Returns { valid: bool, errors: { fieldId: message } }
 */
function validateForm() {
  const errors = {};

  // Parking — required
  const parking = document.querySelector('input[name="parking"]:checked');
  if (!parking) {
    errors['error-parking'] = 'Please indicate whether parking is arranged.';
  }

  // Disclaimer — must be checked
  const disclaimer = document.getElementById('disclaimer-check');
  if (!disclaimer?.checked) {
    errors['error-disclaimer'] = 'Please acknowledge the quality disclaimer to continue.';
  }

  // Backdrop — required
  const backdrop = document.querySelector('input[name="backdrop"]:checked');
  if (!backdrop) {
    errors['error-backdrop'] = 'Please select a backdrop color.';
  }

  // Print size — required
  const printSize = document.querySelector('input[name="print_size"]:checked');
  if (!printSize) {
    errors['error-print'] = 'Please select a print size.';
  }

  // Monogram — at least line 1 must have text
  const mono = window.MonogramBuilder.state;
  if (!mono.line1.trim() && !mono.line2.trim()) {
    errors['error-monogram'] = 'Please enter at least one line of monogram text.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Display validation errors in the DOM.
 * Clears all error fields first.
 */
function showValidationErrors(errors) {
  // Clear all error divs
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.closest('.card, section')?.classList.remove('has-error');
  });

  if (Object.keys(errors).length === 0) return;

  // Show each error and scroll to first
  let firstErrEl = null;
  Object.entries(errors).forEach(([id, msg]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = msg;
      const card = el.closest('.card, section');
      if (card) card.classList.add('has-error');
      if (!firstErrEl) firstErrEl = card || el;
    }
  });

  if (firstErrEl) {
    firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* ================================================================
   COLLECT FORM DATA
================================================================ */

function collectFormData() {
  const mono      = window.MonogramBuilder.state;
  const props     = Array.from(document.querySelectorAll('input[name="props"]:checked'))
                         .map(el => el.value);

  return {
    event_slug:           getEventSlug(),
    submitted_at:         new Date().toISOString(),

    parking:              document.querySelector('input[name="parking"]:checked')?.value || null,
    disclaimer_accepted:  document.getElementById('disclaimer-check')?.checked || false,
    backdrop:             document.querySelector('input[name="backdrop"]:checked')?.value || null,
    print_size:           document.querySelector('input[name="print_size"]:checked')?.value || null,

    monogram: {
      line1:         mono.line1,
      line2:         mono.line2,
      font:          mono.fontFamily,
      text_color:    mono.textColor,
      bg_color:      mono.bgTransparent ? 'transparent' : mono.bgColor,
      bg_transparent: mono.bgTransparent,
      flourish:      mono.flourish,
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

/**
 * Post a submission to Supabase.
 * Returns { success: bool, error: string | null }
 */
async function submitToSupabase(data, monogramDataURL) {
  if (!SUPABASE_ENABLED) {
    return { success: false, error: 'Supabase not configured' };
  }

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
   FORM SUBMIT HANDLER
================================================================ */

async function handleSubmit(e) {
  e.preventDefault();

  const submitBtn    = document.getElementById('submit-btn');
  const statusEl     = document.getElementById('submit-status');

  // Validate
  const { valid, errors } = validateForm();
  showValidationErrors(errors);
  if (!valid) return;

  // Disable button, show loading
  submitBtn.disabled = true;
  setStatus('Saving your configuration…', 'loading');

  try {
    // Collect data
    const formData      = collectFormData();
    const monogramURL   = window.MonogramBuilder.exportDataURL();
    const submission    = { ...formData, monogram_png: monogramURL };

    // 1. Always save to localStorage first (fallback)
    saveToLocalStorage(submission);

    // 2. Try Supabase
    if (SUPABASE_ENABLED) {
      const result = await submitToSupabase(formData, monogramURL);
      if (!result.success) {
        console.warn('[App] Supabase failed, stored locally:', result.error);
        // Don't show error to user — localStorage backup is fine
      }
    }

    // 3. Show success
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
  el.textContent  = msg;
  el.className    = `submit-status ${type}`;
}

function showSuccessOverlay(eventSlug) {
  const overlay   = document.getElementById('success-overlay');
  const nameEl    = document.getElementById('success-event-name');
  if (nameEl) nameEl.textContent = eventSlug;
  if (overlay) overlay.classList.remove('hidden');
}
