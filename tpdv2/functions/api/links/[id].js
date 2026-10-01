import { json, readSession, supabaseFetch } from '../../_shared.js';

export async function onRequestDelete({ request, env, params }) {
  const advisor = await readSession(request, env.SESSION_SECRET);
  if (!advisor) return json({ error: 'Not authenticated.' }, 401);

  const id = params?.id;
  if (!id) return json({ error: 'Missing link id.' }, 400);

  const response = await supabaseFetch(env, `/rest/v1/links?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' }
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('links DELETE failed:', response.status, detail);
    return json({ error: 'Unable to delete the link.' }, 500);
  }

  const deleted = await response.json();

  if (Array.isArray(deleted) && deleted.length === 0) {
    // Nothing matched that id — either it never existed, was already deleted,
    // or (if you later tighten RLS again) the policy blocked it silently.
    return json({ error: 'Link not found.' }, 404);
  }

  return json({ ok: true });
}
