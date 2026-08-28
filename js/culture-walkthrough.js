// ============================================================
// culture-walkthrough.js
// ------------------------------------------------------------
// The school-level (whole-school) rubric form — People/Practices/
// Platforms at the culture_walkthroughs level, distinct from the
// per-classroom rubrics in classroom-report.js. Same factory
// contract: createCultureWalkthrough(containerEl, opts) returns
// { validate, getData, loadData, destroy }.
//
// This module renders ONLY the walkthrough's own fields — it does
// NOT manage any attached classroom observations. The calling page
// (culture-walkthrough.html) is responsible for also mounting one
// or more classroom-report.js instances and submitting everything
// together, per the spec's "no partial submissions for composite
// walkthroughs" rule.
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
import { escapeHtml, badgeBgClass, activeBgClass, INACTIVE_CLASS, pillarGroupHtml, categoryDividerHtml, updatePillarVisual } from './rubric-ui.js';

const PILLAR_GROUPS = [
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    field: 'people_safety',
    title: 'Pillar: PEOPLE — Psychological Safety & Wellbeing',
    subtitle: 'How safe do teachers feel when running into technical errors or trying new methodologies?',
    iconBg: 'bg-rose-50',
    options: PEOPLE_SAFETY_RUBRIC,
  },
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    field: 'people_confidence',
    title: 'Pillar: PEOPLE — Digital Confidence & Agency',
    subtitle: 'Rate the underlying capacity and motivation for self-directed growth in technology.',
    iconBg: 'bg-rose-50',
    options: PEOPLE_CONFIDENCE_RUBRIC,
  },
  {
    category: 'PRACTICES',
    categoryColor: '#00A1A3',
    field: 'practices_collab',
    title: 'Pillar: PRACTICES — Collaboration & School Rituals',
    subtitle: 'How does the school manage internal communication, file-sharing, and administrative routines?',
    iconBg: 'bg-teal-50',
    options: PRACTICES_COLLAB_RUBRIC,
  },
  {
    category: 'PRACTICES',
    categoryColor: '#00A1A3',
    field: 'practices_pd',
    title: 'Pillar: PRACTICES — Professional Development & Learning Pathways',
    subtitle: 'How does the school engage with WCED eLearning courses and self-paced modules?',
    iconBg: 'bg-indigo-50',
    options: PRACTICES_PD_RUBRIC,
  },
  {
    category: 'PRACTICES',
    categoryColor: '#00A1A3',
    field: 'practices_cyber',
    title: 'Pillar: PRACTICES — Cyber Wellness & Digital Citizenship',
    subtitle: 'How does the school address online safety and the Cyber Effect Ambassador program?',
    iconBg: 'bg-teal-50',
    options: PRACTICES_CYBER_RUBRIC,
  },
  {
    category: 'PLATFORMS',
    categoryColor: '#D73828',
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

/**
 * @param {HTMLElement} containerEl
 * @param {object} opts
 * @param {string|null} opts.schoolCemis
 * @param {string|null} opts.advisorId
 */
export function createCultureWalkthrough(containerEl, opts = {}) {
  const { schoolCemis = null, advisorId = null } = opts;

  // Shaped exactly like a culture_walkthroughs row.
  const state = {
    id: null,
    school_cemis: schoolCemis,
    advisor_id: advisorId,
    visit_date: new Date().toISOString().slice(0, 10),

    people_safety: 1,
    people_confidence: 1,
    practices_collab: 1,
    practices_pd: 1,
    practices_cyber: 1,
    platforms_scheduling: 1,
    // Not surfaced as its own control at the walkthrough level —
    // see the schema note at the top of this file.
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

  function contextDetailsHtml() {
    const barrierOptionsHtml = PRIMARY_BARRIER_OPTIONS
      .map((opt) => `<option value="${escapeHtml(opt)}" ${state.primary_barrier === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`)
      .join('');
    const collabOptionsHtml = COLLABORATION_CHANNEL_OPTIONS
      .map((opt) => `<option value="${escapeHtml(opt)}" ${state.collaboration_channel === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`)
      .join('');

    return `
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm space-y-4">
        <h4 class="text-[10px] font-bold uppercase text-slate-700 tracking-wider">Walkthrough Environmental Details</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Primary Identified Barrier / Fear Factor</label>
            <select data-field="primary_barrier"
                    class="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white outline-none cursor-pointer text-slate-700 font-medium">
              <option value="">-- Select Barrier --</option>
              ${barrierOptionsHtml}
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Staff Collaboration Mindset &amp; Trust</label>
            <select data-field="collaboration_channel"
                    class="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white outline-none cursor-pointer text-slate-700 font-medium">
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
        <label class="p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-[1.005] flex flex-col justify-between ${checked ? activeBgClass(opt.level) + ' font-semibold text-slate-900 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}"
               data-scenario-option data-value="${opt.value}">
          <input type="radio" name="${instanceId}-scenario_response" value="${opt.value}" ${checked ? 'checked' : ''}
                 class="sr-only" data-field="scenario_response" data-scenario-value="${opt.value}" />
          <div>
            <span class="inline-block text-[8px] font-black px-1.5 py-0.5 rounded-md mb-1.5 ${badgeBgClass(opt.level)}">Level ${opt.level}</span>
            <p class="leading-snug text-[10px] font-medium">${escapeHtml(opt.label)}</p>
          </div>
        </label>`;
    }).join('');

    return `
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm">
        <h4 class="text-[10px] font-bold uppercase text-slate-700 tracking-wider mb-2">Diagnostic Scenario: Operational Resilience</h4>
        <p class="text-[11px] text-slate-600 mb-2 leading-relaxed">
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
      el.className = `p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-[1.005] flex flex-col justify-between ${isChecked ? activeBgClass(opt.level) + ' font-semibold text-slate-900 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`;
    });
  }

  function render() {
    const pillarsHtml = [];
    let currentCategory = null;
    for (const group of PILLAR_GROUPS) {
      if (group.category !== currentCategory) {
        pillarsHtml.push(categoryDividerHtml(CATEGORY_LABELS[group.category], group.categoryColor));
        currentCategory = group.category;
      }
      pillarsHtml.push(pillarGroupHtml(instanceId, group, state[group.field]));
    }

    containerEl.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-culture-walkthrough-root>
        <div class="border-b border-slate-100 pb-3 mb-4">
          <h2 class="text-base font-black text-slate-900 tracking-tight uppercase">
            Macro-Level School Culture Walkthrough (PEOPLE, PRACTICES &amp; PLATFORMS)
          </h2>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Evaluate the emotional infrastructure, psychological safety, cultural routines, and school-wide access mechanics.
          </p>
        </div>

        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm mb-4 max-w-xs">
          <label class="block text-[10px] font-black uppercase text-slate-600 mb-1">Visit Date</label>
          <input type="date" data-field="visit_date" value="${escapeHtml(state.visit_date)}"
                 class="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
        </div>

        <div class="space-y-0">
          ${pillarsHtml.join('')}
        </div>

        <div class="mt-6">${contextDetailsHtml()}</div>
        <div class="mt-4">${scenarioHtml()}</div>

        <p class="mt-3 text-[10px] text-red-600 font-semibold hidden" data-validation-message></p>
      </div>`;

    attachListeners();
  }

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
    });
  }

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

  render();

  return {
    /**
     * Rubric fields always have a value (default 1), and the
     * scenario/context selects are optional context, not hard
     * blockers — the one thing that must be explicitly set is the
     * visit date, since it's NOT NULL on the schema.
     * @returns {boolean}
     */
    validate() {
      if (!state.visit_date) {
        showValidationMessage('Please set a Visit Date before continuing.');
        return false;
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
