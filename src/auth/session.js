/**
 * Session Management for SAML SSO
 */

/**
 * Create a new session
 */
export async function createSession(env, userData) {
  const sessionId = generateSessionId();
  
  await env.SAML_SESSIONS.put(
    `session:${sessionId}`,
    JSON.stringify({
      ...userData,
      createdAt: new Date().toISOString(),
    }),
    { expirationTtl: parseInt(env.SESSION_DURATION || '3600') }
  );

  return sessionId;
}

/**
 * Get session data
 */
export async function getSession(request, env) {
  const session = await validateSession(request, env);
  
  if (!session) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    authenticated: true,
    user: session.user,
    attributes: session.attributes,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Validate session from request cookies
 */
export async function validateSession(request, env) {
  const cookies = request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/session=([^;]+)/);
  
  if (!sessionMatch) {
    return null;
  }

  const sessionId = sessionMatch[1];
  const sessionData = await env.SAML_SESSIONS.get(`session:${sessionId}`);
  
  if (!sessionData) {
    return null;
  }

  return JSON.parse(sessionData);
}

/**
 * Destroy a session
 */
export async function destroySession(env, sessionId) {
  await env.SAML_SESSIONS.delete(`session:${sessionId}`);
}

/**
 * Generate cryptographically secure session ID
 */
function generateSessionId() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
