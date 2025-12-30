# Security Documentation

## NTTA Toll Expense Tracker

This document outlines security considerations, implemented protections, and remaining recommendations.

---

## ✅ Security Features Implemented

### 1. Build-Time Security

✅ **Console Log Removal**

- All `console.log` statements automatically removed in production builds
- Prevents exposure of sensitive data in browser console
- Configured in `vite.config.js` with terser minification

✅ **Content Security Policy (CSP)**

- Restricts resource loading to trusted sources
- Prevents XSS attacks and code injection
- Configured in `index.html` meta tags and `_headers`

✅ **Security Headers**

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Limits referrer information
- `X-XSS-Protection: 1; mode=block` - Browser XSS protection
- `Permissions-Policy` - Restricts API access (geolocation, camera, microphone)
- Configured in `index.html`, `_headers`, and `vercel.json`

### 2. Data Protection

✅ **Privacy Mode**

- Masks sensitive data in UI when enabled
- Supports multiple data types (names, emails, phone, money, etc.)
- Persists preference to localStorage
- Located in [src/contexts/PrivacyModeContext.jsx](src/contexts/PrivacyModeContext.jsx)

✅ **Encrypted Token Storage** ⭐ **FIXED**

- Authentication tokens encrypted using **AES-GCM** (Web Crypto API)
- Browser fingerprint-based key derivation (PBKDF2 with 100,000 iterations)
- Stored in sessionStorage but **fully encrypted**
- Automatic decryption on retrieval
- Located in [src/utils/secureStorage.js](src/utils/secureStorage.js)
- **Integrated in**: [src/components/LoginForm.jsx](src/components/LoginForm.jsx), [src/App.jsx](src/App.jsx)

✅ **Encrypted Transaction Cache** ⭐ **FIXED**

- All cached transaction data **encrypted with AES-GCM**
- Financial data, vehicle numbers, locations protected
- Implemented with time-based expiration
- Recent transactions (< 3 days): 1-hour cache
- Older transactions: 7-day cache
- Cache cleared and encrypted on logout
- Located in [src/utils/transactionCache.js](src/utils/transactionCache.js)

✅ **Input Validation & Sanitization** ⭐ **FIXED**

- **Username validation**: 3-50 characters, alphanumeric + dots/underscores/hyphens
- **Password validation**: 8-128 characters
- **Email validation**: RFC-compliant format checking
- **Date validation**: Reasonable range checking (10 years past to 1 year future)
- **XSS detection**: Pattern matching for common XSS attacks
- **SQL injection detection**: Pattern matching (defense in depth)
- **Rate limiting**: 5 login attempts per minute (client-side)
- Input sanitization for all user inputs
- Located in [src/utils/validation.js](src/utils/validation.js)
- **Integrated in**: [src/components/LoginForm.jsx](src/components/LoginForm.jsx)

✅ **Session Management**

- Session verification every 5 minutes
- **15-minute idle timeout** with activity detection
- Monitors: mousedown, keydown, scroll, touchstart, click events
- Automatic logout on inactivity with user notification
- All encrypted data cleared on logout
- Located in [src/App.jsx](src/App.jsx#L74-L120)

### 3. Network Security

✅ **Cloudflare Worker API Proxy**

- Proxies all API requests to NTTA
- Adds required Origin/Referer headers
- **CSRF protection via Origin/Referer validation** ⭐ **FIXED**
- Strict CORS policy with allowed origins whitelist
- POST requests require both Origin and Referer headers
- Rate limiting infrastructure (basic implementation)
- Located in [workers/api-proxy.js](workers/api-proxy.js)

✅ **Service Worker**

- Offline support with cached assets
- Automatic cache management and versioning
- Only registered in production builds
- Located in [public/sw.js](public/sw.js)

✅ **HTTPS Requirement**

- Service workers only work over HTTPS
- Required for production deployment
- Enforced by Cloudflare Pages

---

## 🔒 Security Status: Before vs After

### CRITICAL Issues

| Issue               | Before                       | After                    | Status    |
| ------------------- | ---------------------------- | ------------------------ | --------- |
| **Token Storage**   | Plain text in sessionStorage | ✅ AES-GCM encrypted     | **FIXED** |
| **Console Logging** | Tokens logged to console     | ✅ Removed in production | **FIXED** |

### HIGH Issues

| Issue                | Before                  | After                | Status    |
| -------------------- | ----------------------- | -------------------- | --------- |
| **Cache Encryption** | Plain text localStorage | ✅ AES-GCM encrypted | **FIXED** |
| **CORS Proxy**       | Not implemented         | ✅ Cloudflare Worker | **FIXED** |

### MEDIUM Issues

| Issue                | Before  | After                        | Status    |
| -------------------- | ------- | ---------------------------- | --------- |
| **CSRF Protection**  | None    | ✅ Origin/Referer validation | **FIXED** |
| **Input Validation** | Minimal | ✅ Comprehensive validation  | **FIXED** |
| **Idle Timeout**     | None    | ✅ 15-minute timeout         | **FIXED** |

### LOW Issues

| Issue                | Before  | After                      | Status    |
| -------------------- | ------- | -------------------------- | --------- |
| **Security Headers** | Missing | ✅ Full set configured     | **FIXED** |
| **Rate Limiting**    | None    | ✅ Client + Worker (basic) | **FIXED** |

---

## 📞 Security Contact

### Reporting Vulnerabilities

**DO NOT** publicly disclose security vulnerabilities.

Please report security issues via GitHub Security Advisories:
https://github.com/kyletaylored/ntta-toll-expenser/security/advisories/new

**Response Time**: Within 48 hours for critical issues

---

**Last Updated**: December 2025
**Security Status**: ✅ **PRODUCTION READY**
**Next Review**: March 2026
**Version**: 1.0.0
