const $ = (id) => document.getElementById(id);
const loginView = $('login-view');
const appView = $('app-view');
let currentAdvisor = null;
let linkFilter = 'mine';

function showLogin() {
  loginView.hidden = false;
  appView.hidden = true;
  currentAdvisor = null;
}

function showApp(advisor) {
  currentAdvisor = advisor;
  loginView.hidden = true;
  appView.hidden = false;
  $('welcome').textContent = `Logged in as ${advisor.full_name}`;
  loadLinks();
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  let data = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(data?.error || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draws the logo onto the QR code's underlying <canvas>, then refreshes the
// visible <img> from that canvas so right-click > Copy Image includes the logo.
function drawQrLogo(container, logoSrc) {
  return new Promise((resolve) => {
    const canvas = container.querySelector('canvas');
    const img = container.querySelector('img');
    if (!canvas) { resolve(); return; }

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const logo = new Image();
    logo.onload = () => {
      const size = canvas.width;
      const logoSize = Math.round(size * 0.28);
      const pad = Math.round(size * 0.015) + 4;
      const boxSize = logoSize + pad * 2;
      const x = (size - boxSize) / 2;
      const y = (size - boxSize) / 2;

      ctx.fillStyle = '#ffffff';
      roundedRectPath(ctx, x, y, boxSize, boxSize, boxSize * 0.12);
      ctx.fill();
      ctx.drawImage(logo, x + pad, y + pad, logoSize, logoSize);

      if (img) img.src = canvas.toDataURL('image/png');
      resolve();
    };
    logo.onerror = () => resolve(); // QR still works without the logo if it fails to load
    logo.src = logoSrc;
  });
}

function shortUrl(code) {
  return `${location.origin}/r/${encodeURIComponent(code)}`;
}

// The QR code is displayed at QR_DISPLAY_SIZE but rendered internally at
// QR_RENDER_SIZE — this is what actually fixes the pixelation. A right-click
// "Copy Image" grabs the underlying canvas pixels, so rendering 4x larger
// than the on-screen size (and letting CSS scale it back down for display)
// gives a much sharper result for both the QR modules and the logo.
const QR_DISPLAY_SIZE = 220;
const QR_RENDER_SIZE = 880;

async function renderQrCode(url) {
  $('created-link').href = url;
  $('created-link').textContent = url;
  $('qrcode').replaceChildren();
  new QRCode($('qrcode'), {
    text: url,
    width: QR_RENDER_SIZE,
    height: QR_RENDER_SIZE,
    colorDark: '#000000',
    colorLight: '#ffffff',
    // High error correction so the center logo doesn't break scannability.
    correctLevel: QRCode.CorrectLevel.H
  });
  await drawQrLogo($('qrcode'), 'wced-bug.jpg');
  $('qr-result').hidden = false;
  $('qr-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 9h10v10H9z"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
}

function qrIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M14 21v-4"/><path d="M21 14v3"/><path d="M17.5 17.5h.01"/><path d="M21 21h-3"/></svg>`;
}

function trashIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;
}

async function copyToClipboard(url, button) {
  try {
    await navigator.clipboard.writeText(url);
    button.setAttribute('aria-label', 'Copied');
    button.title = 'Copied';
    button.classList.add('copied');
    setTimeout(() => {
      button.setAttribute('aria-label', 'Copy link to clipboard');
      button.title = 'Copy link to clipboard';
      button.classList.remove('copied');
    }, 1400);
  } catch {
    // Fallback for older browsers / restricted clipboard contexts.
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    try { document.execCommand('copy'); } finally { input.remove(); }
    button.setAttribute('aria-label', 'Copied');
    button.title = 'Copied';
    button.classList.add('copied');
    setTimeout(() => {
      button.setAttribute('aria-label', 'Copy link to clipboard');
      button.title = 'Copy link to clipboard';
      button.classList.remove('copied');
    }, 1400);
  }
}

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('login-error').hidden = true;
  try {
    const data = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('email').value, password: $('password').value })
    });
    $('password').value = '';
    showApp(data.advisor);
  } catch (error) {
    $('login-error').textContent = error.message;
    $('login-error').hidden = false;
  }
});

$('logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showLogin();
});

$('short-code').addEventListener('input', (event) => {
  event.target.value = event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
});

$('link-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = $('link-message');
  message.hidden = true;
  message.className = 'message';
  $('qr-result').hidden = true;

  try {
    const data = await api('/api/links', {
      method: 'POST',
      body: JSON.stringify({
        shortened_link: $('short-code').value,
        full_url: $('full-url').value
      })
    });

    const url = shortUrl(data.link.shortened_link);
    message.textContent = `Created: ${url}`;
    message.hidden = false;

    renderQrCode(url);

    $('short-code').value = '';
    $('full-url').value = '';
    await loadLinks();
  } catch (error) {
    message.textContent = error.message;
    message.hidden = false;
    message.className = 'message error';
  }
});

$('refresh').addEventListener('click', loadLinks);

$('show-mine').addEventListener('click', () => {
  if (linkFilter === 'mine') return;
  linkFilter = 'mine';
  updateFilterButtons();
  loadLinks();
});

$('show-all').addEventListener('click', () => {
  if (linkFilter === 'all') return;
  linkFilter = 'all';
  updateFilterButtons();
  loadLinks();
});

function updateFilterButtons() {
  $('show-mine').classList.toggle('active', linkFilter === 'mine');
  $('show-all').classList.toggle('active', linkFilter === 'all');
}

async function deleteLink(link, row) {
  const confirmed = confirm(`Delete the link "${link.shortened_link}"? This can't be undone.`);
  if (!confirmed) return;

  try {
    await api(`/api/links/${encodeURIComponent(link.id)}`, { method: 'DELETE' });
    row.remove();
    if (!$('links-body').children.length) loadLinks();
  } catch (error) {
    if (error.status === 401) {
      showLogin();
    } else {
      alert(error.message || 'Could not delete this link.');
    }
  }
}

async function loadLinks() {
  try {
    const data = await api(`/api/links?mine=${linkFilter === 'mine' ? 'true' : 'false'}`);
    const body = $('links-body');
    body.replaceChildren();

    for (const link of data.links) {
      const row = document.createElement('tr');
      const shortCell = document.createElement('td');
      const shortAnchor = document.createElement('a');
      const url = shortUrl(link.shortened_link);
      shortAnchor.href = url;
      shortAnchor.textContent = link.shortened_link;
      shortAnchor.target = '_blank';
      shortAnchor.rel = 'noopener noreferrer';
      shortCell.appendChild(shortAnchor);

      const urlCell = document.createElement('td');
      const destination = document.createElement('a');
      destination.href = link.full_url;
      destination.textContent = link.full_url;
      destination.target = '_blank';
      destination.rel = 'noopener noreferrer';
      urlCell.appendChild(destination);

      const creatorCell = document.createElement('td');
      creatorCell.textContent = link.creator_name || '—';

      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(link.created_at).toLocaleString();

      const actionCell = document.createElement('td');
      actionCell.className = 'actions-cell';
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'icon-button';
      copyButton.innerHTML = copyIcon();
      copyButton.setAttribute('aria-label', 'Copy link to clipboard');
      copyButton.title = 'Copy link to clipboard';
      copyButton.addEventListener('click', () => copyToClipboard(url, copyButton));
      actionCell.appendChild(copyButton);

      const qrButton = document.createElement('button');
      qrButton.type = 'button';
      qrButton.className = 'icon-button';
      qrButton.innerHTML = qrIcon();
      qrButton.setAttribute('aria-label', 'View QR code');
      qrButton.title = 'View QR code';
      qrButton.addEventListener('click', () => renderQrCode(url));
      actionCell.appendChild(qrButton);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'icon-button icon-button-danger';
      deleteButton.innerHTML = trashIcon();
      deleteButton.setAttribute('aria-label', 'Delete link');
      deleteButton.title = 'Delete link';
      deleteButton.addEventListener('click', () => deleteLink(link, row));
      actionCell.appendChild(deleteButton);

      row.append(shortCell, urlCell, creatorCell, dateCell, actionCell);
      body.appendChild(row);
    }

    if (!data.links.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.className = 'empty';
      cell.textContent = linkFilter === 'mine' ? 'You have not created any links yet.' : 'No links have been created yet.';
      row.appendChild(cell);
      body.appendChild(row);
    }
  } catch (error) {
    if (error.status === 401) showLogin();
  }
}

(async function init() {
  try {
    const data = await api('/api/me');
    showApp(data.advisor);
  } catch {
    showLogin();
  }
})();
