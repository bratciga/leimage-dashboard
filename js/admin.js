/**
 * admin.js — Le Image Photo Booth Admin Dashboard
 *
 * Handles:
 *  - Password gate
 *  - Project creation with private token links
 *  - Loading projects from PHP JSON backend + local fallback
 *  - Search/filter by client, event, token, status
 *  - Detail modal with copy/open actions
 *  - Status updates and PNG download
 */

'use strict';

const ADMIN_PASSWORD = 'leimage2026';
const SESSION_KEY = 'leimage_admin_auth';
const LS_PROJECTS_KEY = 'leimage_photobooth_projects';
const API = {
  create: 'api/create-project.php',
  list: 'api/list-projects.php',
  save: 'api/save-project.php',
};

let allProjects = [];
let filteredData = [];
let lastCreatedLink = '';
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
  if (!slugInput || slugInput.dataset.touched === '1') return;
  slugInput.value = slugify($('client-name-input').value || '');
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

function getBaseClientUrl() {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/admin(?:-clients)?\.html$/, 'index.html');
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

function updateCreatedLink(link = '') {
  lastCreatedLink = link;
  const wrap = $('created-link-wrap');
  const value = $('created-link-value');
  const copyBtn = $('created-link-copy-btn');
  const openBtn = $('created-link-open-btn');
  if (!wrap || !value || !copyBtn || !openBtn) return;

  if (!link) {
    wrap.classList.add('hidden');
    value.textContent = '—';
    return;
  }

  wrap.classList.remove('hidden');
  value.textContent = link;
  copyBtn.onclick = () => copyText(link);
  openBtn.onclick = () => window.open(link, '_blank', 'noopener');
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
  const idx = existing.findIndex((item) => item.token === project.token);
  if (idx >= 0) existing[idx] = { ...existing[idx], ...project };
  else existing.unshift(project);
  saveLocalProjects(existing);
}

async function apiGet(url) {
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) throw new Error(payload?.error || `Request failed (${res.status})`);
  return payload;
}

async function apiPost(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) throw new Error(payload?.error || `Request failed (${res.status})`);
  return payload;
}

async function loadProjects() {
  const list = $('submissions-list');
  list.innerHTML = '<div class="loading-state">Loading projects…</div>';

  let projects = [];
  try {
    const payload = await apiGet(API.list);
    projects = payload.projects || [];
  } catch (e) {
    console.warn('[Admin] server project load failed, using local fallback:', e);
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
  const drafts = projects.filter((p) => ['draft', 'invited', 'in_progress'].includes(normalizeStatus(p.status))).length;
  const submitted = projects.filter((p) => ['submitted', 'approved'].includes(normalizeStatus(p.status))).length;

  $('total-count').textContent = projects.length;
  $('draft-count').textContent = drafts;
  $('submitted-count').textContent = submitted;
}

function applySearch() {
  const q = ($('search-input').value || '').toLowerCase().trim();
  filteredData = q
    ? allProjects.filter((project) => [
        project.client_name,
        project.event_slug,
        project.token,
        project.status,
        project.event_date,
      ].filter(Boolean).join(' ').toLowerCase().includes(q))
    : [...allProjects];
  renderList(filteredData);
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
  return String(status || 'draft').toLowerCase();
}

function formatStatus(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'in_progress'
    ? 'In Progress'
    : normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

  const payload = project.project_data || {};
  const status = normalizeStatus(project.status);
  const lastActivity = project.submitted_at || project.last_saved_at || project.created_at;
  const tags = [
    payload.print_size ? `🖨️ ${payload.print_size}` : '',
    payload.backdrop ? `🎨 ${payload.backdrop}` : '',
    project.event_date ? `📅 ${project.event_date}` : '',
    project.token ? `🔑 ${project.token.slice(0, 10)}…` : '',
  ].filter(Boolean);

  const info = document.createElement('div');
  info.className = 'submission-info';
  info.innerHTML = `
    <div class="submission-event">${escHtml(project.client_name || project.event_slug || 'Untitled Project')}</div>
    <div class="submission-date">${escHtml(project.event_slug || 'No event slug')}</div>
    <div class="submission-status-row">
      <span class="status-pill status-pill--${escHtml(status)}">${escHtml(formatStatus(status))}</span>
      <span class="submission-date">Last activity: ${escHtml(formatDate(lastActivity))}</span>
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
  const client_name = ($('client-name-input').value || '').trim();
  const event_slug = slugify(($('event-slug-input').value || client_name).trim());
  const event_date = $('event-date-input').value || null;

  if (!client_name) {
    setCreateStatus('Client name is required.', 'error');
    return;
  }
  if (!event_slug) {
    setCreateStatus('Event slug is required.', 'error');
    return;
  }

  setCreateStatus('Creating private client link…', 'loading');

  try {
    const payload = await apiPost(API.create, { client_name, event_slug, event_date });
    const project = payload.project;
    const link = buildProjectLink(project.token);
    upsertLocalProject(project);

    $('client-name-input').value = '';
    $('event-slug-input').value = '';
    $('event-slug-input').dataset.touched = '';
    $('event-date-input').value = '';

    await copyText(link);
    updateCreatedLink(link);
    setCreateStatus(`Project created and link copied for ${project.client_name}.`, 'success');
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
  const normalizedStatus = normalizeStatus(project.status);

  title.textContent = project.client_name || project.event_slug || 'Project';
  body.innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">Project</div>
      <div class="detail-edit-grid">
        <div class="field-group">
          <label class="field-label" for="modal-client-name">Client</label>
          <input id="modal-client-name" class="text-input" type="text" value="${escAttr(project.client_name || '')}" />
        </div>
        <div class="field-group">
          <label class="field-label" for="modal-event-slug">Event slug</label>
          <input id="modal-event-slug" class="text-input" type="text" value="${escAttr(project.event_slug || '')}" />
          <div class="field-help">Safe to edit. The private client link stays the same because it uses the token, not the slug.</div>
        </div>
        <div class="field-group">
          <label class="field-label" for="modal-event-date">Event date</label>
          <input id="modal-event-date" class="text-input" type="date" value="${escAttr(project.event_date || '')}" />
        </div>
        <div class="field-group">
          <label class="field-label" for="modal-project-status">Status</label>
          <select id="modal-project-status" class="select-input">
            ${buildStatusOptions(normalizedStatus)}
          </select>
        </div>
      </div>
      <div class="detail-row"><span class="detail-key">Token</span><span class="detail-val">${escHtml(project.token || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Created</span><span class="detail-val">${escHtml(formatDate(project.created_at))}</span></div>
      <div class="detail-row"><span class="detail-key">Last saved</span><span class="detail-val">${escHtml(formatDate(project.last_saved_at))}</span></div>
      <div class="detail-row"><span class="detail-key">Submitted</span><span class="detail-val">${escHtml(formatDate(project.submitted_at))}</span></div>
      <div class="detail-actions-row">
        <button class="btn btn-primary btn-sm" id="modal-save-project-details">Save Client Details</button>
        <button class="btn btn-secondary btn-sm" id="modal-copy-link">Copy Client Link</button>
        <button class="btn btn-ghost btn-sm" id="modal-open-link">Open Client Link</button>
        <button class="btn btn-ghost btn-sm" id="modal-mark-submitted">Mark Submitted</button>
        <button class="btn btn-primary btn-sm" id="modal-mark-approved">Approve & Lock</button>
        <button class="btn btn-ghost btn-sm" id="modal-reopen-project">Reopen</button>
      </div>
      <div id="modal-save-status" class="submit-status" aria-live="polite"></div>
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
        <div class="detail-actions-row" style="margin-top:1rem;">
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
  $('modal-open-link')?.addEventListener('click', () => window.open(link, '_blank', 'noopener'));
  $('modal-download-png')?.addEventListener('click', () => downloadMonogramPNG(project));
  $('modal-mark-submitted')?.addEventListener('click', async () => updateProjectStatus(project, 'submitted'));
  $('modal-mark-approved')?.addEventListener('click', async () => updateProjectStatus(project, 'approved'));
  $('modal-reopen-project')?.addEventListener('click', async () => updateProjectStatus(project, 'in_progress'));
  $('modal-save-project-details')?.addEventListener('click', async () => saveProjectDetails(project));
}

function closeModal() {
  $('detail-modal').classList.add('hidden');
  document.body.style.overflow = '';
  currentModalProject = null;
}

async function updateProjectStatus(project, status) {
  try {
    const updatedProject = {
      ...project,
      status,
      last_saved_at: new Date().toISOString(),
      submitted_at: status === 'submitted' && !project.submitted_at ? new Date().toISOString() : project.submitted_at,
    };
    const payload = await apiPost(API.save, updatedProject);
    upsertLocalProject(payload.project);
    setCreateStatus(`Updated ${payload.project.client_name || payload.project.event_slug} to ${formatStatus(status)}.`, 'success');
    closeModal();
    await loadProjects();
  } catch (e) {
    console.error('[Admin] status update failed:', e);
    setCreateStatus(`Status update failed: ${e.message}`, 'error');
  }
}

async function saveProjectDetails(project) {
  const clientName = ($('modal-client-name')?.value || '').trim();
  const eventSlug = slugify(($('modal-event-slug')?.value || '').trim());
  const eventDate = ($('modal-event-date')?.value || '').trim() || null;
  const status = normalizeStatus($('modal-project-status')?.value || project.status);
  const statusEl = $('modal-save-status');
  const saveBtn = $('modal-save-project-details');

  if (!clientName) {
    if (statusEl) {
      statusEl.textContent = 'Client name is required.';
      statusEl.className = 'submit-status error';
    }
    return;
  }

  if (!eventSlug) {
    if (statusEl) {
      statusEl.textContent = 'Event slug is required.';
      statusEl.className = 'submit-status error';
    }
    return;
  }

  const updatedProject = {
    ...project,
    client_name: clientName,
    event_slug: eventSlug,
    event_date: eventDate,
    status,
    last_saved_at: new Date().toISOString(),
    project_data: {
      ...(project.project_data || {}),
      client_name: clientName,
      event_slug: eventSlug,
      event_date: eventDate,
    },
  };

  if (status === 'submitted' && !updatedProject.submitted_at) {
    updatedProject.submitted_at = new Date().toISOString();
  }
  if (status !== 'submitted' && status !== 'approved') {
    updatedProject.submitted_at = project.submitted_at || null;
  }

  if (saveBtn) saveBtn.disabled = true;
  if (statusEl) {
    statusEl.textContent = 'Saving client details…';
    statusEl.className = 'submit-status loading';
  }

  try {
    const payload = await apiPost(API.save, updatedProject);
    upsertLocalProject(payload.project);
    if (statusEl) {
      statusEl.textContent = 'Client details updated.';
      statusEl.className = 'submit-status success';
    }
    setCreateStatus(`Updated ${payload.project.client_name || payload.project.event_slug}.`, 'success');
    currentModalProject = payload.project;
    await loadProjects();
    openDetailModal(payload.project);
  } catch (e) {
    console.error('[Admin] project detail save failed:', e);
    if (statusEl) {
      statusEl.textContent = `Save failed: ${e.message}`;
      statusEl.className = 'submit-status error';
    }
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

function buildStatusOptions(selectedStatus) {
  return ['invited', 'draft', 'in_progress', 'submitted', 'approved']
    .map((status) => `<option value="${status}"${status === selectedStatus ? ' selected' : ''}>${escHtml(formatStatus(status))}</option>`)
    .join('');
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

function escAttr(str) {
  return escHtml(str).replace(/`/g, '&#096;');
}

window.downloadMonogramPNG = downloadMonogramPNG;
