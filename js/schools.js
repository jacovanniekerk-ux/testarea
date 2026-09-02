// ============================================================
// schools.js
// ------------------------------------------------------------
// Fetches school records from Supabase. Centralized here so
// Culture Walkthrough, the standalone Classroom/School Report,
// and Past Reports all read schools the same way.
//
// IMPORTANT — read before wiring this into a page:
// Since login is now a custom RPC (login_advisor), NOT Supabase
// Auth, every request from the browser — even after "login" —
// uses the anon API role, never the `authenticated` role. If your
// `schools` table's RLS policy only grants SELECT to the
// `authenticated` role (as originally spec'd), these calls will
// silently return an EMPTY array, not an error — RLS just filters
// every row out. If that happens, you'll need a policy like:
//
//   create policy "anon can read schools"
//   on schools for select
//   to anon
//   using (true);
//
// (Schools data has no personal/sensitive info per your spec, so
// opening SELECT to anon is low-risk — same as a public read-only
// reference table.)
//
// HEAD OFFICE ACCESS MODEL:
// An advisor whose district is exactly 'HEAD OFFICE' is treated as
// having access to every school/report across every district, not
// just their own. isHeadOffice() is the one place that check lives;
// fetchSchoolsForAdvisor() is the one place that branches on it for
// school lists. Other files (culture-walkthroughs.js,
// classroom-observations.js) import isHeadOffice() from here rather
// than re-implementing the district === 'HEAD OFFICE' check.
// ============================================================

import { supabaseClient } from './supabase-client.js';

const SCHOOL_COLUMNS = 'cemis_number, school_name, district, circuit, computer_labs, smart_classrooms, learner_devices, connectivity';

/**
 * @param {{district: string}|null} advisor
 * @returns {boolean}
 */
export function isHeadOffice(advisor) {
  return Boolean(advisor && advisor.district === 'HEAD OFFICE');
}

/**
 * Fetch all schools in a given district, sorted by name.
 * @param {string} district
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchSchoolsForDistrict(district) {
  if (!district) {
    return { data: null, error: { message: 'fetchSchoolsForDistrict: district is required' } };
  }

  const { data, error } = await supabaseClient
    .from('schools')
    .select(SCHOOL_COLUMNS)
    .eq('district', district)
    .order('school_name', { ascending: true });

  return { data, error };
}

/**
 * Fetch a single school by its CEMIS number, including infrastructure
 * baseline fields used to pre-fill a walkthrough/report form.
 * @param {string} cemisNumber
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchSchoolByCemis(cemisNumber) {
  if (!cemisNumber) {
    return { data: null, error: { message: 'fetchSchoolByCemis: cemisNumber is required' } };
  }

  const { data, error } = await supabaseClient
    .from('schools')
    .select(SCHOOL_COLUMNS)
    .eq('cemis_number', cemisNumber)
    .single();

  return { data, error };
}

/**
 * Fetch every school (all districts), sorted by district then name.
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchAllSchools() {
  const { data, error } = await supabaseClient
    .from('schools')
    .select(SCHOOL_COLUMNS)
    .order('district', { ascending: true })
    .order('school_name', { ascending: true });

  return { data, error };
}

/**
 * The school-list call every advisor-facing page should use instead
 * of fetchSchoolsForDistrict() directly: HEAD OFFICE advisors get
 * every school across every district; everyone else gets just their
 * own district, same as before.
 * @param {{district: string}} advisor
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchSchoolsForAdvisor(advisor) {
  if (isHeadOffice(advisor)) {
    return fetchAllSchools();
  }
  return fetchSchoolsForDistrict(advisor.district);
}
