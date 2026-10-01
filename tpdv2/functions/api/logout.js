import { json } from '../_shared.js';

export async function onRequestPost() {
  return json({ ok: true }, 200, {
    'Set-Cookie': 'wced_link_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  });
}
