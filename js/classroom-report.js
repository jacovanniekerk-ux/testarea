// ============================================================
// classroom-report.js
// ------------------------------------------------------------
// THE single reusable classroom observation form. Both
// classroom-report.html (standalone) and culture-walkthrough.html
// (one or more instances per walkthrough) import this — neither
// page contains its own copy of the rubric fields, so a change
// here updates both.
//
// Rendered as tabs (Context & Tech / People / Practice / Pedagogy /
// Platforms / Evidence) instead of one long scroll — see tabs-ui.js.
//
// Usage:
//   import { createClassroomReport } from './classroom-report.js';
//   const report = createClassroomReport(containerEl, {
//     schoolCemis: '123456',
//     advisorId: advisor.id,
//     cultureWalkthroughId: null, // or a walkthrough UUID if linked
//   });
//   ... later ...
//   if (report.validate()) {
//     const row = report.getData(); // matches classroom_observations columns
//   }
//
// DELIBERATELY NOT INCLUDED YET (ported from the original React app
// but out of scope for this pass — flagging so nothing's silently
// dropped):
//   - The "Enhance with AI" note-rewriting buttons per textarea
//   - The searchable EdTech tool catalog / quick-add chips
//   - Subject-domain auto-detection badges (CAPS phase, playbooks)
//
// The Back/Submit/Generate-Report buttons are NOT part of this
// module either — the calling page owns navigation and submission
// timing (a standalone report submits itself; a walkthrough's
// classroom observations submit atomically together with the
// parent walkthrough, per the Data Architecture spec).
// ============================================================

import {
  CLASSROOM_TEACHER_CONFIDENCE_RUBRIC,
  CLASSROOM_LEARNER_AGENCY_RUBRIC,
  CLASSROOM_RELATIONAL_SAFETY_RUBRIC,
  CLASSROOM_COLLAB_RUBRIC,
  PEDAGOGY_DESIGN_RUBRIC,
  PEDAGOGY_AGENCY_RUBRIC,
  PEDAGOGY_INCLUSIVITY_RUBRIC,
  PEDAGOGY_CYBER_WELLNESS_RUBRIC,
  PLATFORMS_INTEGRATION_RUBRIC,
  PLATFORMS_EPORTAL_RUBRIC,
} from './rubrics.js';
import { escapeHtml, pillarGroupHtml, categoryDividerHtml, updatePillarVisual } from './rubric-ui.js';
import { createTabbedPanel } from './tabs-ui.js';

// ------------------------------------------------------------
// Pillar group definitions — each maps directly onto one
// classroom_observations column. Grouped here by which TAB they
// belong to. People and Practice were previously one shared tab —
// now split into their own tabs, one group array each.
// ------------------------------------------------------------
const PEOPLE_GROUPS = [
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    categoryIcon: 'imgs/people.png',
    field: 'teacher_confidence',
    title: 'Pillar: PEOPLE — Teacher Digital Confidence & Responsiveness',
    subtitle: 'How does the teacher manage digital tools and respond to unexpected technical challenges during the lesson?',
    iconBg: 'bg-purple-50',
    options: CLASSROOM_TEACHER_CONFIDENCE_RUBRIC,
  },
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    categoryIcon: 'imgs/people.png',
    field: 'learner_confidence',
    title: 'Pillar: PEOPLE — Learner Confidence, Voice & Agency',
    subtitle: 'To what extent do learners demonstrate independence, choice, voice, and ownership when using digital tools in the lesson?',
    iconBg: 'bg-fuchsia-50',
    options: CLASSROOM_LEARNER_AGENCY_RUBRIC,
  },
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    categoryIcon: 'imgs/people.png',
    field: 'relational_safety',
    title: 'Pillar: PEOPLE — Relational Safety & Help-Seeking',
    subtitle: 'How comfortable are learners with asking questions, making mistakes, seeking help, and supporting one another during digital activities?',
    iconBg: 'bg-pink-50',
    options: CLASSROOM_RELATIONAL_SAFETY_RUBRIC,
  },
];

const PRACTICE_GROUPS = [
  {
    category: 'PRACTICE',
    categoryColor: '#00A1A3',
    categoryIcon: 'imgs/practices.png',
    field: 'classroom_collab',
    title: 'Pillar: PRACTICE — Collaboration & Shared Digital Practice',
    subtitle: 'How do learners interact, collaborate, share resources, and collectively solve problems or create digital work during the lesson?',
    iconBg: 'bg-orange-50',
    options: CLASSROOM_COLLAB_RUBRIC,
  },
];

const PEDAGOGY_GROUPS = [
  {
    category: 'PEDAGOGY',
    categoryColor: '#C8126E',
    categoryIcon: 'imgs/pedagogy.png',
    field: 'pedagogy_design',
    title: 'Pillar: PEDAGOGY — Lesson Design & Digital Integration',
    subtitle: 'What is the functional focus of the technology in this lesson delivery?',
    iconBg: 'bg-sky-50',
    options: PEDAGOGY_DESIGN_RUBRIC,
  },
  {
    category: 'PEDAGOGY',
    categoryColor: '#C8126E',
    categoryIcon: 'imgs/pedagogy.png',
    field: 'pedagogy_agency',
    title: 'Pillar: PEDAGOGY — Learner Agency & Artefacts',
    subtitle: 'To what extent are learners creating knowledge rather than consuming it?',
    iconBg: 'bg-emerald-50',
    options: PEDAGOGY_AGENCY_RUBRIC,
  },
  {
    category: 'PEDAGOGY',
    categoryColor: '#C8126E',
    categoryIcon: 'imgs/pedagogy.png',
    field: 'pedagogy_inclusivity',
    title: 'Pillar: PEDAGOGY — Cognitive Inclusivity & Differentiation',
    subtitle: 'Does the digital design accommodate multiple paces, abilities, and remediation tracks?',
    iconBg: 'bg-teal-50',
    options: PEDAGOGY_INCLUSIVITY_RUBRIC,
  },
  {
    category: 'PEDAGOGY',
    categoryColor: '#C8126E',
    categoryIcon: 'imgs/pedagogy.png',
    field: 'cyber_wellness',
    title: 'Pillar: PEDAGOGY — Cyber Wellness Integration into Subject Learning',
    subtitle: 'How meaningfully are digital citizenship, cyber wellness, ethics, and online safety woven into subject lesson activities and learner tasks?',
    iconBg: 'bg-cyan-50',
    options: PEDAGOGY_CYBER_WELLNESS_RUBRIC,
  },
];

const PLATFORMS_GROUPS = [
  {
    category: 'PLATFORMS',
    categoryColor: '#D73828',
    categoryIcon: 'imgs/platforms.png',
    field: 'platforms_integration',
    title: 'Pillar: PLATFORMS — Digital Tool Access & Usability in Lesson',
    subtitle: 'How easily can teachers and learners access and use the available digital tools during the lesson?',
    iconBg: 'bg-pink-50',
    options: PLATFORMS_INTEGRATION_RUBRIC,
  },
  {
    category: 'PLATFORMS',
    categoryColor: '#D73828',
    categoryIcon: 'imgs/platforms.png',
    field: 'platforms_eportal',
    title: 'Pillar: PLATFORMS — Digital tool and ePortal integration',
    subtitle: 'How effectively are WCED ePortal resources and interactive digital tools integrated into lesson routines and learning workflows?',
    iconBg: 'bg-purple-50',
    options: PLATFORMS_EPORTAL_RUBRIC,
  },
];

const CHECKLIST_FIELDS = [
  { field: 'smartboard_observed', label: 'Smart Classroom Technology Use' },
  { field: 'tablets_observed', label: 'Learner Tablets' },
  { field: 'lab_observed', label: 'eLearning Lab in-use' },
  { field: 'internet_observed', label: 'Online Activities' },
  { field: 'offline_observed', label: 'Offline Digital Resources/Tool' },
];

const GRADE_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
  'Grade R',
  'Multi-Grade',
];

/**
 * Renders a sequence of pillar groups, inserting a category divider
 * whenever the category changes.
 */
function pillarGroupsHtml(instanceId, groups, state) {
  const out = [];
  let currentCategory = null;
  const categoryLabels = {
    PEOPLE: 'PEOPLE — Classroom Dynamics & Affective Culture',
    PRACTICE: 'PRACTICE — Classroom Collaboration & Shared Practice',
    PEDAGOGY: 'PEDAGOGY — Active Classroom Practice & Curriculum Integration',
    PLATFORMS: 'PLATFORMS — Classroom Digital Tool Access & ePortal Integration',
  };
  for (const group of groups) {
    if (group.category !== currentCategory) {
      out.push(categoryDividerHtml(categoryLabels[group.category], group.categoryColor, group.categoryIcon));
      currentCategory = group.category;
    }
    out.push(pillarGroupHtml(instanceId, group, state[group.field]));
  }
  return out.join('');
}

/**
 * @param {HTMLElement} containerEl - element to render the form into
 * @param {object} opts
 * @param {string|null} opts.schoolCemis
 * @param {string|null} opts.advisorId
 * @param {string|null} opts.cultureWalkthroughId - null for a standalone report
 * @param {string} [opts.instanceLabel] - e.g. "Classroom 1" for display when multiple instances are on one page
 */
export function createClassroomReport(containerEl, opts = {}) {
  const {
    schoolCemis = null,
    advisorId = null,
    cultureWalkthroughId = null,
    instanceLabel = null,
  } = opts;

  // Internal state shaped EXACTLY like a classroom_observations row.
  // Every pillar rubric field is deliberately null, not a default
  // level — each is a compulsory field the advisor must explicitly
  // set. See validate() below.
  const state = {
    id: null, // set by loadData() when editing an existing draft
    culture_walkthrough_id: cultureWalkthroughId,
    school_cemis: schoolCemis,
    advisor_id: advisorId,

    teacher_name: '',
    subject_observed: '',
    grade_observed: '',
    lesson_topic: '',
    learners_count: '',

    smartboard_observed: false,
    tablets_observed: false,
    lab_observed: false,
    internet_observed: false,
    offline_observed: false,

    teacher_confidence: null,
    learner_confidence: null,
    relational_safety: null,
    classroom_collab: null,
    pedagogy_design: null,
    pedagogy_agency: null,
    pedagogy_inclusivity: null,
    cyber_wellness: null,
    // platforms_scheduling is a whole-school metric captured on the
    // Culture Walkthrough, not per-classroom — carried here at its
    // schema default only so a standalone submission still satisfies
    // the classroom_observations CHECK (1 and 4) constraint. Not
    // user-facing, so (unlike the fields above) it keeps a fixed
    // default rather than null.
    platforms_scheduling: 1,
    platforms_integration: null,
    platforms_eportal: null,

    tools_used: '',
    artifact_verified: '',
    teacher_upskilling: '',
    advisor_support: '',
    general_comments: '',
    // Not surfaced as their own inputs (matches original app, which
    // also carries these as legacy/unused fields on this form).
    teacher_action: '',
    learner_action: '',

    submitted: false,
    submitted_at: null,
  };

  const instanceId = `cr-${Math.random().toString(36).slice(2, 9)}`;
  const visitedTabs = new Set();
  let tabsApi = null; // set by render(); referenced by attachListeners() to live-refresh status dots

  const TAB_LABELS = {
    context: 'Context & Tech',
    people: 'People',
    practice: 'Practice',
    pedagogy: 'Pedagogy',
    platforms: 'Platforms',
    evidence: 'Evidence',
  };

  function isContextComplete() {
    return Boolean(state.teacher_name.trim() && state.subject_observed.trim() && state.grade_observed);
  }

  /**
   * Red/green on Context and on every rubric tab (People, Practice,
   * Pedagogy, Platforms) — each has compulsory fields now. Evidence
   * keeps the simple "have you looked at this yet" green/grey, since
   * its fields are free-text notes, not required selections.
   */
  function statusDotColor(tabId) {
    if (tabId === 'context') return isContextComplete() ? '#10b981' : '#ef4444';
    if (tabId === 'people') {
      return state.teacher_confidence != null && state.learner_confidence != null && state.relational_safety != null
        ? '#10b981'
        : '#ef4444';
    }
    if (tabId === 'practice') return state.classroom_collab != null ? '#10b981' : '#ef4444';
    if (tabId === 'pedagogy') {
      return state.pedagogy_design != null && state.pedagogy_agency != null
        && state.pedagogy_inclusivity != null && state.cyber_wellness != null
        ? '#10b981'
        : '#ef4444';
    }
    if (tabId === 'platforms') {
      return state.platforms_integration != null && state.platforms_eportal != null ? '#10b981' : '#ef4444';
    }
    return visitedTabs.has(tabId) ? '#10b981' : '#cbd5e1';
  }

  function checklistHtml() {
    const items = CHECKLIST_FIELDS.map(
      (c) => `
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" data-field="${c.field}" ${state[c.field] ? 'checked' : ''}
                 class="w-4 h-4 rounded text-[#001489] border-slate-300 focus:ring-[#001489]" />
          <span class="field-label">${escapeHtml(c.label)}</span>
        </label>`
    ).join('');

    return `
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm space-y-3">
        <h4 class="field-label">In-Class Technical Checklist (Observable Live Elements)</h4>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white p-3 rounded border border-slate-150">
          ${items}
        </div>
      </div>`;
  }

  function contextFieldsHtml() {
    const gradeOptionsHtml = GRADE_OPTIONS
      .map((g) => `<option value="${escapeHtml(g)}" ${state.grade_observed === g ? 'selected' : ''}>${escapeHtml(g)}</option>`)
      .join('');

    return `
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm space-y-3">
        <h4 class="field-label">Classroom Observation Context</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label class="field-label block mb-1">Teacher Observed</label>
            <input type="text" data-field="teacher_name" value="${escapeHtml(state.teacher_name)}"
                   placeholder="e.g. Mrs. S. Adams"
                   class="form-field w-full px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
          </div>
          <div>
            <label class="field-label block mb-1">Subject Observed</label>
            <input type="text" data-field="subject_observed" value="${escapeHtml(state.subject_observed)}"
                   placeholder="e.g. Physical Sciences"
                   class="form-field w-full px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
          </div>
          <div>
            <label class="field-label block mb-1">Grade Observed</label>
            <select data-field="grade_observed"
                    class="form-field w-full px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white outline-none text-slate-800">
              <option value="">-- Select Grade --</option>
              ${gradeOptionsHtml}
            </select>
          </div>
          <div>
            <label class="field-label block mb-1">Lesson Focus Topic</label>
            <input type="text" data-field="lesson_topic" value="${escapeHtml(state.lesson_topic)}"
                   placeholder="e.g. Fractions / Algebra"
                   class="form-field w-full px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
          </div>
          <div>
            <label class="field-label block mb-1">Learners in Class</label>
            <input type="number" data-field="learners_count" value="${escapeHtml(state.learners_count)}"
                   placeholder="e.g. 35"
                   class="form-field w-full px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
          </div>
        </div>
      </div>`;
  }

  function textareaFieldHtml(field, label, placeholder, rows) {
    return `
      <div class="space-y-2">
        <label class="field-label block leading-tight">${escapeHtml(label)}</label>
        <textarea data-field="${field}" placeholder="${escapeHtml(placeholder)}" rows="${rows}"
                  class="form-field w-full px-2.5 py-1.5 border border-slate-250 rounded-md focus:bg-white focus:ring-1 focus:ring-[#001489] bg-white text-slate-800">${escapeHtml(state[field])}</textarea>
      </div>`;
  }

  function evidenceFieldsHtml() {
    return `
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-5 shadow-sm space-y-4">
        <div class="flex items-center gap-1.5 border-b border-slate-200 pb-2">
          <h4 class="section-heading text-slate-800">Classroom Field Evidence Observations</h4>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${textareaFieldHtml('tools_used', 'Active Digital Tools & Platforms Used in the Lesson', 'e.g. Wayground (Quizizz), PhET Simulations, GeoGebra, Google Classroom, Canva...', 3)}
          ${textareaFieldHtml('artifact_verified', 'Describe the learner activities in the lesson', 'e.g. Learners worked in pairs on tablets exploring interactive fractions simulations, discovering patterns and noting findings in workbooks...', 3)}
          ${textareaFieldHtml('advisor_support', 'eAdvisor In-Classroom Suggestions & Interventions', 'e.g. Advised to pivot from teacher-centred projection to hands-on learner exploration. Support teacher to create zero-stakes digital games and peer-sharing routines...', 3)}
          ${textareaFieldHtml('general_comments', 'eAdvisor General Classroom Comments', 'Enter rough observation notes, keywords, or bullet points (e.g. good classroom climate, smartboard used for slides, learners quiet, needs interactive check for understanding, recommend Plickers/Wayground)...', 3)}
          <div class="md:col-span-2 pt-2 border-t border-slate-150">
            <div class="flex items-center gap-1.5 mb-1.5">
              <label class="field-label leading-tight" style="color:#8D6E97;">
                Teacher Professional Development &amp; Capacity Building Suggestions (WCED eTPD)
              </label>
              <span class="eyebrow-label text-slate-400">Optional</span>
            </div>
            <textarea data-field="teacher_upskilling" placeholder="Specify tailored WCED eTPD microlearning suggestions..." rows="2"
                      class="form-field w-full px-2.5 py-1.5 border border-slate-250 rounded-md focus:bg-white focus:ring-1 focus:ring-[#001489] bg-white text-slate-800">${escapeHtml(state.teacher_upskilling)}</textarea>
          </div>
        </div>
      </div>`;
  }

  function render() {
    containerEl.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-classroom-report-root>
        <div class="border-b border-slate-100 pb-3 mb-3">
          <div class="flex items-center gap-2 mb-1">
            <img src="imgs/people.png" alt="People pillar icon" class="pillar-icon" />
            <img src="imgs/practices.png" alt="Practice pillar icon" class="pillar-icon" />
            <img src="imgs/pedagogy.png" alt="Pedagogy pillar icon" class="pillar-icon" />
            <img src="imgs/platforms.png" alt="Platforms pillar icon" class="pillar-icon" />
            <h2 class="pillar-title text-slate-900">
              Micro-Level Classroom Observation (PEDAGOGY &amp; PLATFORMS)${instanceLabel ? ` — ${escapeHtml(instanceLabel)}` : ''}
            </h2>
          </div>
          <p class="pillar-subtitle mt-0.5">
            Sit in on an active lesson. Observe learner interaction, teacher pivots, and platform tool deployment.
          </p>
        </div>

        <p class="text-[13px] text-red-600 font-semibold hidden mb-3" data-validation-message></p>

        <div data-tabs-mount></div>
      </div>`;

    const tabsMount = containerEl.querySelector('[data-tabs-mount]');

    tabsApi = createTabbedPanel(tabsMount, [
      {
        id: 'context',
        label: TAB_LABELS.context,
        render: (panel) => {
          panel.innerHTML = `${contextFieldsHtml()}<div class="mt-4">${checklistHtml()}</div>`;
        },
      },
      {
        id: 'people',
        label: TAB_LABELS.people,
        icon: 'imgs/people.png',
        render: (panel) => {
          panel.innerHTML = pillarGroupsHtml(instanceId, PEOPLE_GROUPS, state);
        },
      },
      {
        id: 'practice',
        label: TAB_LABELS.practice,
        icon: 'imgs/practices.png',
        render: (panel) => {
          panel.innerHTML = pillarGroupsHtml(instanceId, PRACTICE_GROUPS, state);
        },
      },
      {
        id: 'pedagogy',
        label: TAB_LABELS.pedagogy,
        icon: 'imgs/pedagogy.png',
        render: (panel) => {
          panel.innerHTML = pillarGroupsHtml(instanceId, PEDAGOGY_GROUPS, state);
        },
      },
      {
        id: 'platforms',
        label: TAB_LABELS.platforms,
        icon: 'imgs/platforms.png',
        render: (panel) => {
          panel.innerHTML = pillarGroupsHtml(instanceId, PLATFORMS_GROUPS, state);
        },
      },
      {
        id: 'evidence',
        label: TAB_LABELS.evidence,
        render: (panel) => {
          panel.innerHTML = evidenceFieldsHtml();
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

  // Attached ONCE (not inside render()) since containerEl itself
  // persists across re-renders — attaching inside render() would
  // stack up duplicate listeners every time loadData() is called.
  function attachListeners() {
    containerEl.addEventListener('change', (e) => {
      const target = e.target;
      const field = target.getAttribute('data-field');
      if (!field) return;

      if (target.type === 'radio') {
        state[field] = Number(target.value);
        updatePillarVisual(containerEl, field, state[field]);
      } else if (target.type === 'checkbox') {
        state[field] = target.checked;
      } else if (target.tagName === 'SELECT') {
        state[field] = target.value;
      }
      if (tabsApi) tabsApi.refreshStatusDots();
    });

    containerEl.addEventListener('input', (e) => {
      const target = e.target;
      const field = target.getAttribute('data-field');
      if (!field) return;
      if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.type === 'text')) {
        state[field] = target.value;
      } else if (target.tagName === 'INPUT' && target.type === 'number') {
        state[field] = target.value;
      }
      if (tabsApi) tabsApi.refreshStatusDots();
    });
  }

  // Every pillar rubric field is compulsory — nothing defaults to a
  // level anymore, so validate() must check each one explicitly and
  // send the advisor to the first tab that's missing a choice.
  const REQUIRED_RUBRIC_FIELDS = [
    { field: 'teacher_confidence', tab: 'people', label: 'People — Teacher Digital Confidence & Responsiveness' },
    { field: 'learner_confidence', tab: 'people', label: 'People — Learner Confidence, Voice & Agency' },
    { field: 'relational_safety', tab: 'people', label: 'People — Relational Safety & Help-Seeking' },
    { field: 'classroom_collab', tab: 'practice', label: 'Practice — Collaboration & Shared Digital Practice' },
    { field: 'pedagogy_design', tab: 'pedagogy', label: 'Pedagogy — Lesson Design & Digital Integration' },
    { field: 'pedagogy_agency', tab: 'pedagogy', label: 'Pedagogy — Learner Agency & Artefacts' },
    { field: 'pedagogy_inclusivity', tab: 'pedagogy', label: 'Pedagogy — Cognitive Inclusivity & Differentiation' },
    { field: 'cyber_wellness', tab: 'pedagogy', label: 'Pedagogy — Cyber Wellness Integration into Subject Learning' },
    { field: 'platforms_integration', tab: 'platforms', label: 'Platforms — Digital Tool Access & Usability in Lesson' },
    { field: 'platforms_eportal', tab: 'platforms', label: 'Platforms — Digital tool and ePortal integration' },
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
     * Checks the context fields, then every compulsory pillar rubric
     * field — no rubric field has a default level anymore, so each
     * of the 10 must have an explicit selection before this
     * classroom observation can be submitted.
     * @returns {boolean}
     */
    validate() {
      if (!isContextComplete()) {
        showValidationMessage('Please fill in Teacher Observed, Subject Observed, and Grade Observed (Context & Tech tab) before continuing.');
        if (tabsApi) tabsApi.setActiveTab('context');
        return false;
      }
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

    /**
     * @returns {object} a plain object matching classroom_observations columns
     */
    getData() {
      return { ...state };
    },

    /**
     * Populate the form from an existing (draft) classroom_observations row —
     * used by Past Reports when re-opening an unsubmitted observation.
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
