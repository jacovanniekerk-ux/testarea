/*
 * report-modal.js
 * ------------------------------------------------------------------
 * The pop-up shown immediately after a FINAL submit. It offers one-tap
 * access to the freshly generated report(s):
 *
 *   - Culture Walkthrough submit  -> "View Culture Walkthrough Report"
 *                                    + one "View Classroom Observation"
 *                                    button per classroom submitted with it
 *   - Standalone classroom submit -> "View Classroom Observation Report"
 *
 * Usage:
 *   showReportReadyModal({
 *     title: 'Walkthrough submitted',
 *     message: 'Your reports are ready.',
 *     primary:   { label: 'View Culture Walkthrough Report', href: 'report.html?...' },
 *     secondary: [{ label: 'Classroom 1', detail: 'Ms Jacobs · Mathematics', href: '...' }],
 *     dashboardHref: '4p.html',
 *   });
 */

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function reportHref(type, id, view = null) {
  const params = new URLSearchParams({ type, id });
  if (view) params.set('view', view);
  return `report.html?${params.toString()}`;
}

export function showReportReadyModal({ title, message, primary, secondary = [], dashboardHref = '4p.html' }) {
  // Only one at a time.
  document.getElementById('report-ready-modal')?.remove();

  const secondaryHtml = secondary.length
    ? `
      <div class="mt-4">
        <p class="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Classroom Observation Reports</p>
        <div class="space-y-2">
          ${secondary
            .map(
              (s) => `
            <a href="${esc(s.href)}"
               class="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50/50 hover:border-[#001489]/40 transition group">
              <span class="min-w-0">
                <span class="block text-xs font-bold text-slate-800 group-hover:text-[#001489]">${esc(s.label)}</span>
                ${s.detail ? `<span class="block text-[11px] text-slate-500 truncate">${esc(s.detail)}</span>` : ''}
              </span>
              <i class="fa-solid fa-arrow-right text-xs text-slate-300 group-hover:text-[#001489] shrink-0"></i>
            </a>`
            )
            .join('')}
        </div>
      </div>`
    : '';

  const overlay = document.createElement('div');
  overlay.id = 'report-ready-modal';
  overlay.className = 'no-print fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'report-ready-title');
  overlay.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div class="px-6 pt-6 pb-4 text-center">
        <div class="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-3">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h2 id="report-ready-title" class="text-base font-black text-[#001489]">${esc(title)}</h2>
        <p class="text-xs text-slate-500 mt-1">${esc(message)}</p>
      </div>
      <div class="px-6 pb-2">
        <a href="${esc(primary.href)}"
           class="btn-primary w-full font-extrabold text-xs px-5 py-3 rounded-lg transition flex items-center justify-center gap-2 uppercase">
          <span>${esc(primary.label)}</span>
          <i class="fa-solid fa-arrow-right"></i>
        </a>
        ${secondaryHtml}
      </div>
      <div class="px-6 py-4 mt-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
        <a href="${esc(dashboardHref)}" class="text-xs font-bold text-slate-500 hover:text-slate-700 transition">Back to Dashboard</a>
        <button type="button" data-close class="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition">Close</button>
      </div>
    </div>`;

  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  overlay.querySelector('a')?.focus();

  return { close };
}
