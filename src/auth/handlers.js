/**
 * SAML Authentication Handlers
 */

import { parseSAMLResponse, validateSAMLResponse } from '../saml/validator.js';
import { generateSAMLRequest, generateMetadata } from '../saml/metadata.js';
import { createSession, destroySession } from './session.js';

/**
 * Initiate SAML authentication request
 */
export async function handleSAMLRequest(request, env) {
  const samlRequest = await generateSAMLRequest(env);
  const idpUrl = env.SAML_IDP_SSO_URL;
  
  // Redirect to IdP with SAML request
  const redirectUrl = `${idpUrl}?SAMLRequest=${encodeURIComponent(samlRequest)}`;
  
  return Response.redirect(redirectUrl, 302);
}

/**
 * Handle SAML Assertion Consumer Service (ACS)
 * Receives and validates SAML response from IdP
 */
export async function handleACS(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const samlResponse = formData.get('SAMLResponse');
    const relayState = formData.get('RelayState');

    if (!samlResponse) {
      return new Response('Missing SAML response', { status: 400 });
    }

    // Decode and parse SAML response
    const decodedResponse = atob(samlResponse);
    const parsedResponse = await parseSAMLResponse(decodedResponse);

    // Validate SAML response
    const validation = await validateSAMLResponse(parsedResponse, env);
    
    if (!validation.valid) {
      console.error('SAML validation failed:', validation.error);
      return new Response(`Authentication failed: ${validation.error}`, { status: 401 });
    }

    // Check for replay attack
    const assertionId = parsedResponse.assertionId;
    const existingAssertion = await env.SAML_SESSIONS.get(`assertion:${assertionId}`);
    
    if (existingAssertion) {
      return new Response('Replay attack detected', { status: 401 });
    }

    // Store assertion ID to prevent replay
    await env.SAML_SESSIONS.put(
      `assertion:${assertionId}`,
      'used',
      { expirationTtl: 3600 }
    );

    // Create session
    const sessionId = await createSession(env, {
      user: parsedResponse.nameId,
      attributes: parsedResponse.attributes,
      authenticatedAt: new Date().toISOString(),
    });

    // Redirect to app with session cookie
    const redirectUrl = relayState || '/';
    const response = Response.redirect(redirectUrl, 302);
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${env.SESSION_DURATION || 3600}`,
      },
    });

  } catch (error) {
    console.error('ACS error:', error);
    return new Response('Authentication processing failed', { status: 500 });
  }
}

/**
 * Handle Single Logout (SLO)
 */
export async function handleSLO(request, env) {
  const cookies = request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/session=([^;]+)/);
  
  if (sessionMatch) {
    await destroySession(env, sessionMatch[1]);
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    },
  });
}

/**
 * Serve SP metadata
 */
export async function handleMetadata(request, env) {
  const metadata = generateMetadata(env);
  
  return new Response(metadata, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
