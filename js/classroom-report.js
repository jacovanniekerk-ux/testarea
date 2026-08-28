// ============================================================
// classroom-report.js
// ------------------------------------------------------------
// THE single reusable classroom observation form. Both
// classroom-report.html (standalone) and culture-walkthrough.html
// (one or more instances per walkthrough) import this — neither
// page contains its own copy of the rubric fields, so a change
// here updates both.
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
//   - Multi-classroom tab switching (that's the calling page's job —
//     this module only ever renders ONE classroom's fields; call it
//     once per classroom if you need several)
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

// ------------------------------------------------------------
// Pillar group definitions — order matters (this is render order).
// Each maps directly onto one classroom_observations column.
// ------------------------------------------------------------
const PILLAR_GROUPS = [
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    field: 'teacher_confidence',
    title: 'Pillar: PEOPLE — Teacher Digital Confidence & Responsiveness',
    subtitle: 'How does the teacher manage digital tools and respond to unexpected technical challenges during the lesson?',
    iconBg: 'bg-purple-50',
    options: CLASSROOM_TEACHER_CONFIDENCE_RUBRIC,
  },
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    field: 'learner_confidence',
    title: 'Pillar: PEOPLE — Learner Confidence, Voice & Agency',
    subtitle: 'To what extent do learners demonstrate independence, choice, voice, and ownership when using digital tools in the lesson?',
    iconBg: 'bg-fuchsia-50',
    options: CLASSROOM_LEARNER_AGENCY_RUBRIC,
  },
  {
    category: 'PEOPLE',
    categoryColor: '#890C58',
    field: 'relational_safety',
    title: 'Pillar: PEOPLE — Relational Safety & Help-Seeking',
    subtitle: 'How comfortable are learners with asking questions, making mistakes, seeking help, and supporting one another during digital activities?',
    iconBg: 'bg-pink-50',
    options: CLASSROOM_RELATIONAL_SAFETY_RUBRIC,
  },
  {
    category: 'PRACTICE',
    categoryColor: '#D73828',
    field: 'classroom_collab',
    title: 'Pillar: PRACTICE — Collaboration & Shared Digital Practice',
    subtitle: 'How do learners interact, collaborate, share resources, and collectively solve problems or create digital work during the lesson?',
    iconBg: 'bg-orange-50',
    options: CLASSROOM_COLLAB_RUBRIC,
  },
  {
    category: 'PEDAGOGY',
    categoryColor: '#00A1A3',
    field: 'pedagogy_design',
    title: 'Pillar: PEDAGOGY — Lesson Design & Digital Integration',
    subtitle: 'What is the functional focus of the technology in this lesson delivery?',
    iconBg: 'bg-sky-50',
    options: PEDAGOGY_DESIGN_RUBRIC,
  },
  {
    category: 'PEDAGOGY',
    categoryColor: '#00A1A3',
    field: 'pedagogy_agency',
    title: 'Pillar: PEDAGOGY — Learner Agency & Artefacts',
    subtitle: 'To what extent are learners creating knowledge rather than consuming it?',
    iconBg: 'bg-emerald-50',
    options: PEDAGOGY_AGENCY_RUBRIC,
  },
  {
    category: 'PEDAGOGY',
    categoryColor: '#00A1A3',
    field: 'pedagogy_inclusivity',
    title: 'Pillar: PEDAGOGY — Cognitive Inclusivity & Differentiation',
    subtitle: 'Does the digital design accommodate multiple paces, abilities, and remediation tracks?',
    iconBg: 'bg-teal-50',
    options: PEDAGOGY_INCLUSIVITY_RUBRIC,
  },
  {
    category: 'PEDAGOGY',
    categoryColor: '#00A1A3',
    field: 'cyber_wellness',
    title: 'Pillar: PEDAGOGY — Cyber Wellness Integration into Subject Learning',
    subtitle: 'How meaningfully are digital citizenship, cyber wellness, ethics, and online safety woven into subject lesson activities and learner tasks?',
    iconBg: 'bg-cyan-50',
    options: PEDAGOGY_CYBER_WELLNESS_RUBRIC,
  },
  {
    category: 'PLATFORMS',
    categoryColor: '#C8126E',
    field: 'platforms_integration',
    title: 'Pillar: PLATFORMS — Digital Tool Access & Usability in Lesson',
    subtitle: 'How easily can teachers and learners access and use the available digital tools during the lesson?',
    iconBg: 'bg-pink-50',
    options: PLATFORMS_INTEGRATION_RUBRIC,
  },
  {
    category: 'PLATFORMS',
    categoryColor: '#C8126E',
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
  // Defaults of 1 ("Withdraw") on every rubric field match the
  // original app's behavior of defaulting to level 1 rather than
  // forcing an explicit selection before anything is touched.
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

    teacher_confidence: 1,
    learner_confidence: 1,
    relational_safety: 1,
    classroom_collab: 1,
    pedagogy_design: 1,
    pedagogy_agency: 1,
    pedagogy_inclusivity: 1,
    cyber_wellness: 1,
    // platforms_scheduling is a whole-school metric captured on the
    // Culture Walkthrough, not per-classroom — carried here at its
    // schema default only so a standalone submission still satisfies
    // the classroom_observations CHECK (1 and 4) constraint.
    platforms_scheduling: 1,
    platforms_integration: 1,
    platforms_eportal: 1,

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

  function checklistHtml() {
    const items = CHECKLIST_FIELDS.map(
      (c) => `
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" data-field="${c.field}" ${state[c.field] ? 'checked' : ''}
                 class="w-3.5 h-3.5 rounded text-[#001489] border-slate-300 focus:ring-[#001489]" />
          <span class="text-[10px] font-bold text-slate-650">${escapeHtml(c.label)}</span>
        </label>`
    ).join('');

    return `
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm space-y-3">
        <h4 class="text-[10px] font-bold uppercase text-slate-700 tracking-wider">
          In-Class Technical Checklist (Observable Live Elements)
        </h4>
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
        <h4 class="text-[10px] font-bold uppercase text-slate-700 tracking-wider">Classroom Observation Context</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label class="block text-[9px] font-black uppercase text-slate-500 mb-1">Teacher Observed</label>
            <input type="text" data-field="teacher_name" value="${escapeHtml(state.teacher_name)}"
                   placeholder="e.g. Mrs. S. Adams"
                   class="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
          </div>
          <div>
            <label class="block text-[9px] font-black uppercase text-slate-500 mb-1">Subject Observed</label>
            <input type="text" data-field="subject_observed" value="${escapeHtml(state.subject_observed)}"
                   placeholder="e.g. Physical Sciences"
                   class="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
          </div>
          <div>
            <label class="block text-[9px] font-black uppercase text-slate-500 mb-1">Grade Observed</label>
            <select data-field="grade_observed"
                    class="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white outline-none text-slate-800">
              <option value="">-- Select Grade --</option>
              ${gradeOptionsHtml}
            </select>
          </div>
          <div>
            <label class="block text-[9px] font-black uppercase text-slate-500 mb-1">Lesson Focus Topic</label>
            <input type="text" data-field="lesson_topic" value="${escapeHtml(state.lesson_topic)}"
                   placeholder="e.g. Fractions / Algebra"
                   class="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
          </div>
          <div>
            <label class="block text-[9px] font-black uppercase text-slate-500 mb-1">Learners in Class</label>
            <input type="number" data-field="learners_count" value="${escapeHtml(state.learners_count)}"
                   placeholder="e.g. 35"
                   class="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#001489] transition bg-white text-slate-800" />
          </div>
        </div>
      </div>`;
  }

  function textareaFieldHtml(field, label, placeholder, rows) {
    return `
      <div class="space-y-2">
        <label class="block text-[10px] font-black uppercase text-slate-600 leading-tight">${escapeHtml(label)}</label>
        <textarea data-field="${field}" placeholder="${escapeHtml(placeholder)}" rows="${rows}"
                  class="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded-md focus:bg-white focus:ring-1 focus:ring-[#001489] bg-white text-slate-800">${escapeHtml(state[field])}</textarea>
      </div>`;
  }

  function evidenceFieldsHtml() {
    return `
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-5 shadow-sm space-y-4">
        <div class="flex items-center gap-1.5 border-b border-slate-200 pb-2">
          <h4 class="text-xs font-black uppercase text-slate-800 tracking-wide">Classroom Field Evidence Observations</h4>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${textareaFieldHtml('tools_used', 'Active Digital Tools & Platforms Used in the Lesson', 'e.g. Wayground (Quizizz), PhET Simulations, GeoGebra, Google Classroom, Canva...', 3)}
          ${textareaFieldHtml('artifact_verified', 'Describe the learner activities in the lesson', 'e.g. Learners worked in pairs on tablets exploring interactive fractions simulations, discovering patterns and noting findings in workbooks...', 3)}
          ${textareaFieldHtml('advisor_support', 'eAdvisor In-Classroom Suggestions & Interventions', 'e.g. Advised to pivot from teacher-centred projection to hands-on learner exploration. Support teacher to create zero-stakes digital games and peer-sharing routines...', 3)}
          ${textareaFieldHtml('general_comments', 'eAdvisor General Classroom Comments', 'Enter rough observation notes, keywords, or bullet points (e.g. good classroom climate, smartboard used for slides, learners quiet, needs interactive check for understanding, recommend Plickers/Wayground)...', 3)}
          <div class="md:col-span-2 pt-2 border-t border-slate-150">
            <div class="flex items-center gap-1.5 mb-1.5">
              <label class="block text-[10px] font-black uppercase text-[#8D6E97] leading-tight">
                Teacher Professional Development & Capacity Building Suggestions (WCED eTPD)
              </label>
              <span class="text-[9px] font-semibold text-slate-400">Optional</span>
            </div>
            <textarea data-field="teacher_upskilling" placeholder="Specify tailored WCED eTPD microlearning suggestions..." rows="2"
                      class="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded-md focus:bg-white focus:ring-1 focus:ring-[#001489] bg-white text-slate-800">${escapeHtml(state.teacher_upskilling)}</textarea>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const pillarsHtml = [];
    let currentCategory = null;
    for (const group of PILLAR_GROUPS) {
      if (group.category !== currentCategory) {
        pillarsHtml.push(categoryDividerHtml(
          group.category === 'PEOPLE' ? 'PEOPLE — Classroom Dynamics & Affective Culture'
            : group.category === 'PRACTICE' ? 'PRACTICE — Classroom Collaboration & Shared Practice'
            : group.category === 'PEDAGOGY' ? 'PEDAGOGY — Active Classroom Practice & Curriculum Integration'
            : 'PLATFORMS — Classroom Digital Tool Access & ePortal Integration',
          group.categoryColor
        ));
        currentCategory = group.category;
      }
      pillarsHtml.push(pillarGroupHtml(instanceId, group, state[group.field]));
    }

    containerEl.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-classroom-report-root>
        <div class="border-b border-slate-100 pb-3 mb-4">
          <h2 class="text-base font-black text-slate-900 tracking-tight uppercase">
            Micro-Level Classroom Observation (PEDAGOGY & PLATFORMS)${instanceLabel ? ` — ${escapeHtml(instanceLabel)}` : ''}
          </h2>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Sit in on an active lesson. Observe learner interaction, teacher pivots, and platform tool deployment.
          </p>
        </div>

        ${contextFieldsHtml()}

        <div class="space-y-0 mt-4">
          ${pillarsHtml.join('')}
        </div>

        <div class="mt-4">${checklistHtml()}</div>
        <div class="mt-4">${evidenceFieldsHtml()}</div>

        <p class="mt-3 text-[10px] text-red-600 font-semibold hidden" data-validation-message></p>
      </div>`;

    attachListeners();
  }

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
     * Checks the minimum fields needed for a meaningful classroom
     * observation. Rubric fields always have a value (default 1),
     * so they're never what blocks submission — context fields are.
     * @returns {boolean}
     */
    validate() {
      if (!state.teacher_name.trim() || !state.subject_observed.trim() || !state.grade_observed) {
        showValidationMessage('Please fill in Teacher Observed, Subject Observed, and Grade Observed before continuing.');
        return false;
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
