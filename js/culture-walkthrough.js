// ============================================================
// culture-walkthrough.js
// ------------------------------------------------------------
// The school-level (whole-school) rubric form — People/Practices/
// Platforms at the culture_walkthroughs level, distinct from the
// per-classroom rubrics in classroom-report.js. Same factory
// contract: createCultureWalkthrough(containerEl, opts) returns
// { validate, getData, loadData, destroy }.
//
// Rendered as tabs (People / Practices / Platforms / General)
// instead of one long scroll — see tabs-ui.js.
//
// This module renders ONLY the walkthrough's own fields — it does
// NOT manage any attached classroom observations. The calling page
// (culture-walkthrough.html) is responsible for also mounting one
// or more classroom-report.js instances and submitting everything
// together, per the spec's "no partial submissions for composite
// walkthroughs" rule.
//
// VISIT DATE — moved out of this module. Visit date selection now
// lives on the host page (culture-walkthrough.html) next to the
// school picker, since a visit date/school pair is chosen before a
// walkthrough is even mounted. This module no longer tracks
// visit_date in its state or validates it — the host page owns that
// field and is responsible for attaching it to the row it submits.
//
// SCHEMA NOTE — read before wiring up Supabase:
// Your Data Architecture doc lists BOTH platforms_scheduling and
// platforms_integration as culture_walkthroughs columns, but the
// original working prototype only ever rendered an interactive
// rubric for platforms_scheduling at the school level —
// platforms_integration was only used at the classroom level
// (classroom_observations.platforms_integration). To avoid
// inventing a rubric that was never part of the working tool, this
// form only exposes platforms_scheduling as an input; the
// platforms_integration field is carried at a fixed schema-default
// value here (same pattern as platforms_scheduling being carried
// as a fixed default over on the classroom side). Flag this if you
// actually want a second whole-school Platforms rubric — it's a
// straightforward addition, just deliberately not assumed.
//
// Similarly, the ERD's "[Live evidence: 5 fields]" for
// culture_walkthroughs isn't part of the original prototype's UI
// (only classroom_observations has an in-class tech checklist in
// the working app). This form does NOT render a walkthrough-level
// version of that checklist — say the word if you want one added;
// it'd mirror classroom-report.js's checklist exactly.
// ============================================================

import {
  PEOPLE_SAFETY_RUBRIC,
  PEOPLE_CONFIDENCE_RUBRIC,
  PRACTICES_COLLAB_RUBRIC,
  PRACTICES_PD_RUBRIC,
  PRACTICES_CYBER_RUBRIC,
  PLATFORMS_SCHEDULING_RUBRIC,
  SCENARIO_OPTIONS,
  PRIMARY_BARRIER_OPTIONS,
  COLLABORATION_CHANNEL_OPTIONS,
} from './rubrics.js';
import { escapeHtml, badgeBgClass, activeBgClass, pillarGroupHtml, categoryDividerHtml, updatePillarVisual } from './rubric-ui.js';
import { createTabbedPanel } from './tabs-ui.js';

// Split out of the old PEOPLE_PRACTICES_GROUPS by heading — PEOPLE
// entries now live on their own tab, distinct from PRACTICES.
const PEOPLE_GROUPS = [
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    categoryIcon: 'imgs/people.png',
    field: 'people_safety',
    title: 'Pillar: PEOPLE — Psychological Safety & Wellbeing',
    subtitle: 'How safe do teachers feel when running into technical errors or trying new methodologies?',
    iconBg: 'bg-rose-50',
    options: PEOPLE_SAFETY_RUBRIC,
  },
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    categoryIcon: 'imgs/people.png',
    field: 'people_confidence',
    title: 'Pillar: PEOPLE — Digital Confidence & Agency',
    subtitle: 'Rate the underlying capacity and motivation for self-directed growth in technology.',
    iconBg: 'bg-rose-50',
    options: PEOPLE_CONFIDENCE_RUBRIC,
  },
];

const PRACTICES_GROUPS = [
  {
    category: 'PRACTICES',
    categoryColor: '#00A1A3',
    categoryIcon: 'imgs/practices.png',
    field: 'practices_collab',
    title: 'Pillar: PRACTICES — Collaboration & School Rituals',
    subtitle: 'How does the school manage internal communication, file-sharing, and administrative routines?',
    iconBg: 'bg-teal-50',
    options: PRACTICES_COLLAB_RUBRIC,
  },
  {
    category: 'PRACTICES',
    categoryColor: '#00A1A3',
    categoryIcon: 'imgs/practices.png',
    field: 'practices_pd',
    title: 'Pillar: PRACTICES — Professional Development & Learning Pathways',
    subtitle: 'How does the school engage with WCED eLearning courses and self-paced modules?',
    iconBg: 'bg-indigo-50',
    options: PRACTICES_PD_RUBRIC,
  },
  {
    category: 'PRACTICES',
    categoryColor: '#00A1A3',
    categoryIcon: 'imgs/practices.png',
    field: 'practices_cyber',
    title: 'Pillar: PRACTICES — Cyber Wellness & Digital Citizenship',
    subtitle: 'How does the school address online safety and the Cyber Effect Ambassador program?',
    iconBg: 'bg-teal-50',
    options: PRACTICES_CYBER_RUBRIC,
  },
];

const PLATFORMS_GROUPS = [
  {
    category: 'PLATFORMS',
    categoryColor: '#D73828',
    categoryIcon: 'imgs/platforms.png',
    field: 'platforms_scheduling',
    title: 'Pillar: PLATFORMS — Resource Scheduling, Rosters & Access Mechanics',
    subtitle: 'How are computer labs and mobile devices timetabled to support classrooms?',
    iconBg: 'bg-rose-50',
    options: PLATFORMS_SCHEDULING_RUBRIC,
  },
];

const CATEGORY_LABELS = {
  PEOPLE: 'PEOPLE — Soft Capability & Mindset',
  PRACTICES: 'PRACTICES — Shared Routines & Integration',
  PLATFORMS: 'PLATFORMS — Resource Scheduling, Rosters & Access Mechanics',
};

function pillarGroupsHtml(instanceId, groups, state) {
  const out = [];
  let currentCategory = null;
  for (const group of groups) {
    if (group.category !== currentCategory) {
      out.push(categoryDividerHtml(CATEGORY_LABELS[group.category], group.categoryColor, group.categoryIcon));
      currentCategory = group.category;
    }
    out.push(pillarGroupHtml(instanceId, group, state[group.field]));
  }
  return out.join('');
}

/**
 * @param {HTMLElement} containerEl
 * @param {object} opts
 * @param {string|null} opts.schoolCemis
 * @param {string|null} opts.advisorId
 */
export function createCultureWalkthrough(containerEl, opts = {}) {
  const { schoolCemis = null, advisorId = null } = opts;

  // Shaped exactly like a culture_walkthroughs row (minus visit_date,
  // which the host page now owns — see the VISIT DATE note above).
  const state = {
    id: null,
    school_cemis: schoolCemis,
    advisor_id: advisorId,

    // Deliberately null, not a default rubric level — every pillar
    // selection is compulsory and must be explicitly made by the
    // advisor. See validate() below.
    people_safety: null,
    people_confidence: null,
    practices_collab: null,
    practices_pd: null,
    practices_cyber: null,
    platforms_scheduling: null,
    // Not surfaced as its own control at the walkthrough level —
    // see the schema note at the top of this file. Not user-facing,
    // so it keeps a fixed schema-default value rather than null.
    platforms_integration: 1,

    primary_barrier: '',
    collaboration_channel: '',
    scenario_response: null,

    // Always false now that a Culture Walkthrough always includes
    // its classroom observation(s) — these columns are kept only
    // for schema compatibility with the original spec.
    only_walkthrough: false,
    only_classroom: false,

    submitted: false,
    submitted_at: null,
  };

  const instanceId = `cw-${Math.random().toString(36).slice(2, 9)}`;
  const visitedTabs = new Set();
  let tabsApi = null; // set by render(); referenced by attachListeners() to live-refresh status dots

  // People/Practices/Platforms tabs are compulsory — their dot is
  // red until every rubric field on that tab has an explicit
  // selection, then green. General is optional context, so it just
  // tracks whether the advisor has visited it (grey -> green).
  function statusDotColor(tabId) {
    if (tabId === 'people') {
      return state.people_safety != null && state.people_confidence != null ? '#10b981' : '#ef4444';
    }
    if (tabId === 'practices') {
      return state.practices_collab != null && state.practices_pd != null && state.practices_cyber != null
        ? '#10b981'
        : '#ef4444';
    }
    if (tabId === 'platforms') {
      return state.platforms_scheduling != null ? '#10b981' : '#ef4444';
    }
    return visitedTabs.has(tabId) ? '#10b981' : '#cbd5e1';
  }

  function contextDetailsHtml() {
    const barrierOptionsHtml = PRIMARY_BARRIER_OPTIONS
      .map((opt) => `<option value="${escapeHtml(opt)}" ${state.primary_barrier === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`)
      .join('');
    const collabOptionsHtml = COLLABORATION_CHANNEL_OPTIONS
      .map((opt) => `<option value="${escapeHtml(opt)}" ${state.collaboration_channel === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`)
      .join('');

    return `
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm space-y-4">
        <h4 class="field-label">Walkthrough Environmental Details</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="field-label block mb-1.5">Primary Identified Barrier / Fear Factor</label>
            <select data-field="primary_barrier"
                    class="form-field w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white outline-none cursor-pointer text-slate-700 font-medium">
              <option value="">-- Select Barrier --</option>
              ${barrierOptionsHtml}
            </select>
          </div>
          <div>
            <label class="field-label block mb-1.5">Staff Collaboration Mindset &amp; Trust</label>
            <select data-field="collaboration_channel"
                    class="form-field w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white outline-none cursor-pointer text-slate-700 font-medium">
              <option value="">-- Select Collaboration &amp; Trust Level --</option>
              ${collabOptionsHtml}
            </select>
          </div>
        </div>
      </div>`;
  }

  function scenarioHtml() {
    const cardsHtml = SCENARIO_OPTIONS.map((opt) => {
      const checked = state.scenario_response === opt.value;
      return `
        <label class="p-2.5 rounded-lg border cursor-pointer transition-all duration-200 hover:border-slate-400 hover:shadow-md flex flex-col justify-between ${checked ? activeBgClass(opt.level) + ' font-semibold text-slate-900 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}"
               data-scenario-option data-value="${opt.value}">
          <input type="radio" name="${instanceId}-scenario_response" value="${opt.value}" ${checked ? 'checked' : ''}
                 class="sr-only" data-field="scenario_response" data-scenario-value="${opt.value}" />
          <div>
            <span class="pillar-badge inline-block px-1.5 py-0.5 rounded-md mb-1.5 ${badgeBgClass(opt.level)}">Level ${opt.level}</span>
            <p class="pillar-description">${escapeHtml(opt.label)}</p>
          </div>
        </label>`;
    }).join('');

    return `
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm">
        <h4 class="field-label mb-2">Diagnostic Scenario: Operational Resilience</h4>
        <p class="pillar-subtitle mb-2">
          <strong>"If the internet drops during a digital lesson delivery, how do teachers react?"</strong><br />
          Select the choice that best matches the typical institutional response observed.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">${cardsHtml}</div>
      </div>`;
  }

  function updateScenarioVisual() {
    const labels = containerEl.querySelectorAll('[data-scenario-option]');
    labels.forEach((el) => {
      const optValue = Number(el.getAttribute('data-value'));
      const opt = SCENARIO_OPTIONS.find((o) => o.value === optValue);
      const isChecked = state.scenario_response === optValue;
      el.className = `p-2.5 rounded-lg border cursor-pointer transition-all duration-150 hover:border-slate-400 hover:shadow-md flex flex-col justify-between ${isChecked ? activeBgClass(opt.level) + ' font-semibold text-slate-900 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`;
    });
  }

  function render() {
    containerEl.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-culture-walkthrough-root>
        <div class="border-b border-slate-100 pb-3 mb-3">
          <div class="flex items-center gap-2 mb-1">
            <img src="imgs/people.png" alt="People pillar icon" class="pillar-icon" />
            <img src="imgs/practices.png" alt="Practices pillar icon" class="pillar-icon" />
            <img src="imgs/platforms.png" alt="Platforms pillar icon" class="pillar-icon" />
            <h2 class="pillar-title text-slate-900">
              Macro-Level School Culture Walkthrough (PEOPLE, PRACTICES &amp; PLATFORMS)
            </h2>
          </div>
          <p class="pillar-subtitle mt-0.5">
            Evaluate the emotional infrastructure, psychological safety, cultural routines, and school-wide access mechanics.
          </p>
        </div>

        <p class="text-[13px] text-red-600 font-semibold hidden mb-3" data-validation-message></p>

        <div data-tabs-mount></div>
      </div>`;

    const tabsMount = containerEl.querySelector('[data-tabs-mount]');

    tabsApi = createTabbedPanel(tabsMount, [
      {
        id: 'people',
        label: 'People',
        icon: 'imgs/people.png',
        render: (panel) => {
          panel.innerHTML = pillarGroupsHtml(instanceId, PEOPLE_GROUPS, state);
        },
      },
      {
        id: 'practices',
        label: 'Practices',
        icon: 'imgs/practices.png',
        render: (panel) => {
          panel.innerHTML = pillarGroupsHtml(instanceId, PRACTICES_GROUPS, state);
        },
      },
      {
        id: 'platforms',
        label: 'Platforms',
        icon: 'imgs/platforms.png',
        render: (panel) => {
          panel.innerHTML = pillarGroupsHtml(instanceId, PLATFORMS_GROUPS, state);
        },
      },
      {
        id: 'general',
        label: 'General',
        render: (panel) => {
          panel.innerHTML = `
            ${contextDetailsHtml()}
            <div class="mt-4">${scenarioHtml()}</div>`;
        },
      },
    ], {
      sticky: opts.sticky !== false,
      stickyOffset: opts.stickyOffset || 0,
      getStatusDotColor: statusDotColor,
      onActivate: (tabId) => {
        visitedTabs.add(tabId);
        if (tabsApi) tabsApi.refreshStatusDots();
      },
    });
  }

  // Attached ONCE (not inside render()) — see classroom-report.js for
  // why: containerEl persists across re-renders, so attaching inside
  // render() would stack up duplicate listeners on every loadData().
  function attachListeners() {
    containerEl.addEventListener('change', (e) => {
      const target = e.target;
      const field = target.getAttribute('data-field');
      if (!field) return;

      if (target.type === 'radio' && field === 'scenario_response') {
        state.scenario_response = Number(target.value);
        updateScenarioVisual();
      } else if (target.type === 'radio') {
        state[field] = Number(target.value);
        updatePillarVisual(containerEl, field, state[field]);
      } else if (target.tagName === 'SELECT' || target.type === 'date') {
        state[field] = target.value;
      }
      if (tabsApi) tabsApi.refreshStatusDots();
    });
  }

  // Every pillar rubric selection is compulsory — nothing defaults
  // to a level anymore, so validate() must check each one explicitly
  // and send the advisor to the first tab that's missing a choice.
  const REQUIRED_RUBRIC_FIELDS = [
    { field: 'people_safety', tab: 'people', label: 'People — Psychological Safety & Wellbeing' },
    { field: 'people_confidence', tab: 'people', label: 'People — Digital Confidence & Agency' },
    { field: 'practices_collab', tab: 'practices', label: 'Practices — Collaboration & School Rituals' },
    { field: 'practices_pd', tab: 'practices', label: 'Practices — Professional Development & Learning Pathways' },
    { field: 'practices_cyber', tab: 'practices', label: 'Practices — Cyber Wellness & Digital Citizenship' },
    { field: 'platforms_scheduling', tab: 'platforms', label: 'Platforms — Resource Scheduling, Rosters & Access Mechanics' },
  ];

  function showValidationMessage(message) {
    const el = containerEl.querySelector('[data-validation-message]');
    if (!el) return;
    if (!message) {
      el.classList.add('hidden');
      el.textContent = '';
    } else {
      el.classList.remove('hidden');
      el.textContent = message;
    }
  }

  attachListeners();
  render();

  return {
    /**
     * Every pillar rubric field is compulsory — no default level is
     * assumed, so each of the 6 must have an explicit selection
     * before this walkthrough can be submitted.
     * @returns {boolean}
     */
    validate() {
      for (const { field, tab, label } of REQUIRED_RUBRIC_FIELDS) {
        if (state[field] == null) {
          showValidationMessage(`Please select a rating for "${label}" before continuing.`);
          if (tabsApi) tabsApi.setActiveTab(tab);
          return false;
        }
      }
      showValidationMessage(null);
      return true;
    },

    /** @returns {object} a plain object matching culture_walkthroughs columns */
    getData() {
      return { ...state };
    },

    /**
     * Populate the form from an existing (draft) culture_walkthroughs
     * row — used by Past Reports when re-opening an unsubmitted
     * walkthrough.
     * @param {object} record
     */
    loadData(record) {
      if (!record) return;
      Object.assign(state, record);
      render();
    },

    /** Remove this instance's DOM and let it be garbage collected. */
    destroy() {
      containerEl.innerHTML = '';
    },
  };
}
