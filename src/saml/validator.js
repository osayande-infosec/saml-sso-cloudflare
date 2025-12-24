/**
 * SAML Response Parser and Validator
 */

import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';

const SAML_NAMESPACES = {
  saml: 'urn:oasis:names:tc:SAML:2.0:assertion',
  samlp: 'urn:oasis:names:tc:SAML:2.0:protocol',
  ds: 'http://www.w3.org/2000/09/xmldsig#',
};

/**
 * Parse SAML response XML
 */
export async function parseSAMLResponse(xmlString) {
  const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
  const select = xpath.useNamespaces(SAML_NAMESPACES);

  // Extract key elements
  const statusCode = select('//samlp:StatusCode/@Value', doc)[0]?.value;
  const assertionId = select('//saml:Assertion/@ID', doc)[0]?.value;
  const issuer = select('//saml:Issuer/text()', doc)[0]?.nodeValue;
  const nameId = select('//saml:NameID/text()', doc)[0]?.nodeValue;
  
  // Extract conditions
  const notBefore = select('//saml:Conditions/@NotBefore', doc)[0]?.value;
  const notOnOrAfter = select('//saml:Conditions/@NotOnOrAfter', doc)[0]?.value;
  const audience = select('//saml:AudienceRestriction/saml:Audience/text()', doc)[0]?.nodeValue;

  // Extract attributes
  const attributeNodes = select('//saml:AttributeStatement/saml:Attribute', doc);
  const attributes = {};
  
  for (const attr of attributeNodes) {
    const name = attr.getAttribute('Name');
    const values = select('saml:AttributeValue/text()', attr);
    attributes[name] = values.map(v => v.nodeValue);
  }

  // Extract signature
  const signature = select('//ds:Signature', doc)[0];

  return {
    statusCode,
    assertionId,
    issuer,
    nameId,
    notBefore,
    notOnOrAfter,
    audience,
    attributes,
    signature,
    rawXml: xmlString,
  };
}

/**
 * Validate SAML response
 */
export async function validateSAMLResponse(parsedResponse, env) {
  const errors = [];

  // 1. Check status
  if (parsedResponse.statusCode !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
    errors.push('SAML status is not Success');
  }

  // 2. Validate issuer
  if (parsedResponse.issuer !== env.SAML_IDP_ENTITY_ID) {
    errors.push('Invalid issuer');
  }

  // 3. Validate audience
  if (parsedResponse.audience !== env.SAML_SP_ENTITY_ID) {
    errors.push('Invalid audience');
  }

  // 4. Validate time conditions
  const now = new Date();
  
  if (parsedResponse.notBefore) {
    const notBefore = new Date(parsedResponse.notBefore);
    // Allow 5 minute clock skew
    if (now < new Date(notBefore.getTime() - 5 * 60 * 1000)) {
      errors.push('Assertion not yet valid');
    }
  }

  if (parsedResponse.notOnOrAfter) {
    const notOnOrAfter = new Date(parsedResponse.notOnOrAfter);
    // Allow 5 minute clock skew
    if (now > new Date(notOnOrAfter.getTime() + 5 * 60 * 1000)) {
      errors.push('Assertion has expired');
    }
  }

  // 5. Validate signature (simplified - production should use full XML signature validation)
  if (!parsedResponse.signature) {
    errors.push('Missing signature');
  }

  // TODO: Implement full XML signature validation with IdP certificate
  // This requires crypto.subtle for RSA-SHA256 verification

  if (errors.length > 0) {
    return { valid: false, error: errors.join(', ') };
  }

  return { valid: true };
}

/**
 * Verify XML signature using IdP certificate
 */
export async function verifySignature(signature, cert) {
  // Extract signature value and signed info
  // Canonicalize and verify using RSA-SHA256
  // This is a placeholder - full implementation requires xml-crypto or similar
  
  return true; // Simplified for demo
}
