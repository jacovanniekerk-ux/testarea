/*
 * classroom-report-view.js
 * ------------------------------------------------------------------
 * Renders the standalone Classroom Observation & Digital Transformation
 * report — a port of the original Google AI Studio build's classroom
 * report (the one that is NOT the whole-school culture report):
 *
 *   1. 4P Diagnostic Output (Classroom Profile)  — qualitative L1–L4 per
 *      dimension + radar polygon, no averaged score
 *   2. SAMR & TPACK Classroom Integration Framework (SAMR ladder)
 *   3. TPACK Classroom Integration Diagnostic
 *   4. In-Classroom Field Evidence & Artifact Record
 *   5. Classroom Digital Transformation Scaffolding Suggestions
 *   6. Critical Pedagogical Reflection Prompts
 *   7. Strategic eLearning Recommendations & Proposed Follow-Up
 *
 * plus the original's EN / AFR toggle and "copy for email" export.
 *
 * Usage:
 *   const view = mountClassroomReport(el, {
 *     classroom,          // one classroom_observations row
 *     header,             // { schoolName, district, visitDate, advisorName }
 *     walkthroughHref,    // optional — link back to the culture walkthrough report
 *   });
 *   view.destroy();
 */
import { buildClassroomAnalysis } from './classroom-report-engine.js';
import { reportIcon } from './report-icons.js';

// Afrikaans is switched off for now. All AFR strings and the toggle code are
// still here — set this to true to bring the EN / AFR switch back.
const ENABLE_AFRIKAANS = false;

function esc(str) {
  if (str === null || str === undefined || str === '') return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function levelToNumber(code) {
  switch (code) {
    case 'L4': return 4;
    case 'L3': return 3;
    case 'L2': return 2;
    case 'L1': return 1;
    default: return 1.5; // "Insufficient Evidence"
  }
}

// Same polar maths as the original: 70px max radius, score clamped 1–4.
function polarPoint(level, angleDeg) {
  const r = (Math.max(1, Math.min(4, level)) / 4) * 70;
  const a = (angleDeg * Math.PI) / 180;
  return `${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`;
}

function formatDate(value) {
  if (!value) return new Date().toISOString().substring(0, 10);
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.substring(0, 10) : new Date(s).toISOString().substring(0, 10);
}

// ---------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------
function bannerHtml({ color, icon, title, subtitle, rightHtml }) {
  return `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl border shadow-sm"
         style="background-color:${color}12; border-color:${color}45; border-left-width:6px; border-left-color:${color};">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm" style="background-color:${color};">
          ${reportIcon(icon)}
        </div>
        <div>
          <h2 class="text-[13px] sm:text-[15px] font-black uppercase tracking-wider text-[#001489]">${title}</h2>
          <span class="text-[11px] font-bold text-slate-600">${subtitle}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">${rightHtml}</div>
    </div>`;
}

const PILL = 'text-[10.5px] font-black uppercase px-2.5 py-1 rounded-md border bg-white text-[#001489] border-blue-200';

// ---------------------------------------------------------------------
// The report itself
// ---------------------------------------------------------------------
export function classroomReportHtml({ analysis, header, lang }) {
  const afr = lang === 'afr';
  const L = (en, af) => (afr ? af : en);
  const A = analysis.fourP;
  const G = analysis.samr;
  const H = analysis.tpack;
  const D = analysis.fieldEvidenceSummary;
  const B = analysis.scaffoldingPlan;
  const M = analysis.reflectionPrompts;
  const Q = analysis.followUpAgreement;
  const teacherName = analysis.classroom.teacherName || 'N/A';

  const pedagogyPt = polarPoint(levelToNumber(A.pedagogy.levelCode), 270);
  const peoplePt = polarPoint(levelToNumber(A.people.levelCode), 0);
  const platformsPt = polarPoint(levelToNumber(A.platforms.levelCode), 90);
  const practicePt = polarPoint(levelToNumber(A.practice.levelCode), 180);
  const polygon = `${pedagogyPt} ${peoplePt} ${platformsPt} ${practicePt}`;

  // ----- Title block -------------------------------------------------
  const titleBlock = `
    <div class="border-b-2 border-[#001489] pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[11px] font-black uppercase tracking-wider text-[#001489] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">${L('Western Cape Education Department', 'Wes-Kaap Onderwysdepartement')}</span>
          <span class="text-[11px] font-bold text-slate-400">|</span>
          <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">${L('Directorate: eLearning', 'Direktoraat: e-Leer')}</span>
        </div>
        <h1 class="text-[17px] sm:text-[19px] font-black uppercase tracking-tight text-[#001489]">${L('Classroom Observation &amp; Digital Transformation Report 2026', 'Klaskamerwaarneming &amp; Digitale Transformasieverslag 2026')}</h1>
        <p class="text-[11.5px] text-slate-600 font-medium">${L('Focused in-lesson observation, SAMR &amp; TPACK integration, learner agency, and classroom-level digital scaffolding', 'Gefokusde leswaarneming, SAMR- en TPACK-integrasie, leerder-agentskap en klaskamer-gebaseerde e-leer steierwerk')}</p>
      </div>
      <div class="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border shrink-0" style="background-color:${A.color}0c; border-color:${A.color}40;">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-[19px] shadow-sm shrink-0" style="background-color:${A.color};">4P</div>
        <div>
          <span class="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block">${L('Classroom Transformation Level', 'Klaskamer Transformasievlak')}</span>
          <span class="text-[13px] font-black tracking-tight" style="color:${A.color};">${esc(afr ? A.overallLevelAfr : A.overallLevel)}</span>
          <span class="text-[10px] font-bold text-slate-500 block mt-0.5">${L('Qualitative 4P Profile', 'Kwalitatiewe 4P Profiel')}</span>
        </div>
      </div>
    </div>`;

  // ----- Meta block --------------------------------------------------
  const metaCell = (label, value, extra = '') => `
    <div><span class="text-[9px] font-black text-slate-400 block uppercase">${label}</span>
    <span class="text-slate-800 font-semibold truncate block ${extra}">${esc(value)}</span></div>`;

  const metaBlock = `
    <div class="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 sm:p-4 text-[13px] space-y-3">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><span class="text-[9.5px] font-black text-slate-400 block uppercase">${L('SCHOOL NAME', 'SKOOLNAAM')}</span><span class="text-slate-900 font-bold">${esc(header.schoolName) || 'N/A'}</span></div>
        <div><span class="text-[9.5px] font-black text-slate-400 block uppercase">${L('DISTRICT', 'DISTRIK')}</span><span class="text-slate-900 font-bold">${esc(header.district) || 'N/A'}</span></div>
        <div><span class="text-[9.5px] font-black text-slate-400 block uppercase">${L('DATE OF VISIT', 'BESOEKDATUM')}</span><span class="text-slate-900 font-bold">${esc(formatDate(header.visitDate))}</span></div>
        <div><span class="text-[9.5px] font-black text-slate-400 block uppercase">${L('eLEARNING ADVISOR', 'e-LEER ADVISEUR')}</span><span class="text-slate-900 font-bold">${esc(header.advisorName) || 'N/A'}</span></div>
      </div>
      <div class="pt-2.5 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-5 gap-3">
        ${metaCell(L('TEACHER OBSERVED', 'ONDERWYSER'), teacherName)}
        ${metaCell(L('SUBJECT', 'VAK'), D.subject)}
        ${metaCell(L('GRADE', 'GRAAD'), D.grade)}
        ${metaCell(L('LESSON FOCUS TOPIC', 'LESFOKUS / TEMA'), D.lessonTopic)}
        ${metaCell(L('LEARNER COUNT', 'LEERDERS'), D.learnersCount)}
      </div>
    </div>`;

  // ----- 1. 4P output -----------------------------------------------
  const dimCard = (label, code, badgeClasses, narrative) => `
    <div class="p-3 rounded-xl border bg-slate-50/80 border-slate-200 space-y-1">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">${label}</span>
        <span class="text-[13px] font-black px-2 py-0.5 rounded ${badgeClasses}">${esc(code)}</span>
      </div>
      <p class="text-[11.5px] text-slate-700 font-medium leading-tight pt-1">${esc(narrative)}</p>
    </div>`;

  const section1 = `
    <div class="py-4 border-b border-slate-200 space-y-4" data-report-section id="cls-section-1" data-nav-label="1. 4P Diagnostic Output">
      ${bannerHtml({
        color: A.color,
        icon: 'fourP',
        title: L('1. 4P Diagnostic Output (Classroom Profile)', '1. 4P Diagnostiese Uitset (Klaskamerprofiel)'),
        subtitle: L('Independent dimensional profile without artificial score averaging', 'Onafhanklike dimensionele analise sonder misleidende punte-gemiddeldes'),
        rightHtml: `<span class="text-[11px] font-black uppercase px-2.5 py-1 rounded-md border bg-white text-[#001489] border-blue-200">${L('Level:', 'Klaskamervlak:')} <strong>${esc(afr ? A.overallLevelAfr : A.overallLevel)}</strong></span>`,
      })}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        ${dimCard(L('PEOPLE', 'MENSE (PEOPLE)'), A.people.levelCode, 'bg-blue-100 text-[#001489]', afr ? A.people.narrativeAfr : A.people.narrative)}
        ${dimCard(L('PRACTICE', 'PRAKTYK (PRACTICE)'), A.practice.levelCode, 'bg-teal-100 text-[#00A1A3]', afr ? A.practice.narrativeAfr : A.practice.narrative)}
        ${dimCard(L('PEDAGOGY', 'PEDAGOGIE (PEDAGOGY)'), A.pedagogy.levelCode, 'bg-pink-100 text-[#C8126E]', afr ? A.pedagogy.narrativeAfr : A.pedagogy.narrative)}
        ${dimCard('PLATFORMS', A.platforms.levelCode, 'bg-amber-100 text-[#D73828]', afr ? A.platforms.narrativeAfr : A.platforms.narrative)}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div class="lg:col-span-7 rounded-xl p-4 border bg-blue-50/40 border-blue-200 space-y-2">
          <h4 class="text-[12px] font-black uppercase tracking-wider text-[#001489]">${L('Dynamic Relationship &amp; Synthesis Across the 4Ps', 'Dinamiese Verhouding tussen die 4P Dimensies')}</h4>
          <p class="text-[12px] text-slate-800 font-medium leading-relaxed">${esc(afr ? A.relationshipNarrativeAfr : A.relationshipNarrative)}</p>
        </div>
        <div class="lg:col-span-5 flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl bg-slate-50/80 shadow-sm">
          <span class="text-[9.5px] font-black uppercase text-slate-500 tracking-wider mb-1">${L('4P Dimensional Polygon', '4P Klaskamer Vektordiagram')}</span>
          <svg viewBox="-60 0 320 205" class="w-full max-w-[340px] h-auto">
            <circle cx="100" cy="100" r="18" fill="none" stroke="#cbd5e1" stroke-width="0.5" stroke-dasharray="2,2" />
            <circle cx="100" cy="100" r="36" fill="none" stroke="#cbd5e1" stroke-width="0.5" stroke-dasharray="2,2" />
            <circle cx="100" cy="100" r="54" fill="none" stroke="#cbd5e1" stroke-width="0.5" stroke-dasharray="2,2" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="#94a3b8" stroke-width="0.75" />
            <line x1="100" y1="30" x2="100" y2="170" stroke="#94a3b8" stroke-width="0.5" />
            <line x1="30" y1="100" x2="170" y2="100" stroke="#94a3b8" stroke-width="0.5" />
            <text x="100" y="18" font-size="7.5" font-weight="900" text-anchor="middle" fill="#C8126E">PEDAGOGY (${esc(A.pedagogy.levelCode)})</text>
            <text x="175" y="103" font-size="7.5" font-weight="900" text-anchor="start" fill="#001489">PEOPLE (${esc(A.people.levelCode)})</text>
            <text x="100" y="190" font-size="7.5" font-weight="900" text-anchor="middle" fill="#D73828">PLATFORMS (${esc(A.platforms.levelCode)})</text>
            <text x="25" y="103" font-size="7.5" font-weight="900" text-anchor="end" fill="#00A1A3">PRACTICE (${esc(A.practice.levelCode)})</text>
            <polygon points="${polygon}" fill="${A.color}25" stroke="${A.color}" stroke-width="2" />
          </svg>
        </div>
      </div>
    </div>`;

  // ----- 2. SAMR ----------------------------------------------------
  const samrStages = G.stages
    .map((st) => {
      const on = G.stageCode === st.code;
      return `
        <div class="p-3 rounded-xl border relative ${on ? 'shadow-sm' : 'bg-white/90 border-slate-200'}"
             style="${on ? `background-color:${st.color}12; border-color:${st.color}; box-shadow:0 0 0 1px ${st.color}40;` : ''}">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[12px] font-black tracking-tight" style="color:${st.color};">${st.code}: ${esc(afr ? st.nameAfr : st.name)}</span>
            ${on ? `<span class="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-black" style="background-color:${st.color};">✓</span>` : ''}
          </div>
          <p class="text-[11px] text-slate-600 font-medium leading-tight">${esc(afr ? st.subtitleAfr : st.subtitle)}</p>
          ${on ? `<span class="inline-block mt-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded" style="background-color:${st.color}25; color:${st.color};">${L('Observed In Lesson', 'Waargeneem')}</span>` : ''}
        </div>`;
    })
    .join('');

  const section2 = `
    <div class="py-4 border-b border-slate-200 space-y-4" data-report-section id="cls-section-2" data-nav-label="2. SAMR &amp; TPACK Framework">
      ${bannerHtml({
        color: G.color,
        icon: 'frameworks',
        title: L('2. SAMR &amp; TPACK Classroom Integration Framework', '2. SAMR &amp; TPACK Klaskamer Integrasieraamwerk'),
        subtitle: L('Pedagogical models for curriculum-aligned digital transformation', 'Pedagogiese modelle vir kurrikulum-belynde digitale transformasie'),
        rightHtml: `<span class="text-[11px] font-black uppercase px-3 py-1 rounded-md border shadow-sm" style="background-color:${G.color}18; border-color:${G.color}60; color:${G.color};">SAMR: ${esc(afr ? G.levelAfr : G.level)} (${esc(G.stageCode)})</span>`,
      })}
      <div class="flex items-start sm:items-center gap-2.5 p-3 rounded-xl border text-[13px] bg-slate-50 border-slate-200">
        <div class="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 sm:mt-0" style="background-color:${G.color};"><i class="fa-solid fa-arrow-right text-[11px]"></i></div>
        <div class="flex-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-slate-500 block">${L('OBSERVED SAMR STAGE IN THIS LESSON:', 'WAARGENOME SAMR-FASE IN HIERDIE LES:')}</span>
          <p class="text-[12.5px] font-medium text-slate-900 leading-snug">${esc(afr ? G.ladderStepSummaryAfr : G.ladderStepSummary)}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">${samrStages}</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[13px]">
        <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
          <div class="border-b border-slate-100 pb-1.5"><span class="text-[10px] font-black uppercase text-[#001489] tracking-wider block">${L('Observed In-Lesson Reality (SAMR Evidence)', 'Waargenome Klaskamerwerklikheid (SAMR Bewys)')}</span></div>
          <p class="text-[12px] text-slate-800 font-medium leading-relaxed">${esc(afr ? G.observedRealityAfr : G.observedReality)}</p>
          <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11.5px] text-slate-600 leading-relaxed">
            <span class="font-bold text-slate-700 block mb-0.5">${L('Diagnostic Rationale:', 'Kaderanalise:')}</span>${esc(afr ? G.explanationAfr : G.explanation)}
          </div>
        </div>
        <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
          <div class="border-b border-slate-100 pb-1.5"><span class="text-[10px] font-black uppercase text-[#00A1A3] tracking-wider block">${L('Actionable Step to Advance Up SAMR Ladder', 'Praktiese Stap om op SAMR-leer te Vorder')}</span></div>
          <p class="text-[12px] text-slate-800 font-medium leading-relaxed">${esc(afr ? G.actionableNextTierStepAfr : G.actionableNextTierStep)}</p>
          <div class="bg-teal-50/50 p-2.5 rounded-lg border border-teal-100/70 text-[11.5px] text-teal-900 leading-relaxed">
            <span class="font-bold text-teal-950 block mb-0.5">${L('Topic-Specific Learning Task Example:', 'Onderwerpspesifieke Leertaak-voorbeeld:')}</span>${esc(afr ? G.developmentalOpportunityAfr : G.developmentalOpportunity)}
          </div>
        </div>
      </div>
    </div>`;

  // ----- 3. TPACK ---------------------------------------------------
  const tpackCard = (labelColor, label, text) => `
    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
      <span class="text-[9.5px] font-black uppercase block" style="color:${labelColor};">${label}</span>
      <p class="text-[11.5px] text-slate-700 font-medium leading-relaxed">${esc(text)}</p>
    </div>`;

  const section3 = `
    <div class="py-4 border-b border-slate-200 space-y-4" data-report-section id="cls-section-3" data-nav-label="3. TPACK Diagnostic">
      ${bannerHtml({
        color: H.color,
        icon: 'tpack',
        title: L('3. TPACK Classroom Integration Diagnostic', '3. TPACK Klaskamer Integrasiediagnose'),
        subtitle: L('Observation-based integration lens for technology, pedagogy, and curriculum content', 'Waarnemingsgebaseerde integrasielens vir tegnologie, pedagogie en inhoud'),
        rightHtml: `<span class="text-[11px] font-black uppercase px-3 py-1 rounded-md border text-white shadow-sm" style="background-color:${H.color}; border-color:${H.color};">TPACK: ${esc(afr ? H.levelAfr : H.level)}</span>`,
      })}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
        ${tpackCard('#8D6E97', L('Technological Fit / TK Evidence', 'Tegnologiese Passing (TK Bewys)'), afr ? H.technologicalFitAfr : H.technologicalFit)}
        ${tpackCard('#007DBA', L('Pedagogical Fit / PK Evidence', 'Pedagogiese Passing (PK Bewys)'), afr ? H.pedagogicalFitAfr : H.pedagogicalFit)}
        ${tpackCard('#8FAD15', L('Content Fit / CK Evidence', 'Inhoudspassing (CK Bewys)'), afr ? H.contentFitAfr : H.contentFit)}
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 text-[13px]">
        <div>
          <span class="text-[9.5px] font-black uppercase tracking-wider text-[#001489] block">${L('TPACK Synthesis:', 'TPACK Sintese:')}</span>
          <p class="text-[12px] text-slate-800 font-medium leading-relaxed mt-0.5">${esc(afr ? H.tpackSynthesisAfr : H.tpackSynthesis)}</p>
        </div>
        <div class="pt-2 border-t border-slate-100">
          <span class="text-[9.5px] font-black uppercase tracking-wider text-[#007DBA] block">${L('Core Developmental Focus for Next Lesson:', 'Kernontwikkelingsfokus vir Volgende Les:')}</span>
          <p class="text-[11.5px] text-slate-700 font-medium leading-relaxed mt-0.5">${esc(afr ? H.coreDevelopmentalFocusAfr : H.coreDevelopmentalFocus)}</p>
        </div>
      </div>
    </div>`;

  // ----- 4. Field evidence -----------------------------------------
  const evCell = (label, value, cls = '') => `
    <div class="bg-white p-2.5 rounded-lg border border-slate-200 ${cls}">
      <span class="text-[9px] font-black uppercase text-slate-400 block">${label}</span>
      <span class="text-slate-800 font-semibold">${esc(value)}</span>
    </div>`;
  const evBlock = (labelHtml, labelClass, value, boxClass = 'bg-white border-slate-200', pClass = 'text-slate-700') => `
    <div class="${boxClass} p-3 rounded-lg border space-y-1">
      <span class="text-[9px] font-black uppercase block ${labelClass}">${labelHtml}</span>
      <p class="${pClass} font-medium whitespace-pre-line">${esc(value)}</p>
    </div>`;

  const section4 = `
    <div class="py-4 border-b border-slate-200 space-y-4" data-report-section id="cls-section-4" data-nav-label="4. Field Evidence">
      ${bannerHtml({
        color: A.color,
        icon: 'evidence',
        title: L('4. In-Classroom Field Evidence &amp; Artifact Record', '4. Klaskamer Veldwaarnemings &amp; Bewyse'),
        subtitle: L('Summarises captured observation evidence only', 'Uitsluitlik vasgelegde waarnemingsbewyse (onbevestigde velde word nie vervaardig nie)'),
        rightHtml: `<span class="text-[10.5px] font-black uppercase px-2.5 py-1 rounded-md border bg-white text-slate-700 border-slate-200">${L('Verified Records', 'Gedokumenteerde Bewyse')}</span>`,
      })}
      <div class="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3 text-[13px]">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${evCell(L('SUBJECT &amp; GRADE', 'VAK &amp; GRAAD'), `${D.subject} (${D.grade})`)}
          ${evCell(L('LESSON TOPIC &amp; INTENTION', 'LESFOKUS / LEERBEDOELING'), D.lessonTopic)}
          ${evCell(L('LEARNER COUNT', 'LEERDERGETAL'), D.learnersCount)}
          ${evCell(L('TECHNOLOGY / HARDWARE USED', 'TEGNOLOGIE / HARDEWARE GEBRUIK'), D.technologyUsed, 'sm:col-span-2')}
          ${evCell(L('DIGITAL PLATFORMS / RESOURCES', 'DIGITALE PLATFORMS / HULPBRONNE'), D.platformsUsed)}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          ${evBlock(L('TEACHER DIGITAL ACTIVITY', 'ONDERWYSER DIGITALE AKTIWITEIT'), 'text-[#001489]', D.teacherDigitalActivity)}
          ${evBlock(L('LEARNER DIGITAL ACTIVITY &amp; CREATION', 'LEERDER DIGITALE AKTIWITEIT &amp; SKEPPING'), 'text-[#001489]', D.learnerDigitalActivity)}
          ${evBlock(L('COLLABORATION &amp; FEEDBACK', 'SAMEWERKING &amp; ASSESSERINGSTERUGVOER'), 'text-slate-500', D.collaboration)}
          ${evBlock(L('CYBER WELLNESS INTEGRATION', 'KUBERWELSTAND INTEGRASIE'), 'text-slate-500', D.cyberWellness)}
          ${evBlock(L('eADVISOR SUGGESTIONS &amp; INTERVENTIONS', 'e-ADVISEUR VOORSTELLE &amp; INTERVENSIES'), 'text-[#001489]', D.advisorNotes, 'bg-blue-50/50 border-blue-200', 'text-slate-800')}
          ${evBlock(L('eADVISOR GENERAL CLASSROOM COMMENTS', 'e-ADVISEUR ALGEMENE KLASKAMER-KOMMENTAAR'), 'text-indigo-900', D.advisorGeneralComments, 'bg-indigo-50/50 border-indigo-200', 'text-slate-800')}
        </div>
      </div>
    </div>`;

  // ----- 5. Scaffolding plan ---------------------------------------
  const scaffoldCards = B.map(
    (o, i) => `
      <div class="bg-white border rounded-xl p-3.5 shadow-sm flex flex-col justify-between" style="border-color:${A.color}35;">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[9.5px] font-black uppercase px-2 py-0.5 rounded border" style="background-color:${A.color}15; color:#001489; border-color:${A.color}40;">${L(`Focus Area ${i + 1}`, `Fokusarea ${i + 1}`)}</span>
            <span class="text-[9px] font-bold text-slate-400 uppercase">${L('Development Area', 'Ontwikkelingsarea')}</span>
          </div>
          <h3 class="text-[13px] font-black text-slate-800">${esc(afr ? o.developmentAreaAfr : o.developmentArea)}</h3>
          <div class="space-y-1.5 text-[11.5px]">
            <div>
              <span class="text-[9px] font-black uppercase text-slate-400 block">${L('WHY THIS MATTERS:', 'WAAROM DIT SAAK MAAK:')}</span>
              <p class="text-slate-600 font-medium leading-relaxed">${esc(afr ? o.whyThisMattersAfr : o.whyThisMatters)}</p>
            </div>
            <div class="pt-1">
              <span class="text-[9px] font-black uppercase text-[#001489] block">${L('SUGGESTED NEXT STEP:', 'VOORGESTELDE VOLGENDE STAP:')}</span>
              <p class="text-slate-800 font-medium leading-relaxed">${esc(afr ? o.practicalNextStepAfr : o.practicalNextStep)}</p>
            </div>
          </div>
        </div>
        <div class="mt-3 pt-2.5 border-t border-slate-100">
          <span class="text-[9px] font-black text-slate-400 block uppercase mb-1">${L('Suggested Resource / Tool:', 'Aanbevole Hulpbron of Gereedskap:')}</span>
          <span class="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 block">${esc(afr ? o.suggestedResourceOrToolAfr : o.suggestedResourceOrTool)}</span>
        </div>
      </div>`
  ).join('');

  const section5 = `
    <div class="py-4 border-b border-slate-200 space-y-4" data-report-section id="cls-section-5" data-nav-label="5. Scaffolding Suggestions">
      ${bannerHtml({
        color: A.color,
        icon: 'scaffold',
        title: L('5. Classroom Digital Transformation Scaffolding Suggestions', '5. Klaskamer Digitale Transformasie-steierwerkvoorstelle'),
        subtitle: L('Suggested developmental focus areas based directly on observed 4P, SAMR, and TPACK evidence', 'Geteikende ontwikkelingsfokusareas gebaseer op waargenome 4P, SAMR en TPACK bewyse'),
        rightHtml: `<span class="${PILL}">${B.length} ${L('Developmental Focus Areas', 'Ontwikkelingsareas')}</span>`,
      })}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${scaffoldCards}</div>
    </div>`;

  // ----- 6. Reflection prompts -------------------------------------
  const promptCards = M.map(
    (o, i) => `
      <div class="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="w-5 h-5 rounded-full bg-[#001489] text-white text-[11px] font-bold flex items-center justify-center">${i + 1}</span>
          <span class="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">${esc(afr ? o.lensAfr : o.lens)}</span>
        </div>
        <p class="text-[12px] font-medium text-slate-800 leading-relaxed">"${esc(afr ? o.promptAfr : o.prompt)}"</p>
      </div>`
  ).join('');

  const section6 = `
    <div class="py-4 border-b border-slate-200 space-y-4" data-report-section id="cls-section-6" data-nav-label="6. Reflection Prompts">
      ${bannerHtml({
        color: A.color,
        icon: 'reflection',
        title: L('6. Critical Pedagogical Reflection Prompts', '6. Kritiese Pedagogiese Refleksievrae'),
        subtitle: L('Invites reflective dialogue and growth rather than testing or judging', 'Gespreksvrae vir die professionele dialoog tussen Adviseur en Onderwyser'),
        rightHtml: `<span class="${PILL}">${L('Coaching Dialogue', 'Afrigtingsdialoog')}</span>`,
      })}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${promptCards}</div>
    </div>`;

  // ----- 7. Recommendations & follow-up ----------------------------
  const section7 = `
    <div class="py-4 border-b border-slate-200 space-y-4" data-report-section id="cls-section-7" data-nav-label="7. Recommendations &amp; Follow-Up">
      ${bannerHtml({
        color: A.color,
        icon: 'followUp',
        title: L('7. Strategic eLearning Recommendations &amp; Proposed Follow-Up', '7. Strategiese e-Leer Aanbevelings &amp; Voorgestelde Opvolg'),
        subtitle: L('Suggested developmental focus areas for post-observation dialogue &amp; collaboration', 'Voorgestelde ontwikkelingsfokusareas vir nabetragtingsgesprek en samewerking'),
        rightHtml: `<span class="${PILL}">${L('Advisor Recommendations', 'Adviesaanbevelings')}</span>`,
      })}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-[13px]">
        <div class="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
          <span class="text-[9.5px] font-black uppercase text-[#001489] tracking-wider block">${L('Suggested Instructional Focus Area', 'Voorgestelde Onderrigfokusarea')}</span>
          <p class="text-[12px] text-slate-800 font-medium leading-relaxed">${esc(afr ? Q.immediatePriorityAfr : Q.immediatePriority)}</p>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
          <span class="text-[9.5px] font-black uppercase text-[#007DBA] tracking-wider block">${L('Suggested Resource or Support', 'Aanbevole Hulpbron of Ondersteuning')}</span>
          <p class="text-[12px] text-slate-800 font-medium leading-relaxed">${esc(afr ? Q.suggestedResourceOrSupportAfr : Q.suggestedResourceOrSupport)}</p>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="text-[9.5px] font-black uppercase text-[#8D6E97] tracking-wider block">${L('Teacher Professional Development &amp; Capacity Building Suggestions', 'Onderwyser Professionele Ontwikkeling &amp; Kapasiteitsbou-voorstelle')}</span>
              <a href="https://wcedtpd.pages.dev/sessions" target="_blank" rel="noreferrer" class="no-print inline-flex items-center gap-1 text-[9.5px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">eTPD Sessions ↗</a>
            </div>
            <p class="text-[12px] text-slate-800 font-medium leading-relaxed">${esc(afr ? Q.teacherDevelopmentFocusAfr : Q.teacherDevelopmentFocus)}</p>
          </div>
          <div class="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[9.5px] text-slate-500">
            <span class="font-semibold">Guidance: WCED eTPD Microlearning</span>
            <a href="https://wcedtpd.pages.dev/sessions" target="_blank" rel="noreferrer" class="text-blue-700 hover:underline font-bold">wcedtpd.pages.dev/sessions ↗</a>
          </div>
        </div>
        <div class="bg-blue-50/60 border border-blue-200 p-3.5 rounded-xl md:col-span-3 space-y-1.5">
          <span class="text-[9.5px] font-black uppercase text-[#001489] tracking-wider block">${L('Suggested Focus &amp; Evidence for Next Visit', 'Voorgestelde Waarneembare Fokus vir Volgende Besoek')}</span>
          <p class="text-[12px] text-slate-800 font-medium leading-relaxed">${esc(afr ? Q.followUpEvidenceAfr : Q.followUpEvidence)}</p>
        </div>
      </div>
    </div>`;

  const signatures = `
    <div class="pt-8 grid grid-cols-2 gap-8">
      <div class="text-center space-y-8">
        <div class="h-px bg-slate-300 w-full"></div>
        <div class="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
          ${L('eLearning Advisor Signature', 'e-Leer Adviseur Handtekening')}
          <span class="block font-semibold lowercase text-slate-500 mt-1">${esc(header.advisorName) || L('Full name', 'Volle naam')}</span>
        </div>
      </div>
      <div class="text-center space-y-8">
        <div class="h-px bg-slate-300 w-full"></div>
        <div class="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
          ${L('Observed Teacher / Subject HOD Signature', 'Waargenome Onderwyser / Vakhoof Handtekening')}
          <span class="block font-semibold lowercase text-slate-500 mt-1">${esc(teacherName !== 'N/A' ? teacherName : '') || L('Full name', 'Volle naam')}</span>
        </div>
      </div>
    </div>`;

  return `
    <div id="printable-report" class="bg-white border border-slate-300 rounded-xl p-5 sm:p-7 shadow-sm text-slate-800 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 report-print-root">
      ${titleBlock}
      ${metaBlock}
      ${section1}
      ${section2}
      ${section3}
      ${section4}
      ${section5}
      ${section6}
      ${section7}
      ${signatures}
    </div>`;
}

// ---------------------------------------------------------------------
// Plain-text export, identical structure to the original's
// "copy for Outlook" output.
// ---------------------------------------------------------------------
export function classroomReportPlainText({ analysis, header }) {
  const A = analysis.fourP;
  const G = analysis.samr;
  const H = analysis.tpack;
  const D = analysis.fieldEvidenceSummary;
  const B = analysis.scaffoldingPlan;
  const M = analysis.reflectionPrompts;
  const Q = analysis.followUpAgreement;
  const teacher = analysis.classroom.teacherName || header.schoolName || 'Teacher';
  const rule = '-----------------------------------------------------------------------------------------';

  return `
WCED DIRECTORATE: e-LEARNING — CLASSROOM OBSERVATION & DIGITAL TRANSFORMATION REPORT 2026
=========================================================================================
School: ${header.schoolName || 'N/A'}
District: ${header.district || 'N/A'}
Visit Date: ${formatDate(header.visitDate)}
eLearning Advisor: ${header.advisorName || 'N/A'}
Observed Teacher: ${teacher}
Subject & Grade: ${D.subject} (${D.grade})
Lesson Topic: ${D.lessonTopic}

${rule}
SECTION 1: 4P DIAGNOSTIC OUTPUT
${rule}
Classroom Digital Transformation Level: ${A.overallLevel}
- People: ${A.people.levelCode}
- Practice: ${A.practice.levelCode}
- Pedagogy: ${A.pedagogy.levelCode}
- Platforms: ${A.platforms.levelCode}

Relationship Diagnosis:
${A.relationshipNarrative}

${rule}
SECTION 2: SAMR CLASSROOM INTEGRATION FRAMEWORK
${rule}
SAMR Observed Stage: ${G.level} (${G.stageCode})
Ladder Progression: ${G.ladderStepSummary}

Observed In-Lesson Reality (SAMR Evidence):
${G.observedReality}

Actionable Step to Advance Up SAMR Ladder:
${G.actionableNextTierStep}

Pedagogical Task Impact:
${G.explanation}

${rule}
SECTION 3: TPACK CLASSROOM INTEGRATION DIAGNOSTIC
${rule}
TPACK Integration: ${H.level}

- Technological Fit: ${H.technologicalFit}
- Pedagogical Fit: ${H.pedagogicalFit}
- Content Fit: ${H.contentFit}

TPACK Synthesis:
${H.tpackSynthesis}

Core Developmental Focus:
${H.coreDevelopmentalFocus}

${rule}
SECTION 4: IN-CLASSROOM FIELD EVIDENCE & ARTIFACT RECORD
${rule}
- Subject: ${D.subject}
- Grade: ${D.grade}
- Lesson Topic: ${D.lessonTopic}
- Learning Intention: ${D.learningIntention}
- Learner Count: ${D.learnersCount}
- Technology or Hardware Used: ${D.technologyUsed}
- Digital Platforms or Resources: ${D.platformsUsed}
- Teacher Digital Activity: ${D.teacherDigitalActivity}
- Learner Digital Activity: ${D.learnerDigitalActivity}
- Learner Creation: ${D.learnerCreation}
- Collaboration: ${D.collaboration}
- Assessment and Feedback: ${D.assessmentFeedback}
- Cyber Wellness Integration: ${D.cyberWellness}
- Observed Digital Artefacts: ${D.observedArtefacts}
- eAdvisor Notes / Intervention: ${D.advisorNotes}
- eAdvisor General Comments: ${D.advisorGeneralComments}

${rule}
SECTION 5: CLASSROOM DIGITAL TRANSFORMATION SCAFFOLDING PLAN
${rule}
${B.map(
  (z, i) => `
PRIORITY ACTION ${i + 1}: ${z.developmentArea}
- Why this matters: ${z.whyThisMatters}
- Practical Next Step: ${z.practicalNextStep}
- Suggested Resource or Tool: ${z.suggestedResourceOrTool}
`
).join('')}

${rule}
SECTION 6: CRITICAL PEDAGOGICAL REFLECTION PROMPTS
${rule}
${M.map((z, i) => `${i + 1}. [${z.lens}] "${z.prompt}"`).join('\n')}

${rule}
SECTION 7: STRATEGIC ELEARNING RECOMMENDATIONS & PROPOSED FOLLOW-UP
${rule}
- Suggested Instructional Focus Area: ${Q.immediatePriority}
- Suggested Resource or Support: ${Q.suggestedResourceOrSupport}
- Teacher Professional Development & Capacity Building Suggestions (WCED eTPD): ${Q.teacherDevelopmentFocus}
- Suggested Focus & Evidence for Next Visit: ${Q.followUpEvidence}

eLearning Advisor Signature: _______________________ Date: _________
Observed Teacher / HOD Signature: __________________ Date: _________
`.trim();
}

// ---------------------------------------------------------------------
// Mounting: toolbar (EN/AFR, copy, link back) + report body
// ---------------------------------------------------------------------
export function mountClassroomReport(rootEl, { classroom, header, walkthroughHref = null }) {
  const analysis = buildClassroomAnalysis(header, classroom);
  let lang = 'en';
  let toastTimer = null;

  function render() {
    const afr = lang === 'afr';
    const langBtn = (code, label) => `
      <button type="button" data-lang="${code}"
        class="px-2.5 py-1 rounded text-[13px] font-extrabold transition ${lang === code ? 'bg-[#001489] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">${label}</button>`;

    rootEl.innerHTML = `
      <div class="space-y-4">
        <div class="no-print bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-200">${afr ? 'Gefokusde Klaskamerwaarneming' : 'Focused Classroom Observation'}</span>
              <span class="text-[13px] font-black text-slate-800 tracking-tight">${afr ? 'SAMR / TPACK &amp; 4P Klaskamertransformasie' : 'SAMR / TPACK &amp; 4P Classroom Transformation'}</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">${afr ? 'Bewysgebaseerde pedagogiese analise sonder arbitrêre gemiddelde tellings' : 'Evidence-based pedagogical diagnosis without misleading statistical averaging'}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 justify-end">
            ${walkthroughHref ? `<a href="${esc(walkthroughHref)}" class="text-[13px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition">${afr ? 'Wys Heel-Skool 4P Verslag' : 'View Whole-School 4P Report'}</a>` : ''}
            <button type="button" data-action="copy" class="text-[13px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition">${afr ? 'Kopieer vir E-pos' : 'Copy for Email / SMT'}</button>
            ${ENABLE_AFRIKAANS ? `<div class="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">${langBtn('en', 'EN')}${langBtn('afr', 'AFR')}</div>` : ''}
          </div>
        </div>
        <p data-role="toast" class="no-print text-[13px] font-semibold text-emerald-700 hidden"></p>
        ${classroomReportHtml({ analysis, header, lang })}
      </div>`;
  }

  function showToast(message) {
    const el = rootEl.querySelector('[data-role="toast"]');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
  }

  async function onClick(e) {
    const langBtn = e.target.closest('[data-lang]');
    if (langBtn && ENABLE_AFRIKAANS) {
      lang = langBtn.getAttribute('data-lang');
      render();
      return;
    }
    if (e.target.closest('[data-action="copy"]')) {
      try {
        await navigator.clipboard.writeText(classroomReportPlainText({ analysis, header }));
        showToast(lang === 'afr' ? 'Klaskamerverslag gekopieer na knipbord!' : 'Classroom Observation Report copied to clipboard for Outlook!');
      } catch (err) {
        showToast('Could not copy automatically — your browser blocked clipboard access.');
      }
    }
  }

  rootEl.addEventListener('click', onClick);
  render();

  return {
    analysis,
    destroy() {
      clearTimeout(toastTimer);
      rootEl.removeEventListener('click', onClick);
      rootEl.innerHTML = '';
    },
  };
}
