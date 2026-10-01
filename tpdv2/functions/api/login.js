import { createSessionCookie, json, supabaseFetch } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return json({ error: 'Please enter both email and password.' }, 400);
    }

    const response = await supabaseFetch(env, '/rest/v1/rpc/login_advisor', {
      method: 'POST',
      body: JSON.stringify({ p_email: email, p_password: password })
    });

    if (!response.ok) {
      console.error('login_advisor RPC failed:', response.status);
      return json({ error: 'Unable to log in. Please try again.' }, 500);
    }

    const data = await response.json();
    const profile = Array.isArray(data) ? data[0] : data;

    if (!profile) {
      return json({ error: 'Invalid email or password.' }, 401);
    }

    const token = await createSessionCookie(profile, env.SESSION_SECRET);

    return json({
      advisor: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        district: profile.district
      }
    }, 200, {
      'Set-Cookie': `wced_link_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`
    });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Unable to log in. Please try again.' }, 500);
  }
}
