import { json, readSession } from '../_shared.js';

export async function onRequestGet({ request, env }) {
  const advisor = await readSession(request, env.SESSION_SECRET);
  if (!advisor) return json({ advisor: null }, 401);
  return json({ advisor });
}
