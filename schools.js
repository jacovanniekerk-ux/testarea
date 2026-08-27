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
// ============================================================

import { supabaseClient } from './supabase-client.js';

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
    .select('cemis_number, school_name, district, computer_labs, smart_classrooms, learner_devices, connectivity')
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
    .select('cemis_number, school_name, district, computer_labs, smart_classrooms, learner_devices, connectivity')
    .eq('cemis_number', cemisNumber)
    .single();

  return { data, error };
}

/**
 * Fetch every school (all districts). Mostly useful for admin/debug
 * views — normal advisor-facing pages should use
 * fetchSchoolsForDistrict() scoped to the logged-in advisor's district.
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchAllSchools() {
  const { data, error } = await supabaseClient
    .from('schools')
    .select('cemis_number, school_name, district, computer_labs, smart_classrooms, learner_devices, connectivity')
    .order('district', { ascending: true })
    .order('school_name', { ascending: true });

  return { data, error };
}
