const encoder = new TextEncoder();

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeText(text) {
  return base64UrlEncode(encoder.encode(text));
}

function base64UrlDecodeText(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - text.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacSign(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

async function hmacVerify(value, signature, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const padded = signature.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - signature.length % 4) % 4);
  const binary = atob(padded);
  const sigBytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(value));
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = cookieHeader.split(';').map(v => v.trim());
  const prefix = `${name}=`;
  const found = cookies.find(c => c.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

async function createSessionCookie(advisor, secret) {
  const payload = base64UrlEncodeText(JSON.stringify({
    id: advisor.id,
    full_name: advisor.full_name,
    email: advisor.email,
    district: advisor.district,
    iat: Date.now()
  }));
  const signature = await hmacSign(payload, secret);
  return `${payload}.${signature}`;
}

async function readSession(request, secret) {
  const token = getCookie(request, 'wced_link_session');
  if (!token || !secret) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!(await hmacVerify(payload, signature, secret))) return null;

  try {
    const session = JSON.parse(base64UrlDecodeText(payload));
    if (!session?.id || !session?.email) return null;
    return session;
  } catch {
    return null;
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

async function supabaseFetch(env, path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('apikey', env.SUPABASE_SERVICE_ROLE_KEY);
  headers.set('Authorization', `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
  headers.set('Content-Type', 'application/json');
  return fetch(`${env.SUPABASE_URL}${path}`, { ...options, headers });
}

export {
  createSessionCookie,
  getCookie,
  json,
  readSession,
  supabaseFetch
};
