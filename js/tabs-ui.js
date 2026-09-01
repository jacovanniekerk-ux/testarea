// ============================================================
// tabs-ui.js
// ------------------------------------------------------------
// Generic tab bar + panel switcher. Used in three places:
//  1. Inside classroom-report.js, to split its form into sections
//     (Context, People, Pedagogy, Platforms, Evidence).
//  2. Inside culture-walkthrough.js, for its own sections (Details,
//     People & Practices, Platforms).
//  3. At the culture-walkthrough.html page level, as the
//     "Classroom 1 / Classroom 2 / ..." switcher between multiple
//     classroom-report.js instances on one walkthrough. Dynamic —
//     tabs are added/removed at runtime via addTab()/removeTab().
//
// Each tab's content is rendered ONCE into its panel and then just
// shown/hidden via CSS — panels are never destroyed on switch, so
// form state (inputs, radio selections) is preserved.
//
// UX chrome included here (so every tab group gets it for free,
// rather than each page reinventing it):
//  - A sticky header bar (tab buttons + Previous/Next strip) that
//    stays visible while scrolling through a tab's content.
//  - Previous/Next buttons with a "Step X of N: <label>" indicator.
//  - Optional status dots per tab (see getStatusDotColor) so users
//    can see at a glance which sections still need attention.
// ============================================================

/**
 * @param {HTMLElement} containerEl
 * @param {{id: string, label: string, render: (panelEl: HTMLElement) => void}[]} initialTabs
 * @param {object} [opts]
 * @param {string} [opts.activeTabId] - defaults to the first tab
 * @param {(tabId: string) => string|null} [opts.getStatusDotColor] - optional, returns a CSS color (or null for no dot) shown next to each tab's label; call refreshStatusDots() to re-evaluate after data changes
 * @param {(tabId: string) => void} [opts.onActivate] - called every time the active tab changes (including the initial activation)
 * @param {boolean} [opts.sticky] - whether the header bar sticks to the top while scrolling. Default true. Set false for tab groups nested inside another sticky tab group, to avoid two sticky bars stacking on top of each other.
 * @param {number} [opts.stickyOffset] - px from the top of the viewport to stick at, e.g. to sit below a page header. Default 0.
 * @returns {{
 *   setActiveTab: (id: string) => void,
 *   getActiveTabId: () => string,
 *   getTabIds: () => string[],
 *   refreshStatusDots: () => void,
 *   setTabLabel: (id: string, label: string) => void,
 *   addTab: (tab: {id: string, label: string, render: (panelEl: HTMLElement) => void}, opts?: {activate?: boolean}) => void,
 *   removeTab: (id: string) => void,
 *   panelEls: Record<string, HTMLElement>
 * }}
 */
export function createTabbedPanel(containerEl, initialTabs, opts = {}) {
  if (!initialTabs || initialTabs.length === 0) {
    throw new Error('createTabbedPanel: at least one tab is required');
  }

  const sticky = opts.sticky !== false;
  const stickyOffset = opts.stickyOffset || 0;

  let activeId = opts.activeTabId || initialTabs[0].id;
  let tabOrder = []; // ordered list of tab ids, for figuring out a neighbor to activate after removal, and for Previous/Next

  const headerWrap = document.createElement('div');
  headerWrap.className = 'tabs-header-sticky';
  if (sticky) {
    headerWrap.style.position = 'sticky';
    headerWrap.style.top = `${stickyOffset}px`;
  }

  const tabBar = document.createElement('div');
  tabBar.className = 'tab-bar';

  const navStrip = document.createElement('div');
  navStrip.className = 'tab-nav-strip';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'tab-nav-btn';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i><span>Previous</span>';

  const stepLabel = document.createElement('span');
  stepLabel.className = 'tab-nav-step';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'tab-nav-btn';
  nextBtn.innerHTML = '<span>Next</span><i class="fa-solid fa-chevron-right"></i>';

  navStrip.appendChild(prevBtn);
  navStrip.appendChild(stepLabel);
  navStrip.appendChild(nextBtn);

  headerWrap.appendChild(tabBar);
  headerWrap.appendChild(navStrip);

  const panelsWrap = document.createElement('div');
  panelsWrap.className = 'tab-panels-wrap mt-4';

  const buttonEls = {};
  const dotEls = {};
  const panelEls = {};
  const labelSpanEls = {};

  function buildTab(tab) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab-button';
    btn.setAttribute('data-tab-id', tab.id);

    const labelSpan = document.createElement('span');
    labelSpan.textContent = tab.label;
    btn.appendChild(labelSpan);
    labelSpanEls[tab.id] = labelSpan;

    if (opts.getStatusDotColor) {
      const dot = document.createElement('span');
      dot.className = 'tab-status-dot';
      btn.appendChild(dot);
      dotEls[tab.id] = dot;
    }

    btn.addEventListener('click', () => setActiveTab(tab.id));
    tabBar.appendChild(btn);
    buttonEls[tab.id] = btn;

    const panel = document.createElement('div');
    panel.className = 'tab-panel';
    panelsWrap.appendChild(panel);
    panelEls[tab.id] = panel;

    tabOrder.push(tab.id);
    tab.render(panel);
  }

  initialTabs.forEach(buildTab);

  containerEl.innerHTML = '';
  containerEl.appendChild(headerWrap);
  containerEl.appendChild(panelsWrap);

  function updateNavStrip() {
    const idx = tabOrder.indexOf(activeId);
    const label = labelSpanEls[activeId] ? labelSpanEls[activeId].textContent : '';
    stepLabel.textContent = `Step ${idx + 1} of ${tabOrder.length}: ${label}`;
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= tabOrder.length - 1;
  }

  function setActiveTab(id) {
    if (!buttonEls[id]) return;
    activeId = id;
    tabOrder.forEach((tid) => {
      buttonEls[tid].classList.toggle('active', tid === id);
      panelEls[tid].classList.toggle('active', tid === id);
    });
    updateNavStrip();
    if (opts.onActivate) opts.onActivate(id);
  }

  prevBtn.addEventListener('click', () => {
    const idx = tabOrder.indexOf(activeId);
    if (idx > 0) setActiveTab(tabOrder[idx - 1]);
  });
  nextBtn.addEventListener('click', () => {
    const idx = tabOrder.indexOf(activeId);
    if (idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1]);
  });

  function refreshStatusDots() {
    if (!opts.getStatusDotColor) return;
    tabOrder.forEach((tid) => {
      const dot = dotEls[tid];
      if (!dot) return;
      const color = opts.getStatusDotColor(tid);
      dot.style.background = color || 'transparent';
    });
  }

  function setTabLabel(id, label) {
    const span = labelSpanEls[id];
    if (span) span.textContent = label;
    if (id === activeId) updateNavStrip();
  }

  function addTab(tab, addOpts = {}) {
    buildTab(tab);
    if (addOpts.activate !== false) setActiveTab(tab.id);
    else updateNavStrip(); // tab count changed either way
    refreshStatusDots();
  }

  function removeTab(id) {
    const idx = tabOrder.indexOf(id);
    if (idx === -1) return;

    buttonEls[id].remove();
    panelEls[id].remove();
    delete buttonEls[id];
    delete panelEls[id];
    delete labelSpanEls[id];
    delete dotEls[id];
    tabOrder.splice(idx, 1);

    if (activeId === id && tabOrder.length > 0) {
      const newIdx = Math.max(0, idx - 1);
      setActiveTab(tabOrder[newIdx]);
    } else {
      updateNavStrip();
    }
  }

  setActiveTab(activeId);
  refreshStatusDots();

  return {
    setActiveTab,
    getActiveTabId: () => activeId,
    getTabIds: () => [...tabOrder],
    refreshStatusDots,
    setTabLabel,
    addTab,
    removeTab,
    panelEls,
  };
}
