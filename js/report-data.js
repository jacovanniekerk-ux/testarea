// ============================================================
// report-data.js
// ------------------------------------------------------------
// Gathers everything report.html needs into one call: the
// walkthrough (if applicable) and its classroom observation(s),
// plus the school and advisor details needed for the report header.
// ============================================================

import { supabaseClient } from './supabase-client.js';
import { fetchCultureWalkthroughById, fetchClassroomObservationsForWalkthrough } from './culture-walkthroughs.js';
import { fetchClassroomObservationById } from './classroom-observations.js';
import { fetchSchoolByCemis } from './schools.js';

/**
 * Fetch an advisor's public display info only (id, full_name,
 * district) — never password_hash. Requires the corresponding
 * column-level GRANT + RLS policy from grant_advisor_read.sql;
 * without it this will error since the advisors table is locked
 * down by default (see login_setup.sql).
 * @param {string|null} advisorId
 */
export async function fetchAdvisorPublicInfo(advisorId) {
  if (!advisorId) return { data: null, error: null };
  const { data, error } = await supabaseClient
    .from('advisors')
    .select('id, full_name, district')
    .eq('id', advisorId)
    .single();
  if (error) {
    // Surfaced deliberately: a null advisor with no error usually means
    // RLS/grants on the advisors table are blocking the read, not a bug
    // in this query. Check policies on the `advisors` table if this fires.
    console.warn('fetchAdvisorPublicInfo failed for advisorId', advisorId, error);
  }
  return { data, error };
}

/**
 * @param {'walkthrough'|'classroom'} type
 * @param {string} id
 * @returns {Promise<{walkthrough: object|null, classrooms: object[], school: object|null, advisor: object|null, error: object|null}>}
 */
export async function fetchReportData(type, id) {
  if (type === 'walkthrough') {
    const { data: walkthrough, error: wErr } = await fetchCultureWalkthroughById(id);
    if (wErr || !walkthrough) {
      return { walkthrough: null, classrooms: [], school: null, advisor: null, error: wErr || { message: 'Walkthrough not found.' } };
    }

    const { data: classrooms, error: cErr } = await fetchClassroomObservationsForWalkthrough(id);
    if (cErr) {
      return { walkthrough, classrooms: [], school: null, advisor: null, error: cErr };
    }

    const { data: school } = await fetchSchoolByCemis(walkthrough.school_cemis);
    const { data: advisor } = await fetchAdvisorPublicInfo(walkthrough.advisor_id);

    return { walkthrough, classrooms: classrooms || [], school, advisor, error: null };
  }

  if (type === 'classroom') {
    const { data: classroom, error: cErr } = await fetchClassroomObservationById(id);
    if (cErr || !classroom) {
      return { walkthrough: null, classrooms: [], school: null, advisor: null, error: cErr || { message: 'Classroom report not found.' } };
    }

    const { data: school } = await fetchSchoolByCemis(classroom.school_cemis);
    const { data: advisor } = await fetchAdvisorPublicInfo(classroom.advisor_id);

    return { walkthrough: null, classrooms: [classroom], school, advisor, error: null };
  }

  return { walkthrough: null, classrooms: [], school: null, advisor: null, error: { message: `Unknown report type: ${type}` } };
}
