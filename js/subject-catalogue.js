/*
 * subject-catalogue.js
 * ------------------------------------------------------------------
 * The fixed list of subjects offered in the Classroom Observation form,
 * each mapped DETERMINISTICALLY to one of the report engine's subject
 * domains (the sets of SAMR / TPACK / scaffolding recommendations).
 *
 * Why: the engine's own matcher is keyword-based on free text, so typing
 * "Phys Sci" or "Hist" silently fell back to generic advice, and words
 * like "Communication" or "Physical Education" were mis-read as CAT/IT
 * (they contain "cat"). Selecting from this list removes both problems.
 *
 * Used by:
 *   - classroom-report.js       (renders the dropdown + match badge)
 *   - classroom-report-engine.js (exact-match override, see subjectDomain)
 *
 * To add a subject: add one line to the right group below. The domain
 * keys must exist in the engine (test-checked); the label is what gets
 * stored in classroom_observations.subject_observed.
 */

// Display names shown to the advisor in the "matched to" badge.
// Kept identical to the engine's own domain names (verified by test).
export const DOMAIN_LABELS = {
  mathematics: 'Mathematics & Mathematical Literacy',
  sciences: 'Natural Sciences & Physical / Life Sciences',
  languages: 'Languages (HL, FAL & SAL)',
  humanities: 'Humanities & Social Sciences (History, Geography, Tourism)',
  ems: 'Economic & Management Sciences (EMS / EBW - Grades 7-9 GET)',
  accounting: 'Accounting (Rekeningkunde - Grades 10-12 FET)',
  economics: 'Economics (Ekonomie - Grades 10-12 FET)',
  business_studies: 'Business Studies (Besigheidstudies - Grades 10-12 FET)',
  life_orientation: 'Life Orientation (LO / Lewensoriëntering - Senior & FET)',
  life_skills: 'Life Skills (Lewensvaardighede - Grades 4-6 Intermediate Phase)',
  technology_cat_it: 'Computer Applications Tech, IT & Technology',
  creative_arts: 'Creative Arts, Visual Arts, Music & Design',
  foundation_intermediate: 'Foundation & Intermediate Phase (Grades R-6)',
};

// Grouped for the <optgroup>s. Starts from the original tool's suggestion
// list; a few clear CAPS gaps are added (Technical Maths/Sciences, Tourism,
// isiXhosa FAL, EGD).
export const SUBJECT_GROUPS = [
  { label: 'Mathematics', domain: 'mathematics', subjects: ['Mathematics', 'Mathematical Literacy', 'Technical Mathematics'] },
  { label: 'Sciences', domain: 'sciences', subjects: ['Physical Sciences', 'Life Sciences', 'Natural Sciences', 'Technical Sciences'] },
  {
    label: 'Languages',
    domain: 'languages',
    subjects: [
      'English Home Language',
      'English First Additional Language',
      'Afrikaans Huistaal',
      'Afrikaans Eerste Addisionele Taal',
      'isiXhosa Home Language',
      'isiXhosa First Additional Language',
    ],
  },
  { label: 'Humanities & Social Sciences', domain: 'humanities', subjects: ['History', 'Geography', 'Social Sciences', 'Tourism'] },
  { label: 'Life Orientation', domain: 'life_orientation', subjects: ['Life Orientation'] },
  { label: 'Economic & Management Sciences', domain: 'ems', subjects: ['Economic and Management Sciences (EMS)'] },
  { label: 'Accounting', domain: 'accounting', subjects: ['Accounting'] },
  { label: 'Business Studies', domain: 'business_studies', subjects: ['Business Studies'] },
  { label: 'Economics', domain: 'economics', subjects: ['Economics'] },
  {
    label: 'Technology & Computing',
    domain: 'technology_cat_it',
    subjects: [
      'Computer Applications Technology (CAT)',
      'Information Technology (IT)',
      'Technology',
      'Coding & Robotics',
      'Engineering Graphics & Design (EGD)',
    ],
  },
  { label: 'Creative Arts', domain: 'creative_arts', subjects: ['Visual Arts', 'Dramatic Arts', 'Music', 'Creative Arts'] },
  { label: 'Foundation & Intermediate Phase', domain: 'foundation_intermediate', subjects: ['Foundation Phase (Literacy/Numeracy)'] },
  { label: 'Life Skills', domain: 'life_skills', subjects: ['Life Skills'] },
];

// Sentinel value of the <select> option that reveals the free-text box.
export const OTHER_VALUE = '__other__';

const LABEL_TO_DOMAIN = new Map();
const LABEL_TO_CANONICAL = new Map();
SUBJECT_GROUPS.forEach((g) =>
  g.subjects.forEach((s) => {
    LABEL_TO_DOMAIN.set(s.toLowerCase(), g.domain);
    LABEL_TO_CANONICAL.set(s.toLowerCase(), s);
  })
);

const norm = (v) => String(v ?? '').trim().toLowerCase();

/** Exact (case-insensitive) match to a listed subject -> domain key, else null. */
export function subjectDomain(subject) {
  return LABEL_TO_DOMAIN.get(norm(subject)) || null;
}

/** Returns the listed subject's canonical spelling, or null if not in the list. */
export function canonicalSubject(subject) {
  return LABEL_TO_CANONICAL.get(norm(subject)) || null;
}

export function isListedSubject(subject) {
  return LABEL_TO_DOMAIN.has(norm(subject));
}
