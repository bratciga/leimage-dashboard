/**
 * admin.js — Le Image Photo Booth Admin Dashboard
 *
 * Handles:
 *  - Password gate
 *  - Project creation with private token links
 *  - Loading projects from Supabase + local fallback
 *  - Search/filter by client, event, token, status
 *  - Detail modal with copy/open actions
 *  - Status updates and PNG download
 */

'use strict';

const SUPABASE_CONFIG = {
  url:     'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
  table:   'photo_booth_projects',
};

const SUPABASE_ENABLED = (
  SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' &&
  SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

const ADMIN_PASSWORD = 'leimage2026';
const SESSION_KEY = 'leimage_admin_auth';
const LS_PROJECTS_KEY = 'leimage_photobooth_projects';

let allProjects = [];
let filteredData = [];
let currentModalProject = null;

document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  initAuth();
});

function $(id) { return document.getElementById(id); }

function setFooterYear() {
  const el = $('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

function initAuth() {
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
  $('login-gate').style.display = 'none';
  $('admin-content').classList.remove('hidden');

  $('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });

  $('refresh-btn').addEventListener('click', loadProjects);
  $('export-all-btn').addEventListener('click', exportAllJSON);
  $('create-project-btn').addEventListener('click', createProject);
  $('modal-close').addEventListener('click', closeModal);
  $('modal-backdrop').addEventListener('click', closeModal);

  $('client-name-input').addEventListener('input', syncSlugFromClient);
  $('event-slug-input').addEventListener('input', () => {
    $('event-slug-input').dataset.touched = $('event-slug-input').value.trim() ? '1' : '';
  });
  $('search-input').addEventListener('input', applySearch);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  loadProjects();
}

function syncSlugFromClient() {
  const slugInput = $('event-slug-input');
  if (!slugInput) return;
  if (slugInput.dataset.touched === '1') return;
  slugInput.value = slugify($('client-name-input').value || '');
}

function applySearch() {
  const q = ($('search-input').value || '').toLowerCase().trim();
  filteredData = q
    ? allProjects.filter((project) => {
        const haystack = [
          project.client_name,
          project.event_slug,
          project.token,
          project.status,
          project.event_date,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
    : [...allProjects];
  renderList(filteredData);
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function generateToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return 'pb_' + Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 28);
}

function getBaseClientUrl() {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/admin\.html$/, 'index.html');
  url.search = '';
  url.hash = '';
  return url.toString();
}

function buildProjectLink(token) {
  return `${getBaseClientUrl()}?project=${encodeURIComponent(token)}`;
}

function setCreateStatus(message, type = '') {
  const el = $('create-project-status');
  if (!el) return;
  el.textContent = message || '';
  el.className = `submit-status ${type}`.trim();
}

function loadLocalProjects() {
  try {
    return JSON.parse(localStorage.getItem(LS_PROJECTS_KEY) || '[]');
  } catch (e) {
    console.error('[Admin] local project load failed:', e);
    return [];
  }
}

function saveLocalProjects(projects) {
  localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects));
}

function upsertLocalProject(project) {
  const existing = loadLocalProjects();
  const idx = existing.findIndex((p) => p.token === project.token);
  if (idx >= 0) existing[idx] = { ...existing[idx], ...project };
  else existing.unshift(project);
  saveLocalProjects(existing);
}

async function fetchProjectsFromSupabase() {
  if (!SUPABASE_ENABLED) return [];

  const res = await fetch(
    `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}?select=*&order=created_at.desc.nullslast,last_saved_at.desc.nullslast`,
    {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Supabase load error ${res.status}`);
  }

  return res.json();
}

async function insertProjectToSupabase(project) {
  const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(project),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase create error ${res.status}: ${errText}`);
  }

  const rows = await res.json();
  return rows[0] || null;
}

async function patchProjectStatus(token, status) {
  if (!SUPABASE_ENABLED || !token) return null;

  const res = await fetch(
    `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}?token=eq.${encodeURIComponent(token)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase status error ${res.status}: ${errText}`);
  }

  const rows = await res.json();
  return rows[0] || null;
}

async function loadProjects() {
  const list = $('submissions-list');
  list.innerHTML = '<div class="loading-state">Loading projects…</div>';

  let projects = [];

  if (SUPABASE_ENABLED) {
    try {
      projects = await fetchProjectsFromSupabase();
    } catch (e) {
      console.warn('[Admin] Supabase load failed, using local fallback:', e);
    }
  }

  const localProjects = loadLocalProjects();
  const seen = new Set(projects.map((p) => p.token));
  localProjects.forEach((project) => {
    if (!seen.has(project.token)) projects.push(project);
  });

  projects.sort((a, b) => {
    const aTime = new Date(a.submitted_at || a.last_saved_at || a.created_at || 0).getTime();
    const bTime = new Date(b.submitted_at || b.last_saved_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  allProjects = projects;
  filteredData = [...projects];
  updateStats(projects);
  renderList(projects);
}

function updateStats(projects) {
  const drafts = projects.filter((p) => ['draft', 'invited', 'in_progress'].includes(p.status || 'draft')).length;
  const submitted = projects.filter((p) => ['submitted', 'approved'].includes(p.status || '')).length;

  $('total-count').textContent = projects.length;
  $('draft-count').textContent = drafts;
  $('submitted-count').textContent = submitted;
}

function renderList(projects) {
  const list = $('submissions-list');
  const empty = $('empty-state');
  list.innerHTML = '';

  if (!projects.length) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  projects.forEach((project) => list.appendChild(buildCard(project)));
}

function normalizeStatus(status) {
  return (status || 'draft').toLowerCase();
}

function formatStatus(status) {
  const normalized = normalizeStatus(status);
  if (normalized === 'in_progress') return 'In Progress';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function buildCard(project) {
  const card = document.createElement('div');
  card.className = 'submission-card';
  card.tabIndex = 0;

  const thumb = document.createElement('div');
  thumb.className = 'submission-thumb';
  if (project.monogram_png) {
    const img = document.createElement('img');
    img.src = project.monogram_png;
    img.alt = 'Monogram preview';
    thumb.appendChild(img);
  } else {
    thumb.style.display = 'flex';
    thumb.style.alignItems = 'center';
    thumb.style.justifyContent = 'center';
    thumb.textContent = '✦';
  }

  const info = document.createElement('div');
  info.className = 'submission-info';
  const lastActivity = project.submitted_at || project.last_saved_at || project.created_at;
  const lastActivityLabel = lastActivity ? new Date(lastActivity).toLocaleString() : 'No activity yet';
  const status = normalizeStatus(project.status);
  const payload = project.project_data || {};
  const tags = [
    payload.print_size ? `🖨️ ${payload.print_size}` : '',
    payload.backdrop ? `🎨 ${payload.backdrop}` : '',
    project.event_date ? `📅 ${project.event_date}` : '',
    project.token ? `🔑 ${project.token.slice(0, 10)}…` : '',
  ].filter(Boolean);

  info.innerHTML = `
    <div class="submission-event">${escHtml(project.client_name || project.event_slug || 'Untitled Project')}</div>
    <div class="submission-date">${escHtml(project.event_slug || 'No event slug')}</div>
    <div class="submission-status-row">
      <span class="status-pill status-pill--${escHtml(status)}">${escHtml(formatStatus(status))}</span>
      <span class="submission-date">Last activity: ${escHtml(lastActivityLabel)}</span>
    </div>
    <div class="submission-tags">${tags.map((tag) => `<span class="tag">${escHtml(tag)}</span>`).join('')}</div>
  `;

  const actions = document.createElement('div');
  actions.className = 'submission-actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn-secondary btn-sm';
  copyBtn.textContent = 'Copy Link';
  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await copyText(buildProjectLink(project.token));
    setCreateStatus(`Copied link for ${project.client_name || project.event_slug}.`, 'success');
  });

  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn btn-ghost btn-sm';
  viewBtn.textContent = 'View';
  viewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openDetailModal(project);
  });

  actions.appendChild(copyBtn);
  actions.appendChild(viewBtn);

  card.appendChild(thumb);
  card.appendChild(info);
  card.appendChild(actions);
  card.addEventListener('click', () => openDetailModal(project));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openDetailModal(project);
  });

  return card;
}

async function createProject() {
  const clientName = ($('client-name-input').value || '').trim();
  const eventSlug = slugify(($('event-slug-input').value || clientName).trim());
  const eventDate = $('event-date-input').value || null;

  if (!clientName) {
    setCreateStatus('Client name is required.', 'error');
    return;
  }
  if (!eventSlug) {
    setCreateStatus('Event slug is required.', 'error');
    return;
  }

  const token = generateToken();
  const project = {
    token,
    client_name: clientName,
    event_slug: eventSlug,
    event_date: eventDate,
    status: 'invited',
    created_at: new Date().toISOString(),
    last_saved_at: null,
    submitted_at: null,
    project_data: {
      project_token: token,
      client_name: clientName,
      event_slug: eventSlug,
      event_date: eventDate,
      currentStep: 1,
    },
    monogram_png: null,
  };

  setCreateStatus('Creating private client link…', 'loading');

  try {
    let created = project;
    if (SUPABASE_ENABLED) {
      created = await insertProjectToSupabase(project);
    }
    upsertLocalProject(created);
    $('client-name-input').value = '';
    $('event-slug-input').value = '';
    $('event-slug-input').dataset.touched = '';
    $('event-date-input').value = '';
    await copyText(buildProjectLink(created.token));
    setCreateStatus(`Project created and link copied for ${created.client_name}.`, 'success');
    await loadProjects();
  } catch (e) {
    console.error('[Admin] project create failed:', e);
    setCreateStatus(`Project create failed: ${e.message}`, 'error');
  }
}

function openDetailModal(project) {
  currentModalProject = project;
  const body = $('modal-body');
  const title = $('modal-title');
  const payload = project.project_data || {};
  const link = buildProjectLink(project.token);

  title.textContent = project.client_name || project.event_slug || 'Project';
  body.innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">Project</div>
      <div class="detail-row"><span class="detail-key">Client</span><span class="detail-val">${escHtml(project.client_name || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Event slug</span><span class="detail-val">${escHtml(project.event_slug || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Event date</span><span class="detail-val">${escHtml(project.event_date || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val">${escHtml(formatStatus(project.status || 'draft'))}</span></div>
      <div class="detail-row"><span class="detail-key">Token</span><span class="detail-val">${escHtml(project.token || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Created</span><span class="detail-val">${escHtml(formatDate(project.created_at))}</span></div>
      <div class="detail-row"><span class="detail-key">Last saved</span><span class="detail-val">${escHtml(formatDate(project.last_saved_at))}</span></div>
      <div class="detail-row"><span class="detail-key">Submitted</span><span class="detail-val">${escHtml(formatDate(project.submitted_at))}</span></div>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1rem;">
        <button class="btn btn-secondary btn-sm" id="modal-copy-link">Copy Client Link</button>
        <button class="btn btn-ghost btn-sm" id="modal-open-link">Open Client Link</button>
        <button class="btn btn-ghost btn-sm" id="modal-mark-submitted">Mark Submitted</button>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Configuration</div>
      <div class="detail-row"><span class="detail-key">Parking</span><span class="detail-val">${escHtml(payload.parking || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Backdrop</span><span class="detail-val">${escHtml(payload.backdrop || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Print size</span><span class="detail-val">${escHtml(payload.print_size || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Props</span><span class="detail-val">${escHtml((payload.props || []).join(', ') || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Notes</span><span class="detail-val">${escHtml(payload.special_instructions || '—')}</span></div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Monogram</div>
      <div class="detail-row"><span class="detail-key">Line 1</span><span class="detail-val">${escHtml(payload.monogram?.line1 || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Line 2</span><span class="detail-val">${escHtml(payload.monogram?.line2 || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Font</span><span class="detail-val">${escHtml(payload.monogram?.font || payload.monogram?.fontFamily || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Text color</span><span class="detail-val">${escHtml(payload.monogram?.text_color1 || '—')}</span></div>
      ${project.monogram_png ? `
        <div style="margin-top:1rem;">
          <img src="${project.monogram_png}" alt="Monogram" class="detail-monogram-preview" />
        </div>
        <div style="margin-top:1rem;display:flex;gap:.75rem;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" id="modal-download-png">↓ Download PNG</button>
        </div>
      ` : '<p style="color:var(--text-muted);margin-top:1rem;">No monogram submitted yet.</p>'}
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Client Link</div>
      <p style="word-break:break-all;color:var(--text);font-size:.9rem;">${escHtml(link)}</p>
    </div>
  `;

  $('detail-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  $('modal-copy-link')?.addEventListener('click', async () => {
    await copyText(link);
    setCreateStatus(`Copied link for ${project.client_name || project.event_slug}.`, 'success');
  });

  $('modal-open-link')?.addEventListener('click', () => {
    window.open(link, '_blank', 'noopener');
  });

  $('modal-download-png')?.addEventListener('click', () => downloadMonogramPNG(project));
  $('modal-mark-submitted')?.addEventListener('click', async () => {
    await updateProjectStatus(project, 'submitted');
  });
}

function closeModal() {
  $('detail-modal').classList.add('hidden');
  document.body.style.overflow = '';
  currentModalProject = null;
}

async function updateProjectStatus(project, status) {
  try {
    let updated = { ...project, status };
    if (SUPABASE_ENABLED) {
      updated = await patchProjectStatus(project.token, status) || updated;
    }
    upsertLocalProject(updated);
    setCreateStatus(`Updated ${updated.client_name || updated.event_slug} to ${formatStatus(status)}.`, 'success');
    closeModal();
    await loadProjects();
  } catch (e) {
    console.error('[Admin] status update failed:', e);
    setCreateStatus(`Status update failed: ${e.message}`, 'error');
  }
}

function downloadMonogramPNG(project) {
  if (!project?.monogram_png) return;
  const a = document.createElement('a');
  a.href = project.monogram_png;
  a.download = `${project.event_slug || 'monogram'}-monogram.png`;
  a.click();
}

function exportAllJSON() {
  if (!allProjects.length) {
    alert('No projects to export.');
    return;
  }

  const blob = new Blob([JSON.stringify(allProjects, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leimage-photobooth-projects-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

function formatDate(value) {
  if (!value) return '—';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? String(value) : dt.toLocaleString();
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.downloadMonogramPNG = downloadMonogramPNG;
