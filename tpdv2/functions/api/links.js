import { json, readSession, supabaseFetch } from '../_shared.js';

function normaliseCode(value) {
  return String(value || '').trim().toLowerCase();
}

function validCode(code) {
  return /^[a-z0-9_-]{1,64}$/.test(code);
}

function validUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function onRequestGet({ request, env }) {
  const advisor = await readSession(request, env.SESSION_SECRET);
  if (!advisor) return json({ error: 'Not authenticated.' }, 401);

  const url = new URL(request.url);
  const mineOnly = url.searchParams.get('mine') !== 'false';
  const creatorFilter = mineOnly ? `&created_by=eq.${encodeURIComponent(advisor.id)}` : '';

  const response = await supabaseFetch(
    env,
    `/rest/v1/links?select=id,shortened_link,full_url,created_at,created_by,advisors(full_name)&order=created_at.desc${creatorFilter}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    console.error('links GET failed:', response.status, await response.text());
    return json({ error: 'Unable to load links.' }, 500);
  }

  const links = (await response.json()).map(link => ({
    ...link,
    creator_name: link.advisors?.full_name || null
  }));

  return json({ links });
}

export async function onRequestPost({ request, env }) {
  const advisor = await readSession(request, env.SESSION_SECRET);
  if (!advisor) return json({ error: 'Not authenticated.' }, 401);

  try {
    const body = await request.json();
    const shortened_link = normaliseCode(body?.shortened_link);
    const full_url = String(body?.full_url || '').trim();

    if (!validCode(shortened_link)) {
      return json({
        error: 'Shortened link may contain only letters, numbers, hyphens and underscores, and must be 1–64 characters long.'
      }, 400);
    }

    if (!validUrl(full_url)) {
      return json({ error: 'Please enter a valid http:// or https:// URL.' }, 400);
    }

    const response = await supabaseFetch(env, '/rest/v1/links', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        shortened_link,
        full_url,
        created_by: advisor.id
      })
    });

    if (response.status === 409) {
      return json({ error: 'That shortened link already exists.' }, 409);
    }

    if (!response.ok) {
      const detail = await response.text();
      console.error('links POST failed:', response.status, detail);
      return json({ error: 'Unable to create the link.' }, 500);
    }

    const data = await response.json();
    return json({ link: Array.isArray(data) ? data[0] : data }, 201);
  } catch (error) {
    console.error('Create link error:', error);
    return json({ error: 'Unable to create the link.' }, 500);
  }
}
