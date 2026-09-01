// ============================================================
// rubric-ui.js
// ------------------------------------------------------------
// Shared rendering helpers for the 1-4 rubric "pillar card"
// selector UI, used by BOTH classroom-report.js and
// culture-walkthrough.js. Pulled out here specifically so the
// level colors/badge markup live in exactly one place — the same
// reasoning as pulling the rubric form itself into its own file.
// ============================================================

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function badgeBgClass(level) {
  switch (level) {
    case 1: return 'bg-[#890C58] text-white';
    case 2: return 'bg-[#D73828] text-white';
    case 3: return 'bg-[#00A1A3] text-white';
    case 4: return 'bg-[#C8126E] text-white';
    default: return '';
  }
}

export function activeBgClass(level) {
  switch (level) {
    case 1: return 'bg-[#890C58]/5 border-[#890C58] shadow-[#890C58]/5 ring-2 ring-[#890C58]/20';
    case 2: return 'bg-[#D73828]/5 border-[#D73828] shadow-[#D73828]/5 ring-2 ring-[#D73828]/30';
    case 3: return 'bg-[#00A1A3]/5 border-[#00A1A3] shadow-[#00A1A3]/5 ring-2 ring-[#00A1A3]/20';
    case 4: return 'bg-[#C8126E]/5 border-[#C8126E] shadow-[#C8126E]/5 ring-2 ring-[#C8126E]/20';
    default: return '';
  }
}

export const INACTIVE_CLASS = 'border-slate-200 bg-white hover:bg-slate-50';

/**
 * Renders one radio-card pillar group (a rubric field with its 4
 * level options). `instanceId` should be unique per form instance
 * on the page so radio `name` attributes don't collide when there
 * are multiple instances (e.g. several classroom reports on one
 * walkthrough page).
 */
export function pillarGroupHtml(instanceId, group, currentValue) {
  const cardsHtml = group.options
    .map((option) => {
      const checked = currentValue === option.level;
      return `
        <label class="relative p-3 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col justify-between hover:border-slate-400 hover:shadow-md ${checked ? activeBgClass(option.level) : INACTIVE_CLASS}"
               data-pillar-option data-field="${group.field}" data-level="${option.level}">
          <input type="radio" name="${instanceId}-${group.field}" value="${option.level}" ${checked ? 'checked' : ''}
                 class="sr-only" data-field="${group.field}" data-level="${option.level}" />
          <div>
            <span class="pillar-badge inline-block px-1.5 py-0.5 rounded-md mb-2 ${badgeBgClass(option.level)}">
              L${option.level}: ${escapeHtml(option.label)}
            </span>
            <p class="pillar-description">${escapeHtml(option.description)}</p>
          </div>
        </label>`;
    })
    .join('');

  return `
    <div class="bg-slate-50/50 border border-slate-100 rounded-xl p-4 md:p-5">
      <div class="flex items-center gap-1.5 mb-2">
        <div class="p-1 ${group.iconBg || 'bg-slate-100'} rounded-md w-6 h-6"></div>
        <h3 class="pillar-title text-slate-800">${escapeHtml(group.title)}</h3>
      </div>
      <p class="pillar-subtitle mb-3 max-w-3xl">${escapeHtml(group.subtitle)}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">${cardsHtml}</div>
    </div>`;
}

export function categoryDividerHtml(name, color) {
  return `
    <div class="border-l-4 pl-3 py-1 rounded-r-lg mb-4 mt-6" style="border-color:${color}; background-color:${color}0A;">
      <h4 class="category-divider-label" style="color:${color};">
        Category: ${escapeHtml(name)}
      </h4>
    </div>`;
}

/**
 * Re-applies active/inactive classes to every option label in a
 * pillar group after a selection changes, without re-rendering the
 * whole form (keeps focus/scroll position stable).
 */
export function updatePillarVisual(containerEl, field, currentValue) {
  const labels = containerEl.querySelectorAll(`[data-pillar-option][data-field="${field}"]`);
  labels.forEach((el) => {
    const optLevel = Number(el.getAttribute('data-level'));
    const isChecked = currentValue === optLevel;
    el.className = `relative p-3 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col justify-between hover:border-slate-400 hover:shadow-md ${isChecked ? activeBgClass(optLevel) : INACTIVE_CLASS}`;
  });
}
