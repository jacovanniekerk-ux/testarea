// ============================================================
// app-header.js
// ------------------------------------------------------------
// THE single navigation bar for the whole tool. Every page
// (4p.html, culture-walkthrough.html, classroom-report.html,
// past-reports.html, report.html) mounts it via mountAppHeader()
// instead of hand-rolling its own <header> markup. Edit this file
// and the change reaches every page at once.
//
// Usage (see any page's <script type="module"> for the exact call):
//
//   import { mountAppHeader } from './js/app-header.js';
//
//   mountAppHeader(document.getElementById('app-header'), {
//     active: 'classroom',              // which nav item is "you are here"
//     advisor,                          // { full_name, district } — omit to hide
//     maxWidth: 'max-w-5xl',            // match the page's <main> width
//     confirmLeave: () => !!currentReport && !reportLocked,
//   });
// ============================================================

const NAV_ITEMS = [
  { key: 'dashboard', href: '4p.html', label: 'Dashboard', icon: 'fa-gauge' },
  { key: 'walkthrough', href: 'culture-walkthrough.html', label: 'Culture Walkthrough', icon: 'fa-user-group' },
  { key: 'classroom', href: 'classroom-report.html', label: 'Classroom Observation', icon: 'fa-chalkboard-user' },
  { key: 'reports', href: 'past-reports.html', label: 'Past Reports', icon: 'fa-folder-open' },
];

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Mounts the shared app header into rootEl.
 *
 * @param {HTMLElement} rootEl - an empty container, e.g. <div id="app-header"></div>
 * @param {object} options
 * @param {'dashboard'|'walkthrough'|'classroom'|'reports'|null} [options.active]
 *   Which nav item is "you are here" — rendered as a non-clickable label instead
 *   of a link, so a click can't accidentally reload the current page and lose
 *   in-progress work.
 * @param {{full_name?: string, district?: string}|null} [options.advisor]
 *   Shown on the right (hidden below the md breakpoint). Omit/null to hide entirely.
 * @param {boolean} [options.showLogout=false]
 *   Only 4p.html (the Dashboard) sets this true — Logout lives there only.
 * @param {() => void} [options.onLogout]
 *   Required when showLogout is true.
 * @param {() => boolean} [options.confirmLeave]
 *   If provided, called before following any nav link. Returning true pops a
 *   confirmation dialog ("progress will be lost") before navigating away —
 *   used on Culture Walkthrough / Classroom Observation while a report is in
 *   progress and not yet submitted.
 * @param {string} [options.actions='']
 *   Extra trusted HTML rendered on the right, before Logout (e.g. report.html's
 *   Print button). Caller is responsible for escaping any dynamic values in it.
 * @param {string} [options.maxWidth='max-w-6xl']
 *   Container width class — matches whatever the page's own <main> uses.
 */
export function mountAppHeader(rootEl, options = {}) {
  const {
    active = null,
    advisor = null,
    showLogout = false,
    onLogout = null,
    confirmLeave = null,
    actions = '',
    maxWidth = 'max-w-6xl',
  } = options;

  const navHtml = NAV_ITEMS.map((item) => {
    if (item.key === active) {
      // Current page: a non-navigating label, not a link. Clicking a link to
      // the page you're already on still triggers a full reload, which would
      // silently discard any in-progress work — a label sidesteps that.
      return `
        <span class="flex items-center gap-1.5 text-[13px] font-bold px-2.5 py-1.5 rounded-lg bg-white/15 text-white" aria-current="page">
          <i class="fa-solid ${item.icon} text-[12px]"></i>
          <span class="hidden sm:inline">${item.label}</span>
        </span>`;
    }
    return `
      <a href="${item.href}" data-nav-link
         class="flex items-center gap-1.5 text-[13px] font-bold px-2.5 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition">
        <i class="fa-solid ${item.icon} text-[12px]"></i>
        <span class="hidden sm:inline">${item.label}</span>
      </a>`;
  }).join('');

  const advisorHtml = advisor
    ? `
      <div class="hidden md:flex items-center gap-3 text-[13px] pr-3 mr-1 border-r border-white/20">
        <span class="flex items-center gap-1.5"><i class="fa-solid fa-user-large text-[12px]"></i><span class="font-medium">${esc(advisor.full_name)}</span></span>
        <span class="flex items-center gap-1.5 text-white/70"><i class="fa-solid fa-building text-[12px]"></i><span>${esc(advisor.district)}</span></span>
      </div>`
    : '';

  const logoutHtml = showLogout
    ? `<button type="button" data-nav-logout class="text-white/80 hover:text-white transition text-[13px] font-medium whitespace-nowrap"><i class="fa-solid fa-right-from-bracket mr-1"></i>Logout</button>`
    : '';

  rootEl.innerHTML = `
    <header class="app-header-sticky bg-[#001489] text-white py-2.5 px-4 sm:px-6 shadow-sm no-print">
      <div class="${maxWidth} mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <nav class="flex items-center gap-1 flex-wrap" aria-label="Main navigation">${navHtml}</nav>
        <div class="flex items-center gap-3 shrink-0">${advisorHtml}${actions}${logoutHtml}</div>
      </div>
    </header>`;

  if (confirmLeave) {
    rootEl.querySelectorAll('[data-nav-link]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (confirmLeave()) {
          const ok = window.confirm(
            'You have a report in progress on this page.\n\nLeaving now without saving will lose any changes since your last save — use "Save Draft" first if you want to keep them.\n\nLeave anyway?'
          );
          if (!ok) e.preventDefault();
        }
      });
    });
  }

  if (showLogout && onLogout) {
    rootEl.querySelector('[data-nav-logout]')?.addEventListener('click', onLogout);
  }
}
