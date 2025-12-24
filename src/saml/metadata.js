/**
 * SAML Request and Metadata Generator
 */

/**
 * Generate SAML AuthnRequest
 */
export async function generateSAMLRequest(env) {
  const id = `_${generateId()}`;
  const issueInstant = new Date().toISOString();
  
  const request = `
<samlp:AuthnRequest 
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${id}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${env.SAML_IDP_SSO_URL}"
  AssertionConsumerServiceURL="${env.SAML_SP_ACS_URL}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${env.SAML_SP_ENTITY_ID}</saml:Issuer>
  <samlp:NameIDPolicy 
    Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
    AllowCreate="true"/>
</samlp:AuthnRequest>`.trim();

  // Deflate and base64 encode for redirect binding
  const encoder = new TextEncoder();
  const data = encoder.encode(request);
  
  // For HTTP-Redirect binding, we need to deflate then base64
  // Cloudflare Workers support CompressionStream
  const compressed = await compress(data);
  
  return btoa(String.fromCharCode(...new Uint8Array(compressed)));
}

/**
 * Generate SP Metadata
 */
export function generateMetadata(env) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor 
  xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${env.SAML_SP_ENTITY_ID}">
  <md:SPSSODescriptor 
    AuthnRequestsSigned="false"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    
    <md:AssertionConsumerService 
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${env.SAML_SP_ACS_URL}"
      index="0"
      isDefault="true"/>
    
    <md:SingleLogoutService 
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      Location="${env.SAML_SP_SLO_URL}"/>
      
  </md:SPSSODescriptor>
  
  <md:Organization>
    <md:OrganizationName xml:lang="en">CyberGuardNG</md:OrganizationName>
    <md:OrganizationDisplayName xml:lang="en">CyberGuardNG Security</md:OrganizationDisplayName>
    <md:OrganizationURL xml:lang="en">https://cyberguardng.ca</md:OrganizationURL>
  </md:Organization>
  
  <md:ContactPerson contactType="technical">
    <md:GivenName>Osayande</md:GivenName>
    <md:SurName>Agbonkpolor</md:SurName>
    <md:EmailAddress>security@cyberguardng.ca</md:EmailAddress>
  </md:ContactPerson>
</md:EntityDescriptor>`;
}

/**
 * Generate unique ID
 */
function generateId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Compress data using DEFLATE
 */
async function compress(data) {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  
  const chunks = [];
  const reader = cs.readable.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}
