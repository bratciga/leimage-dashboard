'use strict';

const SUPABASE_CONFIG = {
  url:        'YOUR_SUPABASE_URL',
  anonKey:    'YOUR_SUPABASE_ANON_KEY',
  submissionsTable: 'submissions',
  clientsTable:     'photobooth_clients',
};

const SUPABASE_ENABLED = (
  SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' &&
  SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

const ADMIN_PASSWORD = 'leimage2026';
const SESSION_KEY = 'leimage_admin_auth';
const CLIENTS_KEY = 'leimage_photobooth_clients';
const SUBMISSIONS_KEY = 'leimage_photobooth_submissions';

let allClients = [];
let filteredClients = [];
let allSubmissions = [];
let currentModalClient = null;

document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  initAuth();
});

function $(id) {
  return document.getElementById(id);
}

function setFooterYear() {
  const el = $('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

function initAuth() {
  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    showAdminContent();
    return;
  }

  $('login-btn')?.addEventListener('click', attemptLogin);
  $('admin-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });
}

function attemptLogin() {
  const pw = $('admin-password')?.value || '';
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1');
    showAdminContent();
    return;
  }

  $('login-error').textContent = 'Incorrect password.';
  $('admin-password').value = '';
  $('admin-password').focus();
}

function showAdminContent() {
  $('login-gate').style.display = 'none';
  $('admin-content').classList.remove('hidden');

  bindEvents();
  syncSlugFromName();
  renderGeneratedLink();
  if (!SUPABASE_ENABLED) {
    setFormStatus('Supabase is not configured yet. Client records will only save locally until the server keys are added.', 'error');
  }
  refreshClientManager();
}

function bindEvents() {
  $('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });

  $('client-form')?.addEventListener('submit', handleClientSave);
  $('copy-link-btn')?.addEventListener('click', copyGeneratedLink);
  $('reset-client-form-btn')?.addEventListener('click', resetClientForm);
  $('refresh-clients-btn')?.addEventListener('click', () => refreshClientManager());

  $('client-name')?.addEventListener('input', syncSlugFromName);
  $('event-slug')?.addEventListener('input', renderGeneratedLink);
  $('event-date')?.addEventListener('input', renderGeneratedLink);

  $('client-search-input')?.addEventListener('input', applyClientFilter);

  $('client-modal-close')?.addEventListener('click', closeClientModal);
  $('client-modal-backdrop')?.addEventListener('click', closeClientModal);
}

async function refreshClientManager() {
  allClients = await loadClients();
  allSubmissions = await loadSubmissions();
  filteredClients = [...allClients];
  updateClientStats();
  renderClientList(filteredClients);
}

async function loadClients() {
  const results = [];

  if (SUPABASE_ENABLED) {
    try {
      const res = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.clientsTable}?order=updated_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          },
        }
      );

      if (!res.ok) throw new Error(`Supabase error ${res.status}`);

      const rows = await res.json();
      rows.forEach(row => {
        results.push({
          id: row.id,
          clientName: row.client_name,
          eventDate: row.event_date,
          eventSlug: row.event_slug,
          status: row.status,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          _source: 'supabase',
        });
      });
    } catch (err) {
      console.warn('[ClientManager] Supabase client load failed, using local data:', err);
    }
  }

  try {
    const raw = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
    const existing = new Set(results.map(item => item.eventSlug));
    raw.forEach(item => {
      if (!existing.has(item.eventSlug)) {
        results.push({ ...item, _source: 'local' });
      }
    });
  } catch (err) {
    console.error('[ClientManager] Failed to load local clients:', err);
  }

  return results.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

function persistClientsLocal(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

async function saveClientRecord(clientRecord, isUpdate) {
  if (!SUPABASE_ENABLED) {
    return { success: false, fallback: true, error: 'Supabase not configured' };
  }

  const payload = {
    id: clientRecord.id,
    client_name: clientRecord.clientName,
    event_date: clientRecord.eventDate || null,
    event_slug: clientRecord.eventSlug,
    status: clientRecord.status,
    notes: clientRecord.notes || '',
    created_at: clientRecord.createdAt,
    updated_at: clientRecord.updatedAt,
  };

  try {
    const url = isUpdate
      ? `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.clientsTable}?event_slug=eq.${encodeURIComponent(clientRecord.eventSlug)}`
      : `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.clientsTable}`;

    const method = isUpdate ? 'PATCH' : 'POST';
    const body = isUpdate ? JSON.stringify({
      client_name: payload.client_name,
      event_date: payload.event_date,
      status: payload.status,
      notes: payload.notes,
      updated_at: payload.updated_at,
    }) : JSON.stringify(payload);

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Prefer': 'return=representation',
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase error ${res.status}: ${errText}`);
    }

    return { success: true, fallback: false, data: await res.json() };
  } catch (err) {
    console.error('[ClientManager] Failed to save client to Supabase:', err);
    return { success: false, fallback: true, error: err.message };
  }
}

async function loadSubmissions() {
  const results = [];

  if (SUPABASE_ENABLED) {
    try {
      const res = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.submissionsTable}?order=submitted_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_CONFIG.anonKey,
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          },
        }
      );

      if (!res.ok) throw new Error(`Supabase error ${res.status}`);

      const rows = await res.json();
      rows.forEach(row => {
        results.push({
          id: row.id,
          event_slug: row.event_slug,
          submitted_at: row.submitted_at,
          monogram_png: row.monogram_png,
          ...(row.data || {}),
          _source: 'supabase',
        });
      });
    } catch (err) {
      console.warn('[ClientManager] Supabase load failed, using local data:', err);
    }
  }

  try {
    const raw = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]');
    const existingKeys = new Set(results.map(item => `${item.event_slug}|${item.submitted_at}`));

    raw.forEach(item => {
      const key = `${item.event_slug}|${item.submitted_at}`;
      if (!existingKeys.has(key)) {
        results.push({ ...item, _source: 'local' });
      }
    });
  } catch (err) {
    console.error('[ClientManager] Failed to load local submissions:', err);
  }

  return results.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
}

async function handleClientSave(event) {
  event.preventDefault();

  const clientName = ($('client-name')?.value || '').trim();
  const eventDate = $('event-date')?.value || '';
  const eventSlug = normalizeSlug(($('event-slug')?.value || '').trim());
  const status = $('client-status')?.value || 'new';
  const notes = ($('client-notes')?.value || '').trim();

  if (!clientName) {
    setFormStatus('Please enter the client or couple name.', 'error');
    $('client-name')?.focus();
    return;
  }

  if (!eventSlug) {
    setFormStatus('Please enter a valid event slug.', 'error');
    $('event-slug')?.focus();
    return;
  }

  const existingIndex = allClients.findIndex(client => client.eventSlug === eventSlug);
  const now = new Date().toISOString();

  const clientRecord = {
    id: existingIndex >= 0 ? allClients[existingIndex].id : createId(),
    clientName,
    eventDate,
    eventSlug,
    status,
    notes,
    createdAt: existingIndex >= 0 ? allClients[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    allClients[existingIndex] = clientRecord;
  } else {
    allClients.unshift(clientRecord);
  }

  persistClientsLocal(allClients);

  const saveBtn = document.querySelector('#client-form button[type="submit"]');
  if (saveBtn) saveBtn.disabled = true;

  const result = await saveClientRecord(clientRecord, existingIndex >= 0);

  if (saveBtn) saveBtn.disabled = false;

  if (result.success) {
    setFormStatus(existingIndex >= 0 ? 'Client updated on server.' : 'Client saved to server.', 'success');
  } else {
    setFormStatus('Saved locally, but server sync failed. Check Supabase config/policies.', 'error');
  }

  await refreshClientManager();
}

function applyClientFilter() {
  const query = ($('client-search-input')?.value || '').trim().toLowerCase();

  filteredClients = query
    ? allClients.filter(client => {
        const haystack = [client.clientName, client.eventSlug, client.eventDate, client.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
    : [...allClients];

  renderClientList(filteredClients);
}

function renderClientList(clients) {
  const list = $('clients-list');
  const empty = $('clients-empty-state');
  if (!list || !empty) return;

  list.innerHTML = '';

  if (clients.length === 0) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  clients.forEach(client => {
    const submission = getLatestSubmissionForSlug(client.eventSlug);
    const card = document.createElement('article');
    card.className = 'client-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open ${client.clientName}`);

    card.innerHTML = `
      <div class="client-card-main">
        <div class="client-card-topline">
          <div>
            <div class="client-card-name">${escHtml(client.clientName)}</div>
            <div class="client-card-meta">${escHtml(client.eventSlug)}</div>
          </div>
          <span class="status-pill status-pill--${escHtml(getClientState(client, submission).tone)}">${escHtml(getClientState(client, submission).label)}</span>
        </div>

        <div class="client-card-metrics">
          <span class="tag">📅 ${escHtml(formatEventDate(client.eventDate))}</span>
          <span class="tag">🔗 ${escHtml(buildClientLink(client.eventSlug))}</span>
          <span class="tag">📝 ${submission ? 'Submitted' : 'No submission yet'}</span>
        </div>

        ${submission ? `
          <div class="client-submission-summary">
            <div class="submission-thumb submission-thumb--small">
              ${submission.monogram_png ? `<img src="${submission.monogram_png}" alt="Monogram preview" />` : '✦'}
            </div>
            <div class="client-submission-copy">
              <div class="client-submission-title">Latest submission</div>
              <div class="client-submission-meta">${escHtml(formatDateTime(submission.submitted_at))}</div>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="client-card-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-action="copy-link">Copy Link</button>
        <button type="button" class="btn btn-primary btn-sm" data-action="open-client">Open</button>
      </div>
    `;

    card.addEventListener('click', () => openClientModal(client));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openClientModal(client);
    });

    card.querySelector('[data-action="copy-link"]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await copyText(buildClientLink(client.eventSlug));
      setFormStatus(`Copied link for ${client.clientName}.`, 'success');
    });

    card.querySelector('[data-action="open-client"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openClientModal(client);
    });

    list.appendChild(card);
  });
}

function openClientModal(client) {
  currentModalClient = client;
  const submission = getLatestSubmissionForSlug(client.eventSlug);
  const submissions = getAllSubmissionsForSlug(client.eventSlug);
  const state = getClientState(client, submission);

  $('client-modal-title').textContent = client.clientName;
  $('client-modal-body').innerHTML = `
    <div class="detail-grid">
      <section class="detail-section">
        <div class="detail-section-title">Client</div>
        <div class="detail-row"><span class="detail-key">Client</span><span class="detail-val">${escHtml(client.clientName)}</span></div>
        <div class="detail-row"><span class="detail-key">Event date</span><span class="detail-val">${escHtml(formatEventDate(client.eventDate))}</span></div>
        <div class="detail-row"><span class="detail-key">Slug</span><span class="detail-val">${escHtml(client.eventSlug)}</span></div>
        <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val"><span class="status-pill status-pill--${escHtml(state.tone)}">${escHtml(state.label)}</span></span></div>
        <div class="detail-row"><span class="detail-key">Created</span><span class="detail-val">${escHtml(formatDateTime(client.createdAt))}</span></div>
        <div class="detail-row"><span class="detail-key">Updated</span><span class="detail-val">${escHtml(formatDateTime(client.updatedAt))}</span></div>
      </section>

      <section class="detail-section">
        <div class="detail-section-title">Client Link</div>
        <div class="generated-link-box generated-link-box--modal">
          <div class="generated-link-value generated-link-value--full">${escHtml(buildClientLink(client.eventSlug))}</div>
        </div>
        <div class="detail-actions-row">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.copyClientLinkFromModal()">Copy Link</button>
          ${submission && submission.monogram_png ? '<button type="button" class="btn btn-secondary btn-sm" onclick="window.downloadCurrentClientMonogram()">Download Monogram PNG</button>' : ''}
          <button type="button" class="btn btn-ghost btn-sm" onclick="window.prefillClientFormFromModal()">Edit Client</button>
        </div>
      </section>
    </div>

    ${client.notes ? `
      <section class="detail-section">
        <div class="detail-section-title">Admin Notes</div>
        <p class="detail-paragraph">${escHtml(client.notes)}</p>
      </section>
    ` : ''}

    <section class="detail-section">
      <div class="detail-section-title">Submission Status</div>
      <div class="detail-row"><span class="detail-key">Submissions</span><span class="detail-val">${submissions.length}</span></div>
      <div class="detail-row"><span class="detail-key">Latest</span><span class="detail-val">${escHtml(submission ? formatDateTime(submission.submitted_at) : 'No submission yet')}</span></div>
    </section>

    ${submission ? renderSubmissionDetails(submission) : `
      <section class="detail-section">
        <div class="detail-section-title">Latest Submission</div>
        <p class="detail-paragraph">No client submission has been saved under this event slug yet.</p>
      </section>
    `}
  `;

  $('client-detail-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function renderSubmissionDetails(submission) {
  const mono = submission.monogram || {};
  const props = (submission.props || []).join(', ') || '—';

  return `
    <section class="detail-section">
      <div class="detail-section-title">Latest Submission</div>
      <div class="detail-grid">
        <div>
          <div class="detail-row"><span class="detail-key">Submitted</span><span class="detail-val">${escHtml(formatDateTime(submission.submitted_at))}</span></div>
          <div class="detail-row"><span class="detail-key">Source</span><span class="detail-val">${escHtml(submission._source || '—')}</span></div>
          <div class="detail-row"><span class="detail-key">Parking</span><span class="detail-val">${escHtml(readableParking(submission.parking))}</span></div>
          <div class="detail-row"><span class="detail-key">Backdrop</span><span class="detail-val">${escHtml(submission.backdrop || '—')}</span></div>
          <div class="detail-row"><span class="detail-key">Print size</span><span class="detail-val">${escHtml(submission.print_size || '—')}</span></div>
          <div class="detail-row"><span class="detail-key">Props</span><span class="detail-val">${escHtml(props)}</span></div>
        </div>
        <div>
          <div class="detail-row"><span class="detail-key">Monogram line 1</span><span class="detail-val">${escHtml(mono.line1 || '—')}</span></div>
          <div class="detail-row"><span class="detail-key">Monogram line 2</span><span class="detail-val">${escHtml(mono.line2 || '—')}</span></div>
          <div class="detail-row"><span class="detail-key">Font</span><span class="detail-val">${escHtml(mono.font || '—')}</span></div>
          <div class="detail-row"><span class="detail-key">Color 1</span><span class="detail-val">${escHtml(mono.text_color1 || '—')}</span></div>
          <div class="detail-row"><span class="detail-key">Color 2</span><span class="detail-val">${escHtml(mono.text_color2 || '—')}</span></div>
          <div class="detail-row"><span class="detail-key">Frame color</span><span class="detail-val">${escHtml(mono.frame_color || '—')}</span></div>
        </div>
      </div>

      ${submission.monogram_png ? `
        <div class="detail-monogram-block">
          <img src="${submission.monogram_png}" alt="Monogram preview" class="detail-monogram-preview detail-monogram-preview--large" />
        </div>
      ` : ''}

      ${submission.special_instructions ? `
        <div class="detail-note-block">
          <div class="detail-key" style="margin-bottom:.4rem;">Client Notes</div>
          <p class="detail-paragraph">${escHtml(submission.special_instructions)}</p>
        </div>
      ` : ''}
    </section>
  `;
}

function closeClientModal() {
  $('client-detail-modal').classList.add('hidden');
  document.body.style.overflow = '';
  currentModalClient = null;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeClientModal();
});

function getLatestSubmissionForSlug(slug) {
  return allSubmissions.find(item => item.event_slug === slug) || null;
}

function getAllSubmissionsForSlug(slug) {
  return allSubmissions.filter(item => item.event_slug === slug);
}

function getClientState(client, submission) {
  if (submission) {
    return { label: 'Submitted', tone: 'success' };
  }

  const map = {
    new: { label: 'New', tone: 'neutral' },
    sent: { label: 'Link Sent', tone: 'info' },
    follow_up: { label: 'Needs Follow Up', tone: 'warning' },
    done: { label: 'Done', tone: 'success' },
  };

  return map[client.status] || map.new;
}

function updateClientStats() {
  const submitted = allClients.filter(client => getLatestSubmissionForSlug(client.eventSlug)).length;
  const pending = Math.max(allClients.length - submitted, 0);

  $('client-total-count').textContent = allClients.length;
  $('client-submitted-count').textContent = submitted;
  $('client-pending-count').textContent = pending;
}

function syncSlugFromName() {
  const slugInput = $('event-slug');
  const nameInput = $('client-name');
  if (!slugInput || !nameInput) return;

  if (!slugInput.dataset.touched) {
    slugInput.value = normalizeSlug(nameInput.value);
  }

  renderGeneratedLink();
}

function renderGeneratedLink() {
  const slugInput = $('event-slug');
  if (!slugInput) return;

  const slug = normalizeSlug(slugInput.value);
  slugInput.value = slug;
  slugInput.dataset.touched = slug ? '1' : '';

  $('generated-link').textContent = slug
    ? buildClientLink(slug)
    : 'Fill in the client name or slug to generate the link.';
}

async function copyGeneratedLink() {
  const slug = normalizeSlug(($('event-slug')?.value || '').trim());
  if (!slug) {
    setFormStatus('Add a slug first so I have something to copy.', 'error');
    return;
  }

  await copyText(buildClientLink(slug));
  setFormStatus('Client link copied.', 'success');
}

function resetClientForm() {
  $('client-form')?.reset();
  const slugInput = $('event-slug');
  if (slugInput) delete slugInput.dataset.touched;
  renderGeneratedLink();
  setFormStatus('', 'idle');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
}

function buildClientLink(slug) {
  const url = new URL('client.html', window.location.href);
  url.searchParams.set('event', slug);
  return url.toString();
}

function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function formatEventDate(value) {
  if (!value) return 'No date set';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function readableParking(value) {
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';
  return value || '—';
}

function setFormStatus(message, type) {
  const el = $('client-form-status');
  if (!el) return;
  el.textContent = message;
  el.className = message ? `submit-status ${type}` : 'submit-status';
}

function createId() {
  return `client_${Math.random().toString(36).slice(2, 10)}`;
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.copyClientLinkFromModal = async function copyClientLinkFromModal() {
  if (!currentModalClient) return;
  await copyText(buildClientLink(currentModalClient.eventSlug));
  setFormStatus(`Copied link for ${currentModalClient.clientName}.`, 'success');
};

window.prefillClientFormFromModal = function prefillClientFormFromModal() {
  if (!currentModalClient) return;

  $('client-name').value = currentModalClient.clientName || '';
  $('event-date').value = currentModalClient.eventDate || '';
  $('event-slug').value = currentModalClient.eventSlug || '';
  $('event-slug').dataset.touched = '1';
  $('client-status').value = currentModalClient.status || 'new';
  $('client-notes').value = currentModalClient.notes || '';
  renderGeneratedLink();
  closeClientModal();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.downloadCurrentClientMonogram = function downloadCurrentClientMonogram() {
  if (!currentModalClient) return;
  const submission = getLatestSubmissionForSlug(currentModalClient.eventSlug);
  if (!submission?.monogram_png) return;

  const a = document.createElement('a');
  a.href = submission.monogram_png;
  a.download = `${currentModalClient.eventSlug}-monogram.png`;
  a.click();
};
