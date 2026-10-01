import { supabaseFetch } from '../_shared.js';

export async function onRequestGet({ params, env }) {
  const code = String(params.code || '').trim().toLowerCase();

  if (!/^[a-z0-9_-]{1,64}$/.test(code)) {
    return new Response('Link not found.', { status: 404 });
  }

  const encoded = encodeURIComponent(code);
  const response = await supabaseFetch(
    env,
    `/rest/v1/links?select=full_url&shortened_link=eq.${encoded}&limit=1`,
    { method: 'GET' }
  );

  if (!response.ok) {
    console.error('Redirect lookup failed:', response.status);
    return new Response('Unable to process this link right now.', { status: 503 });
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(`<!doctype html><html><head><title>Link not found</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><h1>Link not found</h1><p>The shortened link does not exist.</p></body></html>`, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  return Response.redirect(rows[0].full_url, 302);
}
