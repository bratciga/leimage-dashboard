/**
 * admin.js — Le Image Photo Booth Admin Dashboard
 */

'use strict';

const ADMIN_PASSWORD = 'leimage2026';
const SESSION_KEY = 'leimage_admin_auth';
const LS_PROJECTS_KEY = 'leimage_photobooth_projects';
const API = {
  create: 'api/create-project.php',
  list: 'api/list-projects.php',
  save: 'api/save-project.php',
  remove: 'api/delete-project.php',
};

let allProjects = [];
let filteredData = [];
let lastCreatedLink = '';
let currentModalProject = null;
let currentSort = 'recent';

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
  $('create-project-btn').addEventListener('click', createProject);
  $('modal-close').addEventListener('click', closeModal);
  $('modal-backdrop').addEventListener('click', closeModal);
  $('client-name-input').addEventListener('input', syncSlugFromClient);
  $('client-name-input').addEventListener('keydown', handleCreateFieldEnter);
  $('event-date-input').addEventListener('keydown', handleCreateFieldEnter);
  $('search-input').addEventListener('input', applySearch);
  $('sort-select').addEventListener('change', (event) => {
    currentSort = event.target.value || 'recent';
    applySearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  loadProjects();
}

function syncSlugFromClient() {
  const slugInput = $('event-slug-input');
  if (!slugInput) return;
  slugInput.value = slugify(getCreateFieldValue('client-name-input'));
}

function handleCreateFieldEnter(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  createProject();
}

function getCreateFieldValue(id) {
  const el = $(id);
  return el && typeof el.value === 'string' ? el.value : '';
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
  url.pathname = url.pathname.replace(/admin(?:-clients)?\.html$/, 'client.html');
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

function removeLocalProject(token) {
  const existing = loadLocalProjects().filter((item) => item.token !== token);
  saveLocalProjects(existing);
}

async function apiGet(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) throw new Error(payload?.error || `Request failed (${res.status})`);
  return payload;
}

async function apiPost(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
  const merged = new Map();
  projects.forEach((project) => merged.set(project.token, project));
  localProjects.forEach((project) => {
    if (!merged.has(project.token)) merged.set(project.token, project);
  });

  allProjects = Array.from(merged.values());
  updateStats(allProjects);
  applySearch();
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
  const filtered = q
    ? allProjects.filter((project) => [
        project.client_name,
        project.event_slug,
        project.status,
        project.event_date,
      ].filter(Boolean).join(' ').toLowerCase().includes(q))
    : [...allProjects];

  filteredData = sortProjects(filtered, currentSort);
  renderList(filteredData);
}

function sortProjects(projects, sortKey) {
  const sorted = [...projects];

  sorted.sort((a, b) => {
    if (sortKey === 'name_asc') {
      return compareText(a.client_name || a.event_slug, b.client_name || b.event_slug);
    }
    if (sortKey === 'name_desc') {
      return compareText(b.client_name || b.event_slug, a.client_name || a.event_slug);
    }
    if (sortKey === 'event_date_asc') {
      return compareDateValue(a.event_date, b.event_date, 'asc') || compareText(a.client_name || a.event_slug, b.client_name || b.event_slug);
    }
    if (sortKey === 'event_date_desc') {
      return compareDateValue(a.event_date, b.event_date, 'desc') || compareText(a.client_name || a.event_slug, b.client_name || b.event_slug);
    }

    const aTime = new Date(a.submitted_at || a.last_saved_at || a.created_at || 0).getTime();
    const bTime = new Date(b.submitted_at || b.last_saved_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  return sorted;
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), undefined, { sensitivity: 'base' });
}

function compareDateValue(a, b, direction = 'asc') {
  const aTime = a ? new Date(a).getTime() : Number.NaN;
  const bTime = b ? new Date(b).getTime() : Number.NaN;
  const aMissing = Number.isNaN(aTime);
  const bMissing = Number.isNaN(bTime);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction === 'desc' ? bTime - aTime : aTime - bTime;
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
  thumb.appendChild(createMonogramPreviewNode(project, { className: 'submission-thumb-image' }));

  const payload = project.project_data || {};
  const status = normalizeStatus(project.status);
  const lastActivity = project.submitted_at || project.last_saved_at || project.created_at;
  const tags = [
    payload.print_size ? `🖨️ ${payload.print_size}` : '',
    payload.backdrop ? `🎨 ${payload.backdrop}` : '',
    payload.parking ? `🅿️ ${payload.parking === 'yes' ? 'Parking confirmed' : 'Parking needed'}` : '',
  ].filter(Boolean);

  const info = document.createElement('div');
  info.className = 'submission-info';
  info.innerHTML = `
    <div class="submission-date submission-date--event">${escHtml(project.event_date ? formatEventDate(project.event_date) : 'No event date')}</div>
    <div class="submission-event">${escHtml(project.client_name || project.event_slug || 'Untitled Project')}</div>
    <div class="submission-status-row">
      <span class="status-pill status-pill--${escHtml(status)}">${escHtml(formatStatus(status))}</span>
      <span class="submission-date">Last activity: ${escHtml(formatDate(lastActivity))}</span>
    </div>
    <div class="submission-tags">${tags.length ? tags.map((tag) => `<span class="tag">${escHtml(tag)}</span>`).join('') : '<span class="tag">No selections saved yet</span>'}</div>
  `;

  const actions = document.createElement('div');
  actions.className = 'submission-actions';

  const copyBtn = buildActionButton('Copy Link', 'btn btn-secondary btn-sm', async (e) => {
    e.stopPropagation();
    await copyText(buildProjectLink(project.token));
    setCreateStatus(`Copied link for ${project.client_name || project.event_slug}.`, 'success');
  });

  const downloadBtn = buildActionButton('Download', 'btn btn-secondary btn-sm', async (e) => {
    e.stopPropagation();
    await downloadMonogramPNG(project);
  });
  downloadBtn.disabled = !hasMonogramPreview(project);

  const viewBtn = buildActionButton('View', 'btn btn-ghost btn-sm', (e) => {
    e.stopPropagation();
    openDetailModal(project);
  });

  const deleteBtn = buildActionButton('Delete', 'btn btn-ghost btn-sm btn-danger-lite', async (e) => {
    e.stopPropagation();
    await confirmDeleteProject(project);
  });

  actions.append(copyBtn, downloadBtn, viewBtn, deleteBtn);
  card.append(thumb, info, actions);

  card.addEventListener('click', () => openDetailModal(project));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetailModal(project);
    }
  });

  return card;
}

function buildActionButton(label, className, handler) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener('click', handler);
  return btn;
}

async function createProject() {
  const client_name = getCreateFieldValue('client-name-input').trim();
  const event_slug = slugify((getCreateFieldValue('event-slug-input') || client_name).trim());
  const event_date = getCreateFieldValue('event-date-input') || null;

  if (!client_name) {
    setCreateStatus('Client name is required.', 'error');
    return;
  }
  if (!event_slug) {
    setCreateStatus('Event slug could not be generated.', 'error');
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
  const hasPreview = hasMonogramPreview(project);

  title.textContent = project.client_name || project.event_slug || 'Project';
  body.innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">Project</div>
      <div class="detail-row"><span class="detail-key">Client link</span><span class="detail-val" style="word-break:break-all;">${escHtml(link)}</span></div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Configuration</div>
      <div class="detail-row"><span class="detail-key">Props</span><span class="detail-val">${escHtml((payload.props || []).join(', ') || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Parking</span><span class="detail-val">${escHtml(payload.parking || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Backdrop</span><span class="detail-val">${escHtml(payload.backdrop || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Print size</span><span class="detail-val">${escHtml(payload.print_size || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Notes</span><span class="detail-val">${escHtml(payload.special_instructions || '—')}</span></div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Monogram</div>
      <div class="detail-row"><span class="detail-key">Names</span><span class="detail-val">${escHtml(payload.monogram?.line1 || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Date line</span><span class="detail-val">${escHtml(payload.monogram?.line2 || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Font</span><span class="detail-val">${escHtml(payload.monogram?.font || payload.monogram?.fontFamily || '—')}</span></div>
      <div class="detail-row"><span class="detail-key">Text color</span><span class="detail-val">${escHtml(payload.monogram?.text_color1 || '—')}</span></div>
      <div id="modal-monogram-preview-wrap" style="margin-top:1rem;"></div>
      ${hasPreview ? '<div class="detail-actions-row" style="margin-top:1rem;"><button class="btn btn-secondary btn-sm" id="modal-download-png">↓ Download PNG</button></div>' : '<p style="color:var(--text-muted);margin-top:1rem;">No monogram saved yet.</p>'}
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Activity</div>
      <div class="detail-row"><span class="detail-key">Created</span><span class="detail-val">${escHtml(formatDate(project.created_at))}</span></div>
      <div class="detail-row"><span class="detail-key">Last saved</span><span class="detail-val">${escHtml(formatDate(project.last_saved_at))}</span></div>
      <div class="detail-row"><span class="detail-key">Submitted</span><span class="detail-val">${escHtml(formatDate(project.submitted_at))}</span></div>
      <div class="detail-actions-row">
        <button class="btn btn-ghost btn-sm btn-danger-lite" id="modal-delete-project">Delete Project</button>
      </div>
    </div>
  `;

  const previewWrap = $('modal-monogram-preview-wrap');
  if (previewWrap && hasPreview) {
    const previewNode = createMonogramPreviewNode(project, { className: 'detail-monogram-preview' });
    previewWrap.appendChild(previewNode);
  }

  $('detail-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  $('modal-download-png')?.addEventListener('click', () => downloadMonogramPNG(project));
  $('modal-delete-project')?.addEventListener('click', async () => {
    await confirmDeleteProject(project);
  });
}

function closeModal() {
  $('detail-modal').classList.add('hidden');
  document.body.style.overflow = '';
  currentModalProject = null;
}

async function confirmDeleteProject(project) {
  const label = project.client_name || project.event_slug || 'this project';
  const confirmed = window.confirm(`Delete ${label}? This cannot be undone.`);
  if (!confirmed) return;

  try {
    await apiPost(API.remove, { token: project.token });
    removeLocalProject(project.token);
    setCreateStatus(`Deleted ${label}.`, 'success');
    if (currentModalProject?.token === project.token) {
      closeModal();
    }
    await loadProjects();
  } catch (e) {
    console.error('[Admin] project delete failed:', e);
    setCreateStatus(`Delete failed: ${e.message}`, 'error');
  }
}

function hasMonogramPreview(project) {
  return Boolean(normalizeMonogramDataUrl(project?.monogram_png) || getMonogramFallbackData(project));
}

function createMonogramPreviewNode(project, { className = '' } = {}) {
  const normalizedSrc = normalizeMonogramDataUrl(project?.monogram_png);
  if (normalizedSrc) {
    const img = document.createElement('img');
    img.src = normalizedSrc;
    img.alt = 'Monogram preview';
    if (className) img.className = className;
    img.addEventListener('error', () => {
      const fallback = createFallbackMonogramCanvas(project, className);
      img.replaceWith(fallback);
    }, { once: true });
    return img;
  }

  return createFallbackMonogramCanvas(project, className);
}

function normalizeMonogramDataUrl(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 100) {
    return `data:image/png;base64,${trimmed.replace(/\s+/g, '')}`;
  }
  return trimmed;
}

function getMonogramFallbackData(project) {
  const mono = project?.project_data?.monogram;
  if (!mono) return null;
  if (!String(mono.line1 || '').trim() && !String(mono.line2 || '').trim()) return null;
  return mono;
}

function createFallbackMonogramCanvas(project, className = '') {
  const mono = getMonogramFallbackData(project);
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 320;
  canvas.setAttribute('aria-label', 'Monogram preview');
  if (className) canvas.className = className;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!mono) {
    ctx.fillStyle = '#a6a0a0';
    ctx.font = '32px Cormorant Garamond, serif';
    ctx.textAlign = 'center';
    ctx.fillText('No monogram', canvas.width / 2, canvas.height / 2 + 10);
    return canvas;
  }

  const line1 = String(mono.line1 || '').trim();
  const line2 = String(mono.line2 || '').trim();
  const color1 = mono.text_color1 || '#333333';
  const color2 = mono.text_color2 || color1;
  const font1 = mono.fontFamily1 || mono.font || mono.fontFamily || 'Cormorant Garamond';
  const font2 = mono.fontFamily2 || mono.font || mono.fontFamily || 'Cormorant Garamond';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (line1) {
    ctx.fillStyle = color1;
    ctx.font = `64px "${font1}", serif`;
    ctx.fillText(line1, canvas.width / 2, line2 ? 130 : 160, canvas.width - 60);
  }

  if (line2) {
    ctx.fillStyle = color2;
    ctx.font = `40px "${font2}", serif`;
    ctx.fillText(line2, canvas.width / 2, line1 ? 215 : 170, canvas.width - 60);
  }

  return canvas;
}

async function downloadMonogramPNG(project) {
  const normalizedSrc = normalizeMonogramDataUrl(project?.monogram_png);
  const fileName = `${project.event_slug || 'monogram'}-monogram.png`;

  if (normalizedSrc) {
    const a = document.createElement('a');
    a.href = normalizedSrc;
    a.download = fileName;
    a.click();
    return;
  }

  const fallback = createFallbackMonogramCanvas(project);
  const a = document.createElement('a');
  a.href = fallback.toDataURL('image/png');
  a.download = fileName;
  a.click();
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

function formatEventDate(value) {
  if (!value) return '—';
  const dt = new Date(`${value}T00:00:00`);
  return Number.isNaN(dt.getTime())
    ? String(value)
    : dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
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
window.copyText = copyText;
