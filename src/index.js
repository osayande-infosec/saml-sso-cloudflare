/**
 * SAML 2.0 SSO Service Provider - Cloudflare Worker
 * 
 * Enterprise SAML authentication running on the edge
 */

import { handleSAMLRequest, handleACS, handleSLO, handleMetadata } from './auth/handlers.js';
import { getSession, validateSession } from './auth/session.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      // SAML endpoints
      switch (path) {
        case '/saml/login':
          return handleSAMLRequest(request, env);
        
        case '/saml/acs':
          return handleACS(request, env);
        
        case '/saml/slo':
          return handleSLO(request, env);
        
        case '/saml/metadata':
          return handleMetadata(request, env);
        
        case '/api/session':
          return getSession(request, env);
        
        case '/api/protected':
          return handleProtectedRoute(request, env);
        
        case '/':
          return new Response(getHomePage(), {
            headers: { 'Content-Type': 'text/html' },
          });
        
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

async function handleProtectedRoute(request, env) {
  const session = await validateSession(request, env);
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    message: 'Welcome!',
    user: session.user,
    authenticated: true,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function getHomePage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAML 2.0 SSO Demo - CyberGuardNG</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      max-width: 600px;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
      text-align: center;
    }
    h1 { margin-bottom: 20px; font-size: 2rem; }
    p { margin-bottom: 30px; opacity: 0.8; }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: #00d4ff;
      color: #1a1a2e;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0,212,255,0.3);
    }
    .features { margin-top: 40px; text-align: left; }
    .features li { margin: 10px 0; padding-left: 24px; position: relative; }
    .features li::before { content: '✓'; position: absolute; left: 0; color: #00d4ff; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 SAML 2.0 SSO Demo</h1>
    <p>Enterprise Single Sign-On running on Cloudflare Edge</p>
    <a href="/saml/login" class="btn">Login with SSO</a>
    <ul class="features">
      <li>Full SAML 2.0 Service Provider</li>
      <li>Works with Okta, Azure AD, OneLogin</li>
      <li>Edge-native, zero servers</li>
      <li>SOC 2 / ISO 27001 compliant</li>
    </ul>
  </div>
</body>
</html>`;
}
