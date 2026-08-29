// ============================================================
// report-engine.js
// ------------------------------------------------------------
// Pure calculation logic for the diagnostic report — no DOM, no
// Supabase. Ported from the original ReportStep.tsx's scoring
// formulas and archetype thresholds.
//
// SCOPE NOTE: this is the "core report" pass — score aggregation,
// archetype identification (name/tagline/color/description), and
// radar chart geometry. The original also has 4 more narrative
// sections per archetype (Strategic Matrix, Critical Advisory Lens,
// Measures of Support, Advisory Check) in both English and
// Afrikaans — deliberately deferred, not ported here. See the
// report.html comment for where those would plug in later.
// ============================================================

/**
 * @param {object|null} walkthrough - a culture_walkthroughs row, or null for a standalone classroom report
 * @param {object[]} classrooms - one or more classroom_observations rows (always at least 1)
 * @returns {{
 *   isStandalone: boolean,
 *   peopleRating: number,
 *   practicesRating: number,
 *   pedagogyRating: number,
 *   platformsRating: number,
 *   scoreAverage: number
 * }}
 */
export function calculateScores(walkthrough, classrooms) {
  const isStandalone = !walkthrough;

  const avgField = (field) =>
    classrooms.reduce((sum, c) => sum + (Number(c[field]) || 1), 0) / classrooms.length;

  let peopleRating = 0;
  let practicesRating = 0;
  if (!isStandalone) {
    peopleRating = (Number(walkthrough.people_safety) + Number(walkthrough.people_confidence)) / 2;
    practicesRating =
      (Number(walkthrough.practices_collab) + Number(walkthrough.practices_pd) + Number(walkthrough.practices_cyber)) / 3;
  }

  const pedagogyRating = (avgField('pedagogy_design') + avgField('pedagogy_agency') + avgField('pedagogy_inclusivity')) / 3;

  const platformsRating = isStandalone
    ? (avgField('platforms_integration') + avgField('platforms_eportal')) / 2
    : (Number(walkthrough.platforms_scheduling) + avgField('platforms_integration') + avgField('platforms_eportal')) / 3;

  const scoreAverage = isStandalone
    ? (pedagogyRating + platformsRating) / 2
    : (peopleRating + practicesRating + pedagogyRating + platformsRating) / 4;

  return { isStandalone, peopleRating, practicesRating, pedagogyRating, platformsRating, scoreAverage };
}

/**
 * Archetype identity + full narrative content, ported from
 * getArchetypeInfo() in the original app. English only for now —
 * Afrikaans fields (titleAfr, textAfr, etc. in the original) are
 * deliberately not included yet.
 * @param {number} avg - composite score average (0-4)
 */
export function getArchetypeInfo(avg) {
  if (avg <= 1.5) {
    return {
      levelNum: 1,
      name: 'Withdraw',
      tagline: 'Low trust, uncertainty, fatigue and limited digital readiness',
      color: '#890C58',
      description:
        'Prioritise psychological safety and basic user confidence. SMT should foster trust and support staff on emotional levels before mandating compliance targets.',
      strategicMatrix: {
        title: 'Strategic Matrix: Operational Evidence to Affective & Cultural Insight : Withdrawal',
        operationalSignals:
          'Low or irregular use of available technology; limited transfer from training into classroom practice; learner digital participation is minimal; digital expertise may depend on one or two people; equipment or platforms may remain underused.',
        affectiveInsight:
          'The pattern may indicate low confidence, fatigue, uncertainty, poor previous experiences, weak support or a sense that digital change is being imposed rather than owned.',
        affectiveReading: 'Low trust, uncertainty, fatigue, anxiety, dependency and limited readiness.',
      },
      advisoryCheck: {
        question: 'What is driving the low participation?',
        detail:
          'Check whether the barrier is confidence, workload, access, technical difficulty, previous negative experiences, unclear expectations or lack of support.',
      },
      criticalAdvisoryLens:
        'Operational data may show low device use, limited participation, poor platform activity or little evidence of digital integration, but these figures do not explain why staff are disengaging. Low participation may be linked to fatigue, fear of failure, previous negative experiences, limited confidence, weak support or a sense that technology creates more work.\n\nThe advisor should therefore avoid interpreting low activity as simple resistance or non-compliance. Support should first rebuild trust, reduce pressure and create manageable opportunities for teachers to experience success. At this level, understanding the human barrier is as important as addressing the technical one.',
      strategicActionRules: [
        {
          num: '1',
          rule: 'Support Before Scrutiny',
          text: 'Keep the walk low-pressure and supportive. Look for barriers, uncertainty and small signs of participation rather than focusing first on what is missing.',
        },
        {
          num: '2',
          rule: 'Simplify Before Expanding',
          text: 'Focus on one or two practical digital practices that teachers can use confidently before introducing additional tools, platforms or expectations.',
        },
        {
          num: '3',
          rule: 'Notice the Small Wins',
          text: 'Identify and affirm small examples of progress, even where they appear basic. Use these successes to rebuild confidence and willingness to try again.',
        },
      ],
      measuresOfSupport: [
        {
          title: 'Strategic Direction and Practice',
          text: 'Reduce pressure and simplify expectations. Leadership should focus on a small number of achievable digital priorities, remove unnecessary compliance demands and create safe opportunities for teachers to begin using technology in ways that respond to immediate classroom and administrative needs.',
        },
        {
          title: 'Peer Learning and Collaboration',
          text: 'Create safe opportunities for teachers to learn from others without judgement. Pair staff with supportive peers, Transformation Agents or suitable neighbouring schools where they can observe simple, achievable digital practices and discuss challenges openly.',
        },
        {
          title: 'Building Confidence and Capability',
          text: 'Rebuild trust and confidence through low-risk experiences. Teachers need patient support, simple tools, practical demonstrations and opportunities to experience small successes without fear of failure, comparison or excessive monitoring.',
        },
        {
          title: 'Platform and Digital Enablement',
          text: 'Address the basic barriers that prevent participation. The school should establish what devices, connectivity, platforms and technical support are available, resolve critical access problems and focus teachers on a small number of reliable tools rather than introducing additional platforms.',
        },
        {
          title: 'Cyber Wellness and Digital Citizenship',
          text: 'Establish basic safety, trust and responsible-use foundations. Teachers and learners need clear guidance on online safety, privacy, digital behaviour and appropriate technology use, while support should address anxiety, harmful experiences and uncertainty around digital participation.',
        },
      ],
    };
  } else if (avg <= 2.5) {
    return {
      levelNum: 2,
      name: 'Stabilise',
      tagline: 'Growing confidence, cautious participation, increasing trust and emerging collective responsibility',
      color: '#D73828',
      description:
        'Incorporate organic teacher groups. Move lessons away from static, teacher-focused projection routines and towards active, learner-facing engagement.',
      strategicMatrix: {
        title: 'Strategic Matrix: Operational Evidence to Affective & Cultural Insight : Stabilise',
        operationalSignals:
          'Technology use is increasing but remains uneven; common routines are beginning to emerge; professional development participation is improving; teachers still depend on confident colleagues for support; learner use remains inconsistent.',
        affectiveInsight:
          'The school may be developing trust and confidence but still needs predictability, reassurance and repeated opportunities to practise before digital use feels normal.',
        affectiveReading: 'Growing confidence, cautious participation, increasing trust, need for reassurance and emerging collective responsibility.',
      },
      advisoryCheck: {
        question: 'What is becoming stable, and where does confidence still depend on support?',
        detail: 'Check which routines teachers can manage independently and where they still need reassurance, coaching or peer assistance.',
      },
      criticalAdvisoryLens:
        'Operational data may begin to show increased use of devices, platforms and digital tools, but participation is likely to remain uneven. Some teachers may be progressing confidently while others continue to depend on familiar routines or more experienced colleagues.\n\nThe advisor should look beyond whether technology is being used and consider how secure and sustainable that use has become. Teachers may still need reassurance, clear routines, practical support and repeated opportunities to practise before digital use feels normal rather than additional.\n\nSupport should therefore strengthen consistency without creating unnecessary pressure or introducing too much complexity too quickly.',
      strategicActionRules: [
        {
          num: '1',
          rule: 'Consistency Before Complexity',
          text: 'Look for digital practices that are beginning to work and help teachers repeat them consistently across lessons, departments or school routines.',
        },
        {
          num: '2',
          rule: 'Coach Within Everyday Practice',
          text: 'Support teachers inside the work they are already doing, including planning, assessment, communication and classroom teaching, rather than adding separate digital tasks.',
        },
        {
          num: '3',
          rule: 'Build Peer Confidence',
          text: 'Identify teachers who can support colleagues and encourage simple peer demonstrations, shared planning and practical exchange of ideas.',
        },
      ],
      measuresOfSupport: [
        {
          title: 'Strategic Direction and Practice',
          text: 'Establish clear expectations and consistent everyday routines. Leadership should identify common digital practices for teaching, assessment, communication and administration, while ensuring that teachers understand what is expected and have the support required to participate confidently.',
        },
        {
          title: 'Peer Learning and Collaboration',
          text: 'Develop regular internal peer support. Establish buddy systems, informal demonstrations and shared planning opportunities that allow more confident teachers to support colleagues and reduce dependence on external assistance.',
        },
        {
          title: 'Building Confidence and Capability',
          text: 'Strengthen practical digital capability through regular use. Professional development should focus on the tools and practices teachers need for everyday teaching, assessment, communication and administration, supported by coaching and opportunities to practise.',
        },
        {
          title: 'Platform and Digital Enablement',
          text: 'Create consistency in how available platforms and devices are used. Teachers need clear guidance on which tools support teaching, assessment, communication and administration, together with reliable access, simple procedures and appropriate technical support.',
        },
        {
          title: 'Cyber Wellness and Digital Citizenship',
          text: 'Develop consistent expectations and everyday cyber wellness practices. Digital boundaries, responsible behaviour, professional conduct and learner safety should become visible in classroom routines, school communication and the responsible use of devices and platforms.',
        },
      ],
    };
  } else if (avg <= 3.5) {
    return {
      levelNum: 3,
      name: 'Explore',
      tagline: 'Curiosity, agency, confidence, experimentation and growing digital ownership',
      color: '#00A1A3',
      description:
        'Embed systemic structures. Solidify enthusiastic digital practices by introducing structured files and common G-Suite/Teams workflows into standard planning.',
      strategicMatrix: {
        title: 'Strategic Matrix: Operational Evidence to Affective & Cultural Insight : Explore',
        operationalSignals:
          'Strong digital practice is visible in several classrooms or departments; teachers are experimenting; learners increasingly create and collaborate digitally; peer sharing is growing; some areas of the school remain stronger than others.',
        affectiveInsight:
          'The school is showing confidence, curiosity and agency, but progress may still depend on particular champions. The need now is connection, recognition and greater shared ownership.',
        affectiveReading: 'Curiosity, agency, confidence, experimentation, professional pride, collaboration and growing ownership.',
      },
      advisoryCheck: {
        question: 'How widely is strong practice actually shared?',
        detail: 'Check whether progress is becoming part of the school culture or remains dependent on particular teachers, departments or champions.',
      },
      criticalAdvisoryLens:
        'Operational evidence may show growing platform use, stronger learner participation and more examples of digital teaching and learning. However, the data may hide the fact that much of this progress is being driven by a small number of confident teachers, departments or champions.\n\nThe advisor should identify where energy and innovation already exist and how these strengths can be shared across the school. At this stage, support should move away from basic tool training and towards collaboration, pedagogical experimentation, teacher agency and opportunities for staff to learn from one another.\n\nThe key risk is no longer resistance, but good practice remaining isolated.',
      strategicActionRules: [
        {
          num: '1',
          rule: 'Connect Before Scaling',
          text: 'Identify strong practice already happening in classrooms or departments and create opportunities for it to be shared across the school.',
        },
        {
          num: '2',
          rule: 'Deepen Learner Agency',
          text: 'Look beyond teacher use of technology and focus increasingly on what learners are doing, creating, questioning, collaborating and solving through digital learning.',
        },
        {
          num: '3',
          rule: 'Turn Pockets into Practice',
          text: 'Help the school move successful digital approaches from individual teachers into shared planning, routines and departmental or whole-school practice.',
        },
      ],
      measuresOfSupport: [
        {
          title: 'Strategic Direction and Practice',
          text: 'Strengthen and connect successful practice across the school. Leadership should identify what is already working, build it into departmental and subject planning, and create greater consistency so that effective digital practice is no longer dependent on individual teachers.',
        },
        {
          title: 'Peer Learning and Collaboration',
          text: 'Build structured professional collaboration within and beyond the school. Teachers should share resources, demonstrate effective practice, co-design learning activities and participate in subject, circuit or district communities where digital practice can be exchanged and strengthened.',
        },
        {
          title: 'Building Confidence and Capability',
          text: 'Develop teacher agency, experimentation and professional judgement. Teachers should be encouraged to test new approaches, adapt technology to learner needs, reflect on what works and increasingly share their knowledge with colleagues.',
        },
        {
          title: 'Platform and Digital Enablement',
          text: 'Move from access towards purposeful and integrated use. Platforms should increasingly support collaboration, learner creation, assessment, differentiated learning and resource sharing, while the school reviews where infrastructure or access gaps still limit effective practice.',
        },
        {
          title: 'Cyber Wellness and Digital Citizenship',
          text: 'Embed cyber wellness into learning and wider school culture. Teachers should integrate digital citizenship, online behaviour, AI awareness, digital empathy and responsible decision-making into relevant curriculum areas, while learners begin taking more active roles in awareness and peer support.',
        },
      ],
    };
  }
  return {
    levelNum: 4,
    name: 'Lead',
    tagline: 'Ownership, autonomy, distributed leadership and systemic digital transformation',
    color: '#C8126E',
    description:
      'Lighthouse standard. Empower teachers as school-wide mentors. Shares custom learner-created artefacts and supports neighbouring schools in surrounding circuits.',
    strategicMatrix: {
      title: 'Strategic Matrix: Operational Evidence to Affective & Cultural Insight : Lead',
      operationalSignals:
        'Digital practice is consistent across the school; expertise is distributed; learners participate actively and independently; teachers mentor one another; systems support teaching, learning and administration; the school can share practice with others.',
      affectiveInsight:
        'The school demonstrates collective confidence, ownership and professional autonomy. Support should recognise this maturity rather than return the school to compliance-driven intervention.',
      affectiveReading: 'Ownership, autonomy, collective confidence, distributed leadership, reflective practice and responsibility for others.',
    },
    advisoryCheck: {
      question: 'What evidence shows meaningful impact rather than simply high activity?',
      detail: 'Check learner experience, quality of teaching, sustainability, staff ownership, equity and whether the school can maintain and share its practice independently.',
    },
    criticalAdvisoryLens:
      'Operational data may show strong and consistent technology use, high levels of digital participation and embedded practice across the institution. At this level, however, high activity alone should not be treated as proof of meaningful transformation.\n\nThe advisor should look for quality, learner agency, sustainability, reflective practice and evidence of impact. A Lead school should not require the same level of directive support as a developing school. Excessive monitoring or compliance requirements may actually limit the professional ownership that has enabled the school to progress.\n\nSupport should therefore create space for innovation, mentoring, reflection and contribution to the wider system.',
    strategicActionRules: [
      {
        num: '1',
        rule: 'Enable Rather Than Direct',
        text: 'Give the school greater space to lead its own digital development, with the advisor acting as a critical partner rather than directing everyday practice.',
      },
      {
        num: '2',
        rule: 'Look for Impact, Not Activity',
        text: 'Move beyond counting device use or platform activity and examine whether digital practice is improving learner participation, teaching quality, assessment and school effectiveness.',
      },
      {
        num: '3',
        rule: 'Extend Leadership Outwards',
        text: 'Encourage teachers and school leaders to mentor others, share models of practice, host learning opportunities and contribute to district or provincial digital development.',
      },
    ],
    measuresOfSupport: [
      {
        title: 'Strategic Direction and Practice',
        text: 'Sustain embedded practice and extend institutional influence. Leadership should use evidence to refine digital strategy, encourage innovation, document successful approaches and position the school to contribute to wider district and provincial digital transformation.',
      },
      {
        title: 'Peer Learning and Collaboration',
        text: 'Shift from receiving support to providing it. Teachers and school leaders should mentor other schools, host demonstration lessons or professional learning sessions, contribute resources and help grow wider communities of digital practice.',
      },
      {
        title: 'Building Confidence and Capability',
        text: 'Grow advanced capability and distributed digital leadership. Experienced teachers should deepen their pedagogical practice, mentor others, lead professional learning and develop the confidence to innovate, evaluate and influence practice beyond their own classrooms.',
      },
      {
        title: 'Platform and Digital Enablement',
        text: 'Optimise platforms as part of a connected institutional ecosystem. The school should use digital systems strategically across teaching, learning and management, regularly review effectiveness and accessibility, and explore emerging technologies where they add meaningful educational value.',
      },
      {
        title: 'Cyber Wellness and Digital Citizenship',
        text: 'Develop learner and teacher leadership in cyber wellness. Digital citizenship and wellbeing should be embedded across school culture, with learners and staff leading initiatives, mentoring peers, contributing resources and sharing effective cyber wellness practices with the wider school community.',
      },
    ],
  };
}

/**
 * Radar/diamond chart geometry, ported exactly from the original's
 * getCoord() math. Top: People (270°), Right: Practices (0°),
 * Bottom: Pedagogy (90°), Left: Platforms (180°).
 * @param {{peopleRating: number, practicesRating: number, pedagogyRating: number, platformsRating: number, isStandalone: boolean}} scores
 * @returns {{center: number, radius: number, points: {people: string, practices: string, pedagogy: string, platforms: string}, pointsPath: string}}
 */
export function getRadarGeometry(scores) {
  const center = 100;
  const radius = 72;

  const getCoord = (score, angle) => {
    const factor = score / 4;
    const rad = (angle * Math.PI) / 180;
    const x = center + radius * factor * Math.cos(rad);
    const y = center + radius * factor * Math.sin(rad);
    return `${x},${y}`;
  };

  const points = {
    people: getCoord(scores.peopleRating, 270),
    practices: getCoord(scores.practicesRating, 0),
    pedagogy: getCoord(scores.pedagogyRating, 90),
    platforms: getCoord(scores.platformsRating, 180),
  };

  // Standalone classroom reports have no People/Practices data —
  // only plot the two axes that actually apply, matching the
  // original's onlyClassroom polygon.
  const pointsPath = scores.isStandalone
    ? `${points.pedagogy} ${points.platforms}`
    : `${points.people} ${points.practices} ${points.pedagogy} ${points.platforms}`;

  return { center, radius, points, pointsPath };
}
