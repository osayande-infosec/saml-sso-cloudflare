# SAML 2.0 SSO on Cloudflare Edge

🔐 **Enterprise SAML 2.0 Single Sign-On running on Cloudflare Workers**

[![Security Scan](https://img.shields.io/badge/Security-Passing-green)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)

## 🎯 Overview

A complete SAML 2.0 Service Provider implementation running entirely on Cloudflare's edge network. No servers to maintain, globally distributed, and enterprise-ready.

**Live Demo:** [saml-demo.cyberguardng.ca](https://saml-demo.cyberguardng.ca)

## ✨ Features

- ✅ **Full SAML 2.0 SP Implementation** - Complete service provider functionality
- ✅ **Edge-Native Architecture** - Runs on Cloudflare Workers (zero servers)
- ✅ **Multi-IdP Support** - Okta, Azure AD, OneLogin, PingFederate
- ✅ **Security Hardened** - Signed assertions, replay protection, secure sessions
- ✅ **Compliance Ready** - SOC 2 / ISO 27001 aligned authentication

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Browser  │────▶│ Cloudflare Edge  │────▶│    Identity     │
│                 │◀────│    (SAML SP)     │◀────│  Provider (IdP) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   KV Storage     │
                        │   (Sessions)     │
                        └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI (`npm install -g wrangler`)
- Identity Provider (Okta, Azure AD, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/osayande-infosec/saml-sso-cloudflare.git
cd saml-sso-cloudflare

# Install dependencies
npm install

# Configure environment
cp wrangler.example.toml wrangler.toml

# Deploy
wrangler deploy
```

### Configuration

1. **Create KV Namespace:**
   ```bash
   wrangler kv:namespace create "SAML_SESSIONS"
   ```

2. **Set IdP Configuration** in `wrangler.toml`:
   ```toml
   [vars]
   SAML_IDP_SSO_URL = "https://your-idp.com/sso"
   SAML_IDP_ENTITY_ID = "https://your-idp.com"
   SAML_SP_ENTITY_ID = "https://your-app.workers.dev"
   ```

3. **Add IdP Certificate:**
   ```bash
   wrangler secret put SAML_IDP_CERT
   ```

## 📁 Project Structure

```
saml-sso-cloudflare/
├── src/
│   ├── index.js              # Worker entry point
│   ├── saml/
│   │   ├── parser.js         # SAML response parser
│   │   ├── validator.js      # Signature validation
│   │   └── metadata.js       # SP metadata generator
│   ├── auth/
│   │   ├── session.js        # Session management
│   │   └── handlers.js       # Route handlers
│   └── utils/
│       ├── crypto.js         # Crypto utilities
│       └── xml.js            # XML helpers
├── test/
├── wrangler.toml
└── package.json
```

## 🔒 Security Features

| Feature | Description |
|---------|-------------|
| XML Signature Validation | RSA-SHA256 signature verification |
| Replay Protection | One-time assertion IDs via KV storage |
| Secure Sessions | HTTP-only, Secure, SameSite cookies |
| Assertion Expiry | NotBefore/NotOnOrAfter validation |
| Audience Restriction | SP entity ID validation |

## 🧪 Supported Identity Providers

| Provider | Status | Setup Guide |
|----------|--------|-------------|
| Okta | ✅ Tested | [docs/okta-setup.md](docs/okta-setup.md) |
| Azure AD | ✅ Tested | [docs/azure-setup.md](docs/azure-setup.md) |
| OneLogin | ✅ Tested | [docs/onelogin-setup.md](docs/onelogin-setup.md) |
| PingFederate | ✅ Tested | [docs/ping-setup.md](docs/ping-setup.md) |

## 📊 Performance

| Metric | Value |
|--------|-------|
| Cold Start | ~5ms |
| SAML Processing | ~15ms |
| Global Latency | <50ms |

## 🔗 Related Projects

- [CyberGuardNG](https://github.com/osayande-infosec/cyberguardng) - Cybersecurity consulting platform
- [Security Audit Pipeline](https://github.com/osayande-infosec/cyberguardng-security-audit) - Automated security scanning

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 👤 Author

**Osayande Agbonkpolor** - Cybersecurity Professional

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/osayande-agbonkpolor)
[![Website](https://img.shields.io/badge/Website-cyberguardng.ca-green)](https://cyberguardng.ca)

---

⭐ **Star this repo** if it helped you implement enterprise SSO!
