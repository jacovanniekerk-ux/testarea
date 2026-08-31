// ============================================================
// tabs-ui.js
// ------------------------------------------------------------
// Generic tab bar + panel switcher. Used in two places:
//  1. Inside classroom-report.js and culture-walkthrough.js, to
//     split a long form into sections (Context, People, Pedagogy...)
//     instead of one continuous scroll. Fixed set of tabs.
//  2. At the culture-walkthrough.html page level, as the
//     "Classroom 1 / Classroom 2 / ..." switcher between multiple
//     classroom-report.js instances on one walkthrough. Dynamic —
//     tabs are added/removed at runtime via addTab()/removeTab().
//
// Each tab's content is rendered ONCE into its panel and then just
// shown/hidden via CSS — panels are never destroyed on switch, so
// form state (inputs, radio selections) is preserved.
// ============================================================

/**
 * @param {HTMLElement} containerEl
 * @param {{id: string, label: string, render: (panelEl: HTMLElement) => void}[]} initialTabs
 * @param {object} [opts]
 * @param {string} [opts.activeTabId] - defaults to the first tab
 * @param {(tabId: string) => string|null} [opts.getStatusDotColor] - optional, returns a CSS color (or null for no dot) shown next to each tab's label; call refreshStatusDots() to re-evaluate after data changes
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

  let activeId = opts.activeTabId || initialTabs[0].id;
  let tabOrder = []; // ordered list of tab ids, for figuring out a neighbor to activate after removal

  const tabBar = document.createElement('div');
  tabBar.className = 'tab-bar';

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
  containerEl.appendChild(tabBar);
  containerEl.appendChild(panelsWrap);

  function setActiveTab(id) {
    if (!buttonEls[id]) return;
    activeId = id;
    tabOrder.forEach((tid) => {
      buttonEls[tid].classList.toggle('active', tid === id);
      panelEls[tid].classList.toggle('active', tid === id);
    });
  }

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
  }

  function addTab(tab, addOpts = {}) {
    buildTab(tab);
    if (addOpts.activate !== false) setActiveTab(tab.id);
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
