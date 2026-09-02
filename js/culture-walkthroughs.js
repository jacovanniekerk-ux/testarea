// ============================================================
// culture-walkthroughs.js
// ------------------------------------------------------------
// Reads/writes culture_walkthroughs (and, atomically, its attached
// classroom_observations rows) via the submit_culture_walkthrough()
// Postgres function — see culture_walkthroughs_setup.sql. Using an
// RPC here (rather than separate insert/update calls from the
// client) is what makes the "walkthrough + all its classroom
// observations save together, or not at all" guarantee real.
// ============================================================

import { supabaseClient } from './supabase-client.js';
import { isHeadOffice } from './schools.js';

/**
 * Save a walkthrough and all its classroom observations in one
 * atomic transaction. Works for both a draft save and a final
 * submit — the caller controls that via `submitted`/`submitted_at`
 * on the objects passed in.
 * @param {object} walkthroughData - shape matching culture_walkthroughs columns
 * @param {object[]} classroomRows - each shape matching classroom_observations columns
 * @returns {Promise<{data: {id: string, classroom_ids: string[]}|null, error: object|null}>}
 */
export async function submitCultureWalkthrough(walkthroughData, classroomRows) {
  const { data, error } = await supabaseClient.rpc('submit_culture_walkthrough', {
    p_walkthrough: walkthroughData,
    p_classrooms: classroomRows,
  });
  return { data, error };
}

/**
 * Fetch a single culture_walkthroughs row by id (for re-opening a
 * draft from Past Reports).
 * @param {string} id
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchCultureWalkthroughById(id) {
  const { data, error } = await supabaseClient
    .from('culture_walkthroughs')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

/**
 * Fetch every classroom_observations row linked to a given
 * walkthrough (for re-opening a draft — need to re-mount one
 * classroom-report.js instance per row).
 * @param {string} walkthroughId
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchClassroomObservationsForWalkthrough(walkthroughId) {
  const { data, error } = await supabaseClient
    .from('classroom_observations')
    .select('*')
    .eq('culture_walkthrough_id', walkthroughId)
    .order('created_at', { ascending: true });
  return { data, error };
}

/**
 * Fetch all culture_walkthroughs for a given advisor — used by
 * Past Reports.
 * @param {string} advisorId
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchWalkthroughsForAdvisor(advisorId) {
  const { data, error } = await supabaseClient
    .from('culture_walkthroughs')
    .select('*')
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Fetch all culture_walkthroughs for schools within a given district
 * (not scoped to a single advisor) — matches the "Past Reports shows
 * everything in my district" requirement. Joins against schools to
 * filter by district and to get the school name/circuit for display,
 * and joins against advisors to get the advisor's full name.
 * @param {string} district
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchWalkthroughsForDistrict(district) {
  const { data, error } = await supabaseClient
    .from('culture_walkthroughs')
    .select('*, schools!inner(school_name, district, circuit), advisors(full_name)')
    .eq('schools.district', district)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function fetchAllWalkthroughs() {
  const { data, error } = await supabaseClient
    .from('culture_walkthroughs')
    .select('*, schools!inner(school_name, district, circuit), advisors(full_name)')
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * The call Past Reports should actually use: HEAD OFFICE advisors
 * see every walkthrough across every district; everyone else sees
 * just their own district's, same as before.
 * @param {{district: string}} advisor
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchWalkthroughsForAdvisorScope(advisor) {
  if (isHeadOffice(advisor)) {
    return fetchAllWalkthroughs();
  }
  return fetchWalkthroughsForDistrict(advisor.district);
}
