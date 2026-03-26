/**
 * admin.js — Le Image Photo Booth Admin Dashboard
 *
 * Handles:
 *  - Password gate (hardcoded, swap for real auth before production)
 *  - Loading submissions from Supabase + localStorage fallback
 *  - Rendering submission cards with monogram thumbnails
 *  - Search/filter by event name
 *  - Detail modal with full info
 *  - Monogram PNG download
 *  - Export all as JSON
 *
 * SUPABASE CONFIG
 * ───────────────
 * Must match the values in app.js. Copy from there.
 */

'use strict';

/* ================================================================
   CONFIG — keep in sync with app.js
================================================================ */
const SUPABASE_CONFIG = {
  url:     'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
  table:   'submissions',
};

const SUPABASE_ENABLED = (
  SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' &&
  SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

/* Admin password — change before going to production */
const ADMIN_PASSWORD = 'leimage2026';

/* localStorage key — must match app.js */
const LS_KEY = 'leimage_photobooth_submissions';

/* Session flag — avoid re-prompting on page reload during same session */
const SESSION_KEY = 'leimage_admin_auth';

/* ================================================================
   STATE
================================================================ */
let allSubmissions = [];   // raw loaded data
let filteredData   = [];   // after search filter

/* ================================================================
   DOM READY
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  initAuth();
});

/* ================================================================
   UTILITIES
================================================================ */

function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

function $(id) { return document.getElementById(id); }

/* ================================================================
   AUTH GATE
================================================================ */

function initAuth() {
  // Check session flag
  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    showAdminContent();
    return;
  }

  $('login-btn').addEventListener('click', attemptLogin);
  $('admin-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });
}

function attemptLogin() {
  const pw = $('admin-password').value;
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1');
    showAdminContent();
  } else {
    $('login-error').textContent = 'Incorrect password.';
    $('admin-password').value = '';
    $('admin-password').focus();
  }
}

function showAdminContent() {
  $('login-gate').style.display   = 'none';
  $('admin-content').classList.remove('hidden');
  loadSubmissions();

  $('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });

  $('refresh-btn').addEventListener('click', loadSubmissions);

  $('search-input').addEventListener('input', () => {
    const q = $('search-input').value.toLowerCase().trim();
    filteredData = q
      ? allSubmissions.filter(s => {
          const slug = (s.event_slug || s.data?.event_slug || '').toLowerCase();
          return slug.includes(q);
        })
      : [...allSubmissions];
    renderList(filteredData);
  });

  $('export-all-btn').addEventListener('click', exportAllJSON);

  // Modal close
  $('modal-close').addEventListener('click', closeModal);
  $('modal-backdrop').addEventListener('click', closeModal);
}

/* ================================================================
   DATA LOADING
================================================================ */

async function loadSubmissions() {
  const list = $('submissions-list');
  list.innerHTML = '<div class="loading-state">Loading submissions…</div>';

  const results = [];

  // 1. Try Supabase
  if (SUPABASE_ENABLED) {
    try {
      const res = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}?order=submitted_at.desc`,
        {
          headers: {
            'apikey':        SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          },
        }
      );

      if (!res.ok) throw new Error(`Supabase error ${res.status}`);

      const rows = await res.json();
      rows.forEach(row => {
        results.push({
          id:           row.id,
          event_slug:   row.event_slug,
          submitted_at: row.submitted_at,
          monogram_png: row.monogram_png,
          ...(row.data || {}),
          _source: 'supabase',
        });
      });
    } catch (e) {
      console.warn('[Admin] Supabase load failed, using localStorage:', e);
    }
  }

  // 2. Merge localStorage (de-dupe by event_slug + submitted_at)
  try {
    const ls = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    const existingKeys = new Set(results.map(r => `${r.event_slug}|${r.submitted_at}`));

    ls.forEach(item => {
      const key = `${item.event_slug}|${item.submitted_at}`;
      if (!existingKeys.has(key)) {
        results.push({ ...item, _source: 'local' });
      }
    });
  } catch (e) {
    console.warn('[Admin] localStorage load failed:', e);
  }

  // Sort newest first
  results.sort((a, b) =>
    new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)
  );

  allSubmissions = results;
  filteredData   = [...results];

  updateStats(results);
  renderList(results);
}

/* ================================================================
   STATS BAR
================================================================ */

function updateStats(submissions) {
  const now   = new Date();
  const today = now.toDateString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const todayCount = submissions.filter(s => {
    return new Date(s.submitted_at || 0).toDateString() === today;
  }).length;

  const weekCount = submissions.filter(s => {
    return new Date(s.submitted_at || 0) >= weekAgo;
  }).length;

  $('total-count').textContent = submissions.length;
  $('today-count').textContent = todayCount;
  $('week-count').textContent  = weekCount;
}

/* ================================================================
   RENDER LIST
================================================================ */

function renderList(submissions) {
  const list   = $('submissions-list');
  const empty  = $('empty-state');

  list.innerHTML = '';

  if (submissions.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  submissions.forEach((sub, idx) => {
    const card = buildCard(sub, idx);
    list.appendChild(card);
  });
}

function buildCard(sub, idx) {
  const card = document.createElement('div');
  card.className = 'submission-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `View details for ${sub.event_slug}`);

  const dateStr = sub.submitted_at
    ? new Date(sub.submitted_at).toLocaleString()
    : 'Unknown date';

  const mono      = sub.monogram || {};
  const props     = (sub.props || []).join(', ') || '—';
  const backdrop  = sub.backdrop || '—';
  const printSize = sub.print_size || '—';
  const source    = sub._source === 'local' ? ' (local)' : '';

  /* Thumbnail */
  const thumb = document.createElement('div');
  thumb.className = 'submission-thumb';
  if (sub.monogram_png) {
    const img = document.createElement('img');
    img.src = sub.monogram_png;
    img.alt = 'Monogram preview';
    thumb.appendChild(img);
  } else {
    thumb.style.display = 'flex';
    thumb.style.alignItems = 'center';
    thumb.style.justifyContent = 'center';
    thumb.style.color = 'var(--text-muted)';
    thumb.style.fontSize = '1.5rem';
    thumb.textContent = '✦';
  }

  /* Info */
  const info = document.createElement('div');
  info.className = 'submission-info';
  info.innerHTML = `
    <div class="submission-event">${escHtml(sub.event_slug || 'Unknown event')}${escHtml(source)}</div>
    <div class="submission-date">${escHtml(dateStr)}</div>
    <div class="submission-tags">
      <span class="tag">📸 ${escHtml(backdrop)}</span>
      <span class="tag">🖨️ ${escHtml(printSize)}</span>
      ${props !== '—' ? `<span class="tag">🎊 ${escHtml(props)}</span>` : ''}
      ${mono.line1 ? `<span class="tag">✦ ${escHtml(mono.line1)}</span>` : ''}
    </div>
  `;

  /* Actions */
  const actions = document.createElement('div');
  actions.className = 'submission-actions';

  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn btn-ghost btn-sm';
  viewBtn.textContent = 'View';
  viewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openDetailModal(sub);
  });

  if (sub.monogram_png) {
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-secondary btn-sm';
    dlBtn.textContent = '↓ PNG';
    dlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadMonogramPNG(sub);
    });
    actions.appendChild(dlBtn);
  }

  actions.appendChild(viewBtn);
  card.appendChild(thumb);
  card.appendChild(info);
  card.appendChild(actions);

  // Click anywhere on card opens modal
  card.addEventListener('click', () => openDetailModal(sub));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openDetailModal(sub);
  });

  return card;
}

/* ================================================================
   DETAIL MODAL
================================================================ */

function openDetailModal(sub) {
  const modal = $('detail-modal');
  const title = $('modal-title');
  const body  = $('modal-body');

  title.textContent = sub.event_slug || 'Submission';

  const mono      = sub.monogram || {};
  const props     = (sub.props || []).join(', ') || '—';
  const dateStr   = sub.submitted_at
    ? new Date(sub.submitted_at).toLocaleString()
    : '—';

  body.innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">Event</div>
      <div class="detail-row"><span class="detail-key">Event slug</span><span class="detail-val">${escHtml(sub.event_slug || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Submitted</span><span class="detail-val">${escHtml(dateStr)}</span></div>
      <div class="detail-row"><span class="detail-key">Source</span><span class="detail-val">${escHtml(sub._source || '—')}</span></div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Configuration</div>
      <div class="detail-row"><span class="detail-key">Parking</span><span class="detail-val">${escHtml(sub.parking || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Backdrop</span><span class="detail-val">${escHtml(sub.backdrop || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Print size</span><span class="detail-val">${escHtml(sub.print_size || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Props</span><span class="detail-val">${escHtml(props)}</span></div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Monogram</div>
      <div class="detail-row"><span class="detail-key">Line 1</span><span class="detail-val">${escHtml(mono.line1 || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Line 2</span><span class="detail-val">${escHtml(mono.line2 || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Font</span><span class="detail-val">${escHtml(mono.font || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Text color</span><span class="detail-val">${escHtml(mono.text_color || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Background</span><span class="detail-val">${escHtml(mono.bg_color || '—')}</span></div>
      ${sub.monogram_png ? `
        <div style="margin-top:1rem;">
          <div class="detail-key" style="margin-bottom:.5rem;">Preview</div>
          <img src="${sub.monogram_png}" alt="Monogram" class="detail-monogram-preview" />
        </div>
        <div style="margin-top:1rem;">
          <button class="btn btn-secondary btn-sm" onclick="downloadMonogramPNG(currentModalSub)">
            ↓ Download Full-Resolution PNG
          </button>
        </div>
      ` : ''}
    </div>

    ${sub.special_instructions ? `
      <div class="detail-section">
        <div class="detail-section-title">Special Instructions</div>
        <p style="color:var(--text);font-size:.9rem;line-height:1.7;">${escHtml(sub.special_instructions)}</p>
      </div>
    ` : ''}
  `;

  // Expose for inline onclick
  window.currentModalSub = sub;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('detail-modal').classList.add('hidden');
  document.body.style.overflow = '';
  window.currentModalSub = null;
}

/* Close on Escape key */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ================================================================
   DOWNLOAD MONOGRAM PNG
================================================================ */

function downloadMonogramPNG(sub) {
  if (!sub?.monogram_png) return;

  const a    = document.createElement('a');
  const slug = sub.event_slug || 'monogram';
  a.href     = sub.monogram_png;
  a.download = `${slug}-monogram.png`;
  a.click();
}

/* Make available globally for inline onclick in modal */
window.downloadMonogramPNG = downloadMonogramPNG;

/* ================================================================
   EXPORT ALL JSON
================================================================ */

function exportAllJSON() {
  if (allSubmissions.length === 0) {
    alert('No submissions to export.');
    return;
  }

  // Strip monogram_png from export to keep file size reasonable
  const exportData = allSubmissions.map(({ monogram_png, ...rest }) => rest);

  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)],
    { type: 'application/json' }
  );
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `leimage-photobooth-submissions-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ================================================================
   SECURITY HELPER
================================================================ */

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
