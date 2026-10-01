/*
 * portal-nav.js: the ONE navigation for every eTPD page.
 *
 * Add to the <head> of any page:   <script src="portal-nav.js" defer></script>
 * It injects a sticky header (logo, links, account chip) at the top of <body>.
 * Edit NAV below to change the menu everywhere at once.
 *
 * It also exposes window.PortalNav with the sign-in helpers the portal
 * (index.html) uses, so "signed in" means the same thing on every page:
 *   wced_pd_credentials  -> { searchType: 'persal'|'id', searchValue }   (same key profile.html uses)
 *   iat_profiles / iat_active_profile_id -> device profile (same keys Register uses)
 */
(function () {
    // ---------- Menu definition (edit here) ----------
    const NAV = [
        { label: 'Home', href: 'index.html' },
        { label: 'Sessions', match: ['sessions.html', 'calendar.html', 'my-preregistrations.html', 'preregister.html'], children: [
            { label: 'Browse sessions', sub: 'Cards view', href: 'sessions.html' },
            { label: 'Calendar', sub: 'Month view', href: 'calendar.html' },
            { label: 'My pre-registrations', sub: 'What I\'m booked on', href: 'my-preregistrations.html' }
        ] },
        { label: 'Register', href: 'register.html' },
        { label: 'My Development', href: 'profile.html' },
        { label: 'Pathway', href: 'pathway.html' },
        { label: 'Support', match: [], children: [
            { label: 'Contact district eTeams', href: 'index.html#contact' },
            { label: 'eLearning initiatives', href: 'index.html#initiatives' }
        ] }
    ];

    // ---------- Identity helpers ----------
    const CREDS_KEY = 'wced_pd_credentials';
    const safeParse = (s, d) => { try { return JSON.parse(s); } catch (_) { return d; } };
    const PortalNav = {
        getCreds() {
            const c = safeParse(localStorage.getItem(CREDS_KEY), null);
            return c && c.searchType && c.searchValue ? c : null;
        },
        setCreds(searchType, searchValue) { localStorage.setItem(CREDS_KEY, JSON.stringify({ searchType, searchValue })); },
        clearCreds() { localStorage.removeItem(CREDS_KEY); },
        getDeviceProfile() {
            const list = safeParse(localStorage.getItem('iat_profiles'), []);
            if (!Array.isArray(list) || !list.length) return null;
            return list.find(p => p.id === localStorage.getItem('iat_active_profile_id')) || list[0] || null;
        },
        NAV
    };
    window.PortalNav = PortalNav;

    // ---------- Styles (self-contained, prefixed pn-) ----------
    const CSS = `
:root{--pn-h:60px}
.pn-bar,.pn-bar *{box-sizing:border-box}
.pn-bar{position:sticky;top:0;z-index:40;background:#fff;border-bottom:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,.05);font-family:'Century Gothic','Didact Gothic','Segoe UI',system-ui,sans-serif}
.pn-accent{height:4px;background:linear-gradient(90deg,#001489,#8FAD15)}
.pn-in{max-width:1200px;margin:0 auto;height:56px;padding:0 16px;display:flex;align-items:center;gap:8px}
.pn-logo{display:flex;align-items:center;margin-right:auto;flex-shrink:0}
.pn-logo img{height:38px;width:auto;display:block}
.pn-links{display:none;align-items:center;gap:2px}
.pn-item{position:relative}
.pn-bar a,.pn-bar button{font:inherit;text-decoration:none;cursor:pointer}
.pn-link{display:flex;align-items:center;gap:4px;padding:8px 12px;border-radius:8px;border:0;background:none;color:#374151;font-size:14px;font-weight:600;line-height:1}
.pn-link:hover{background:#f3f4f6;color:#001489}
.pn-link.on{color:#001489;background:#eef1ff;box-shadow:inset 0 -2px 0 #001489}
.pn-caret{width:10px;height:10px;opacity:.6}
.pn-drop{position:absolute;top:calc(100% + 6px);left:0;min-width:230px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.12);padding:6px;display:none}
.pn-item.open .pn-drop{display:block}
.pn-drop a{display:block;padding:9px 12px;border-radius:8px;color:#1f2937;font-size:14px;font-weight:600}
.pn-drop a small{display:block;font-weight:400;font-size:12px;color:#6b7280;margin-top:1px}
.pn-drop a:hover,.pn-drop a.on{background:#eef1ff;color:#001489}
.pn-acct{display:flex;align-items:center;gap:8px;padding:4px 10px 4px 4px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;color:#1f2937;font-size:13px;font-weight:600}
.pn-acct:hover{border-color:#001489}
.pn-av{width:28px;height:28px;border-radius:50%;background:#001489;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.pn-acct .pn-nm{display:none;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pn-signin{padding:8px 14px;border-radius:999px;background:#001489;color:#fff;font-size:13px;font-weight:700}
.pn-signin:hover{background:#0a1fa8}
.pn-burger{width:40px;height:40px;border:0;background:none;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#374151}
.pn-burger:hover{background:#f3f4f6}
.pn-burger svg{width:24px;height:24px}
.pn-acctwrap{position:relative}
.pn-acctwrap .pn-drop{left:auto;right:0;min-width:200px}
.pn-acctwrap.open .pn-drop{display:block}
.pn-mobile{display:none;border-top:1px solid #e5e7eb;background:#fff;padding:8px 12px 14px;max-height:calc(100vh - 60px);overflow:auto}
.pn-bar.menu .pn-mobile{display:block}
.pn-mobile .pn-link{width:100%;padding:12px;font-size:15px}
.pn-mobile .pn-sub{padding-left:12px;border-left:2px solid #e5e7eb;margin:0 0 6px 12px}
.pn-mobile .pn-sub a{display:block;padding:9px 12px;color:#374151;font-size:14px;font-weight:600;border-radius:8px}
.pn-mobile .pn-sub a.on,.pn-mobile .pn-sub a:hover{background:#eef1ff;color:#001489}
.pn-mobile .pn-grp{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;padding:10px 12px 2px}
/* page-level sticky headers (sessions/calendar filters) now sit under the global bar */
header.sticky{top:var(--pn-h)!important}
@media(min-width:900px){
  .pn-links{display:flex}.pn-burger{display:none}.pn-mobile,.pn-bar.menu .pn-mobile{display:none}
  .pn-logo{margin-right:16px}.pn-links{margin-right:auto}.pn-acct .pn-nm{display:inline}
}
@media print{.pn-bar{display:none}}`;

    // ---------- Rendering ----------
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const isHere = h => !h.includes('#') && h.toLowerCase() === here;
    const itemOn = it => it.href ? isHere(it.href) : (it.match || []).includes(here);
    const caret = '<svg class="pn-caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4l4 4 4-4"/></svg>';

    function identity() {
        const dp = PortalNav.getDeviceProfile();
        const creds = PortalNav.getCreds();
        const name = dp ? `${dp.firstName || ''} ${dp.surname || ''}`.trim() : '';
        const initials = name ? name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() : '';
        return { signedIn: !!creds, name, initials: initials || (creds ? '✓' : '') };
    }

    function build() {
        if (document.querySelector('.pn-bar')) return;
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        const id = identity();
        const desktop = NAV.map(it => it.children
            ? `<div class="pn-item"><button class="pn-link ${itemOn(it) ? 'on' : ''}" aria-haspopup="true" aria-expanded="false">${esc(it.label)}${caret}</button>
                <div class="pn-drop">${it.children.map(c => `<a href="${c.href}" class="${isHere(c.href) ? 'on' : ''}">${esc(c.label)}${c.sub ? `<small>${esc(c.sub)}</small>` : ''}</a>`).join('')}</div></div>`
            : `<a class="pn-link ${itemOn(it) ? 'on' : ''}" href="${it.href}">${esc(it.label)}</a>`).join('');

        const mobile = NAV.map(it => it.children
            ? `<div class="pn-grp">${esc(it.label)}</div><div class="pn-sub">${it.children.map(c => `<a href="${c.href}" class="${isHere(c.href) ? 'on' : ''}">${esc(c.label)}</a>`).join('')}</div>`
            : `<a class="pn-link ${itemOn(it) ? 'on' : ''}" href="${it.href}">${esc(it.label)}</a>`).join('');

        const acct = id.signedIn
            ? `<div class="pn-acctwrap"><button class="pn-acct" aria-haspopup="true" aria-expanded="false"><span class="pn-av">${esc(id.initials)}</span><span class="pn-nm">${esc(id.name || 'My account')}</span>${caret}</button>
                <div class="pn-drop"><a href="profile.html">My development history</a><a href="my-preregistrations.html">My pre-registrations</a><a href="#" data-signout>Sign out</a></div></div>`
            : `<a class="pn-signin" href="index.html#signin">Sign in</a>`;

        const bar = document.createElement('div');
        bar.className = 'pn-bar';
        bar.innerHTML = `<div class="pn-accent"></div><div class="pn-in">
            <a class="pn-logo" href="index.html" aria-label="eTPD Portal home"><img src="header.png" alt="WCED eLearning Teacher Professional Development"></a>
            <nav class="pn-links" aria-label="Main">${desktop}</nav>${acct}
            <button class="pn-burger" aria-label="Menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div>
            <div class="pn-mobile">${mobile}</div>`;
        document.body.prepend(bar);

        // Dropdowns (desktop nav + account)
        const wraps = bar.querySelectorAll('.pn-item, .pn-acctwrap');
        const closeAll = () => wraps.forEach(w => { w.classList.remove('open'); const b = w.querySelector('button'); b && b.setAttribute('aria-expanded', 'false'); });
        wraps.forEach(w => w.querySelector('button').addEventListener('click', ev => {
            ev.stopPropagation();
            const was = w.classList.contains('open');
            closeAll();
            if (!was) { w.classList.add('open'); ev.currentTarget.setAttribute('aria-expanded', 'true'); }
        }));
        document.addEventListener('click', closeAll);
        document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { closeAll(); bar.classList.remove('menu'); } });

        // Mobile menu
        const burger = bar.querySelector('.pn-burger');
        burger.addEventListener('click', ev => {
            ev.stopPropagation();
            const open = bar.classList.toggle('menu');
            burger.setAttribute('aria-expanded', String(open));
        });

        // Sign out (clears the portal login only; device profiles used by Register stay)
        const out = bar.querySelector('[data-signout]');
        if (out) out.addEventListener('click', ev => {
            ev.preventDefault();
            PortalNav.clearCreds();
            location.href = 'index.html';
        });

        // Same-page hash links (e.g. clicking Support > Contact while on index.html)
        bar.querySelectorAll('a[href^="index.html#"]').forEach(a => a.addEventListener('click', () => {
            if (here === 'index.html' || here === '') setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 0);
        }));
    }

    if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
