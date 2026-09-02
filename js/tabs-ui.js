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

  // --- Top Nav Strip ---
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

  // --- Bottom Nav Strip ---
  const navStripBottom = document.createElement('div');
  navStripBottom.className = 'tab-nav-strip';

  const prevBtnBottom = document.createElement('button');
  prevBtnBottom.type = 'button';
  prevBtnBottom.className = 'tab-nav-btn';
  prevBtnBottom.innerHTML = '<i class="fa-solid fa-chevron-left"></i><span>Previous</span>';

  const stepLabelBottom = document.createElement('span');
  stepLabelBottom.className = 'tab-nav-step';

  const nextBtnBottom = document.createElement('button');
  nextBtnBottom.type = 'button';
  nextBtnBottom.className = 'tab-nav-btn';
  nextBtnBottom.innerHTML = '<span>Next</span><i class="fa-solid fa-chevron-right"></i>';

  navStripBottom.appendChild(prevBtnBottom);
  navStripBottom.appendChild(stepLabelBottom);
  navStripBottom.appendChild(nextBtnBottom);

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

  // Append header, panels, and bottom nav strip to container
  containerEl.innerHTML = '';
  containerEl.appendChild(headerWrap);
  containerEl.appendChild(panelsWrap);
  containerEl.appendChild(navStripBottom);

  function updateNavStrip() {
    const idx = tabOrder.indexOf(activeId);
    const label = labelSpanEls[activeId] ? labelSpanEls[activeId].textContent : '';
    const text = `Step ${idx + 1} of ${tabOrder.length}: ${label}`;
    const isFirst = idx <= 0;
    const isLast = idx >= tabOrder.length - 1;

    // Sync Top
    stepLabel.textContent = text;
    prevBtn.disabled = isFirst;
    nextBtn.disabled = isLast;

    // Sync Bottom
    stepLabelBottom.textContent = text;
    prevBtnBottom.disabled = isFirst;
    nextBtnBottom.disabled = isLast;
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

  // Shared nav actions
  function goPrev() {
    const idx = tabOrder.indexOf(activeId);
    if (idx > 0) setActiveTab(tabOrder[idx - 1]);
  }

  function goNext() {
    const idx = tabOrder.indexOf(activeId);
    if (idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1]);
  }

  // Attach listeners to both sets of buttons
  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);
  prevBtnBottom.addEventListener('click', goPrev);
  nextBtnBottom.addEventListener('click', goNext);

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
    else updateNavStrip();
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
