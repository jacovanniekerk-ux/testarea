// ============================================================
// rubrics.js
// ------------------------------------------------------------
// Ported verbatim (text, level colors, badge styling) from the
// original React app's src/data/rubrics.ts — only the subset used
// by the Classroom Report. The Culture Walkthrough page will need
// its own set (people_safety, people_confidence, practices_*,
// platforms_scheduling) — not included here since this file is
// scoped to classroom-report.js's needs.
//
// Colors are consistent BY LEVEL across every rubric (not by
// pillar): Level 1 = magenta/withdraw, Level 2 = red/stabilise,
// Level 3 = teal/explore, Level 4 = pink/lead. This matches the
// 4P Affective Transformation Model levels in the Data
// Architecture doc.
// ============================================================

function level(n, label, description) {
  const colors = {
    1: '#890C58',
    2: '#D73828',
    3: '#00A1A3',
    4: '#C8126E',
  };
  const c = colors[n];
  return {
    level: n,
    label,
    description,
    badgeText: `Level ${n}: ${label}`,
    colorClass: c,
    bgClass: `bg-[${c}]/5 hover:bg-[${c}]/10`,
    textClass: `text-[${c}]`,
    borderClass: `border-[${c}]/20`,
  };
}

// PEOPLE (Classroom) — Teacher Digital Confidence & Responsiveness
export const CLASSROOM_TEACHER_CONFIDENCE_RUBRIC = [
  level(1, 'Withdraw', 'Teacher use of technology is highly cautious or avoided. Minor technical difficulties interrupt the lesson, and the teacher may abandon the digital activity or immediately depend on outside assistance.'),
  level(2, 'Stabilise', 'Teacher manages familiar digital tools and basic problems but relies on known routines. Unexpected issues may slow the lesson or require assistance.'),
  level(3, 'Explore', 'Teacher uses technology confidently, adapts when difficulties occur and models calm problem-solving without significantly disrupting learning.'),
  level(4, 'Lead', 'Teacher uses technology flexibly and confidently, makes informed adjustments during the lesson and models independent, reflective problem-solving for learners.'),
];

// PEOPLE (Classroom) — Learner Confidence, Voice & Agency
export const CLASSROOM_LEARNER_AGENCY_RUBRIC = [
  level(1, 'Withdraw', 'Learners are mainly passive recipients of digital content and depend on the teacher for instructions, navigation and decisions. Few opportunities exist for learner choice or contribution.'),
  level(2, 'Stabilise', 'Learners participate in structured digital activities but remain strongly teacher-directed. Some learners demonstrate growing confidence in using tools independently.'),
  level(3, 'Explore', 'Learners use digital tools with increasing independence, ask questions, make choices, collaborate and contribute actively to the learning process.'),
  level(4, 'Lead', 'Learners demonstrate strong digital agency, confidently select approaches, support peers, solve routine problems and take meaningful ownership of their learning.'),
];

// PEOPLE (Classroom) — Relational Safety & Help-Seeking
export const CLASSROOM_RELATIONAL_SAFETY_RUBRIC = [
  level(1, 'Withdraw', 'Learners hesitate to ask for help or make mistakes publicly. Digital difficulties may cause frustration, disengagement or reliance entirely on the teacher.'),
  level(2, 'Stabilise', 'Learners ask for support when needed, although assistance remains mainly teacher-led and mistakes may still interrupt participation.'),
  level(3, 'Explore', 'Learners comfortably ask questions, try again after mistakes and assist one another appropriately during digital activities.'),
  level(4, 'Lead', 'Mistakes are treated naturally as part of learning. Learners confidently troubleshoot, seek or provide support and demonstrate shared responsibility for successful participation.'),
];

// PRACTICE (Classroom) — Collaboration & Shared Digital Practice
export const CLASSROOM_COLLAB_RUBRIC = [
  level(1, 'Withdraw', 'Technology use is largely individual or teacher-controlled, with little evidence of learner interaction, peer support or shared digital work.'),
  level(2, 'Stabilise', 'Learners participate in structured pair or group digital activities, but collaboration is mainly directed by the teacher.'),
  level(3, 'Explore', 'Learners regularly collaborate, share resources, give feedback and support one another through purposeful digital activities.'),
  level(4, 'Lead', 'Collaboration is embedded naturally in the lesson. Learners organise shared work, contribute different strengths, provide meaningful peer support and collectively create or solve problems using technology.'),
];

// PEDAGOGY — Lesson Design & Digital Integration
export const PEDAGOGY_DESIGN_RUBRIC = [
  level(1, 'Withdraw', 'Unused classroom tech. Smartboards and projectors sit powered off, while lessons stick strictly to traditional chalkboard lectures.'),
  level(2, 'Stabilise', 'One-way slide projection. Tech is used purely to display textbook PDFs or static slides, keeping learners passive as they read from the screen.'),
  level(3, 'Explore', 'Engaging digital practice. Tech provides interactive videos, simulations, or gamified quizzes where learners get instant feedback on their progress.'),
  level(4, 'Lead', 'Learner-led research, collaboration & creation. Technology acts as a launching pad for inquiry and active participation, with learners combining different digital tools to solve problems together.'),
];

// PEDAGOGY — Learner Agency & Artefacts
export const PEDAGOGY_AGENCY_RUBRIC = [
  level(1, 'Withdraw', "Passive viewing only. Technology stays entirely in the teacher's hands, with learners do not engage with devices, or interactive tools."),
  level(2, 'Stabilise', 'Heavy-handed guidance. Learners interact with tech in a lock-step sequence, with no room to explore, choose their own path, or create original work.'),
  level(3, 'Explore', 'Structured online practice. Learners log in to complete set tasks on learning platforms, answering questions or doing drills where the software guides their progress.'),
  level(4, 'Lead', 'Independent or collaborative creation. Learners use tech tools on their own to build, draw, code, write, or create original projects.'),
];

// PEDAGOGY — Cognitive Inclusivity & Differentiation
export const PEDAGOGY_INCLUSIVITY_RUBRIC = [
  level(1, 'Withdraw', 'One-speed teaching. Lessons push forward at a single pace, with no adjustment or extra time for learners who struggle to keep up.'),
  level(2, 'Stabilise', "One-click-fits-all pace. The whole class moves screen-by-screen together, causing panic for those who need extra time and boredom for those who don't."),
  level(3, 'Explore', 'Differentiated learning paths. Digital lessons offer distinct options so quick learners can jump to challenge activities while struggling learners access guided practice.'),
  level(4, 'Lead', 'Dynamic personalised paths. AI or adaptive software automatically adjusts lesson difficulty in real time based on learner performance.'),
];

// PEDAGOGY (Classroom) — Cyber Wellness Integration into Subject Learning
export const PEDAGOGY_CYBER_WELLNESS_RUBRIC = [
  level(1, 'Withdraw', "No visible connection is made between the subject lesson and cyber wellness, responsible digital behaviour or the learner's online experience, even where the lesson creates a natural opportunity for it."),
  level(2, 'Stabilise', 'Cyber wellness is mentioned when relevant, usually through reminders about online safety, responsible behaviour, privacy or appropriate technology use, but remains separate from the main learning activity.'),
  level(3, 'Explore', 'Cyber wellness is purposefully connected to the subject content through discussion, examples, activities or reflection, helping learners consider issues such as digital identity, online behaviour, misinformation, AI use, digital empathy or wellbeing within the learning context.'),
  level(4, 'Lead', 'Cyber wellness is naturally embedded into subject learning where relevant. Learners critically examine digital choices, behaviour, ethics and wellbeing, apply these ideas to authentic subject-based tasks, and demonstrate responsible judgement within their own digital participation and creation.'),
];

// PLATFORMS — Classroom Digital Tool Access & Usability
// (this is what the original app labels "platformsIntegration" for a
// classroom_observations row — an alias of PLATFORMS_USABILITY_RUBRIC)
export const PLATFORMS_INTEGRATION_RUBRIC = [
  level(1, 'Withdraw', 'Digital tools are unavailable, difficult to access or rarely used during the lesson. Time may be lost finding devices, logging in, resolving connectivity problems or waiting for technical support. Technology may be abandoned when difficulties arise.'),
  level(2, 'Stabilise', 'Digital tools are available and can support the lesson, but access still requires preparation, teacher control or technical assistance. Learners may depend heavily on the teacher to log in, navigate platforms or resolve basic problems.'),
  level(3, 'Explore', 'Devices and platforms are readily accessible during the lesson and learners can use them with growing independence. Transitions into digital activities are smooth, access is generally equitable and technology supports the intended learning activity without unnecessary disruption.'),
  level(4, 'Lead', 'Digital access is seamless and flexible. Teachers and learners move confidently between devices, platforms and non-digital learning according to the needs of the task. Learners can access resources independently, troubleshoot routine issues and use technology naturally as part of learning.'),
];

// PLATFORMS — Digital Tool & ePortal Integration
export const PLATFORMS_EPORTAL_RUBRIC = [
  level(1, 'Withdraw', 'Unused platforms. WCED ePortal, and digital tools are ignored, with teaching and learning relying strictly on physical or digital textbooks and paper photocopies.'),
  level(2, 'Stabilise', 'Occasional browsing. A few teachers occasionally search the ePortal for past papers or use basic digital tools for personal lesson prep, but learners rarely interact with them.'),
  level(3, 'Explore', 'Active subject support. Teachers download ePortal revision guides and CAPS materials, while using digital tools to share interactive lessons, track practice, and collect weekly classwork or homework'),
  level(4, 'Lead', 'Effortless learning flow. ePortal resources and interactive tools integrate seamlessly into daily lessons. Learning and teaching flow naturally through active online discussions, digital work submissions, and continuous progress tracking.'),
];

// ------------------------------------------------------------
// WALKTHROUGH-LEVEL RUBRICS (whole-school, culture_walkthroughs table)
// ------------------------------------------------------------

// PEOPLE (Walkthrough) — Psychological Safety & Wellbeing
export const PEOPLE_SAFETY_RUBRIC = [
  level(1, 'Withdraw', 'Fear, immediate stress, and operational defeat. Technical glitches trigger visible distress, causing the teacher to shut down equipment, apologise, and retreat back into static paper/chalk work.'),
  level(2, 'Stabilise', "Technology is only used to tick management's boxes; it is avoided or feared when unexpected tech issues happen."),
  level(3, 'Explore', 'Building a positive attitude toward tech errors and mistakes. Tech issues are normalised. Teachers feel safe to troubleshoot live or laugh off small errors in front of learners without feeling that they are being judged.'),
  level(4, 'Lead', 'Shared resilience. Teachers actively support each other through tech issues. Failures are treated strictly as data to troubleshoot together, not as a reflection of teaching ability.'),
];

// PEOPLE (Walkthrough) — Digital Confidence & Agency
export const PEOPLE_CONFIDENCE_RUBRIC = [
  level(1, 'Withdraw', 'Severe learned helplessness. The teacher feels totally unable to operate software and digital tool and relies completely on the physical presence of an ICT Champ or Lab Coordinator for the simplest tasks.'),
  level(2, 'Stabilise', 'Strict step-following. Teachers follow a fixed routine and panic or get completely stuck when unexpected pop-ups or password prompts appear.'),
  level(3, 'Explore', 'Basic self-troubleshooting. Teachers search for answers, check guides, try different browsers, or restart devices before requesting help.'),
  level(4, 'Lead', 'Proactive system ownership. Teachers design custom digital solutions, find apps for everyday tasks, and share local cheat sheets with staff.'),
];

// PRACTICES — Collaboration & School Rituals
export const PRACTICES_COLLAB_RUBRIC = [
  level(1, 'Withdraw', 'Total paper reliance. All school documents and notices are physical paper only. Digital spaces are completely unused.'),
  level(2, 'Stabilise', 'Total reliance on one or two persons. All tech falls on a single, overworked ICT Lead. If they are away, all digital systems stop working.'),
  level(3, 'Explore', 'Unofficial sharing networks. Teachers use chat groups to swap lesson materials and coordinate schedules, though no formal school platform is set up.'),
  level(4, 'Lead', 'Structured online systems. Shared platforms like Google Workspace or Teams are actively maintained, and teachers co-create lesson plans using online templates.'),
];

// PRACTICES — Professional Development & Learning Pathways
export const PRACTICES_PD_RUBRIC = [
  level(1, 'Withdraw', "Skipping development. Teachers actively avoid professional development and workshops, feeling burned out and assuming it won't be useful in the classroom."),
  level(2, 'Stabilise', 'Compliance checkbox attendance. Teachers sit silently through mandatory training because SMT demands it. No evidence of these learnings ever shows up inside their classroom lessons.'),
  level(3, 'Explore', 'Active self-learning. Teachers register for optional webinars, courses and complete online micro-learning sessions, and actively try some of the teachings and digital tools in their lessons.'),
  level(4, 'Lead', 'Structured teacher support. Designated teachers mentor their peers through regular check-ins, meetings, classroom visits, and staff developmental sessions.'),
];

// PRACTICES — Cyber Wellness & Digital Citizenship
export const PRACTICES_CYBER_RUBRIC = [
  level(1, 'Withdraw', 'Fear-based rejection. Fears about viruses, tech failure, hacking, or online safety risks keep equipment and technology locked away. Cyber wellness is ignored or treated as too complex to manage.'),
  level(2, 'Stabilise', 'Heavy-handed control. Tech is kept under lock and key, with sites blocked and tools restricted. Learners are treated as risks to manage rather than learners to trust.'),
  level(3, 'Explore', 'Teaching digital safety directly. Safe passwords, login habits, and proper online behaviour are built into regular lessons, helping learners learn and follow basic safety rules.'),
  level(4, 'Lead', 'Learner-led peer support. Learner and Teacher ambassadors assist with basic classroom tech setup, teach younger peers about their digital footprints, and lead by example in online ethics.'),
];

// PLATFORMS (Walkthrough) — Resource Scheduling, Rosters & Access Mechanics
export const PLATFORMS_SCHEDULING_RUBRIC = [
  level(1, 'Withdraw', 'Zero tech access. Computer rooms are kept locked, with no timetable, leaving equipment gathering dust while classes never use the space.'),
  level(2, 'Stabilise', 'Guarded scheduling. Lab access is strictly gatekept and rarely available for regular lessons, saved mostly for testing, admin, and/or specific projects only.'),
  level(3, 'Explore', 'Shared timetable access. Equipment and labs are booked on a clear schedule, giving multiple grades and classes steady, weekly access.'),
  level(4, 'Lead', 'Always-accessible learning spaces. Labs run on seamless, flexible scheduling, allowing learners and classes full access anytime for lessons, projects, or self-study.'),
];

// Diagnostic Scenario: Operational Resilience — single-select, not a 2x2 grid
// like the pillar rubrics (kept as its own shape since level/label differ).
export const SCENARIO_OPTIONS = [
  { value: 1, level: 1, label: 'Teacher feels defeated, turns off equipment, and reverts entirely to chalkboard. (Level 1: Withdraw)' },
  { value: 2, level: 2, label: 'Lesson halts or stalls; teacher submits a technical ticket and waits for IT assistance. (Level 2: Stabilise)' },
  { value: 3, level: 3, label: 'Teacher pivots dynamically to offline digital resources or runs are supported via a personal hotspot. (Level 3: Explore)' },
  { value: 4, level: 4, label: 'School has systemic offline local backups (e.g. local servers, pre-cached content) deployed seamlessly. (Level 4: Lead)' },
];

export const PRIMARY_BARRIER_OPTIONS = [
  'High anxiety / Fear of damaging hardware equipment',
  'Lack of immediate physical on-site technical assistance',
  'Overwhelming administrative and compliance workloads',
  'Resistance to changing familiar paper-centric routines',
  'Leadership Vacuum: Passive SMT guidance or lack of active dashboard support',
  'Confidence Deficit: Self-doubt on personal digital fluency and lack of individual agency',
  'Pedagogical Rigidity: High scheduling constraints and pressure to stick only to traditional exams',
  'Stagnation Culture: Complete absence of peer support or appetite for digital innovation',
  'None - Staff highly confident and receptive to digital changes',
];

export const COLLABORATION_CHANNEL_OPTIONS = [
  'Silos & Fear: Protectionism of materials, isolation, and fear of peer judgment',
  'Compliance-only Sharing: Materials are shared rigidly only under explicit top-down SMT directives',
  'Organic Trust Circles: Informal peer networks comfortably co-planning, sharing lessons, and troubleshooting together',
  'Generative Open Culture: High professional trust with active peer-mentoring, open classrooms, and shared lesson design',
];
