// ============================================================
// supabase-client.js
// ------------------------------------------------------------
// The ONE place the Supabase URL/anon key and client are created.
// Every page and module imports `supabaseClient` from here instead
// of calling createClient() themselves — so if the project URL or
// key ever changes, this is the only file that needs editing.
//
// NOTE: This relies on the Supabase UMD build (loaded via the CDN
// <script> tag in each HTML page, which sets window.supabase) being
// present BEFORE this module runs. Each HTML page must keep:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// above its <script type="module" src="..."> tags.
// ============================================================

const SUPABASE_URL = 'https://nnsxmrbmnymggdapkktl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Gh8ouV1INceQG9S_2Csi5A_eMYFZKgs';

if (typeof window.supabase === 'undefined') {
  throw new Error(
    'supabase-client.js: window.supabase is not defined. ' +
    'Make sure the Supabase CDN <script> tag is included in the HTML ' +
    'BEFORE any <script type="module"> that imports this file.'
  );
}

export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
