// ============================================================
// classroom-observations.js
// ------------------------------------------------------------
// Reads/writes the classroom_observations table. Kept separate
// from classroom-report.js (the form/UI) so any page that needs to
// persist a classroom observation — standalone report, walkthrough,
// or Past Reports editing — goes through the same logic.
// ============================================================

import { supabaseClient } from './supabase-client.js';
import { isHeadOffice } from './schools.js';

/**
 * Insert a new draft/submitted row, or update an existing one if
 * `row.id` is already set (e.g. editing a draft loaded from Past
 * Reports). Either way, returns the saved row.
 * @param {object} row - shape matching classroom_observations columns
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function saveClassroomObservation(row) {
  const { id, ...fields } = row;

  if (id) {
    const { data, error } = await supabaseClient
      .from('classroom_observations')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  }

  const { data, error } = await supabaseClient
    .from('classroom_observations')
    .insert(fields)
    .select()
    .single();
  return { data, error };
}

/**
 * Fetch a single classroom_observations row by id (for re-opening a
 * draft from Past Reports).
 * @param {string} id
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchClassroomObservationById(id) {
  const { data, error } = await supabaseClient
    .from('classroom_observations')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

/**
 * Fetch all standalone (culture_walkthrough_id IS NULL) classroom
 * observations for a given advisor — used by Past Reports.
 * @param {string} advisorId
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchStandaloneObservationsForAdvisor(advisorId) {
  const { data, error } = await supabaseClient
    .from('classroom_observations')
    .select('*, advisors:advisor_id(full_name)')
    .eq('advisor_id', advisorId)
    .is('culture_walkthrough_id', null)
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Fetch all standalone classroom observations for schools within a
 * given district (not scoped to a single advisor) — matches the
 * "Past Reports shows everything in my district" requirement.
 * @param {string} district
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchStandaloneObservationsForDistrict(district) {
  const { data, error } = await supabaseClient
    .from('classroom_observations')
    .select('*, schools!inner(school_name, district, circuit), advisors:advisor_id(full_name)')
    .eq('schools.district', district)
    .is('culture_walkthrough_id', null)
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Fetch every standalone classroom observation across every
 * district — used for HEAD OFFICE advisors.
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchAllStandaloneObservations() {
  const { data, error } = await supabaseClient
    .from('classroom_observations')
    .select('*, schools!inner(school_name, district, circuit), advisors:advisor_id(full_name)')
    .is('culture_walkthrough_id', null)
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * The call Past Reports should actually use: HEAD OFFICE advisors
 * see every standalone classroom report across every district;
 * everyone else sees just their own district's, same as before.
 * @param {{district: string}} advisor
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchStandaloneObservationsForAdvisorScope(advisor) {
  if (isHeadOffice(advisor)) {
    return fetchAllStandaloneObservations();
  }
  return fetchStandaloneObservationsForDistrict(advisor.district);
}
