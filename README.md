# NTTA Toll Expense Tracker

A web application for tracking and generating expense receipts for NTTA toll transactions. Perfect for business travelers who need to expense their toll road usage.

## Features

- 🔐 **Secure Authentication** - Encrypted token storage (AES-GCM)
- 📊 **Transaction History** - Search and view toll transactions
- 🗂️ **Smart Grouping** - Organize by day, trip, or individually
- 📄 **PDF Receipts** - Generate professional expense receipts
- 🛡️ **Security Hardened** - CSRF protection, input validation, 15-min idle timeout

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- NTTA account

### Installation

```bash
# Clone repository
git clone https://github.com/kyletaylored/ntta-toll-expenser.git
cd ntta-toll-expenser

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5174 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Usage

1. **Login** with your NTTA credentials
2. **Search** transactions by date range
3. **Group** transactions (by day, trip, or none)
4. **Select** transactions and add business purposes
5. **Generate** PDF receipts

## Deployment

This app requires **Cloudflare Pages + Worker** for production deployment (NTTA API requires specific headers that browsers can't set).

See [SECURITY.md](SECURITY.md) for security features and [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for API details.

## Architecture

**Frontend**: React + Chakra UI v3 + Vite
**Backend**: Cloudflare Worker (API proxy)
**Security**: AES-GCM encryption, CSRF protection, input validation

## Privacy & Security

- ✅ All data encrypted (AES-GCM 256-bit)
- ✅ No third-party data collection
- ✅ Session data stored locally only
- ✅ Automatic logout after 15 minutes idle
- ✅ CSRF protection on all requests

See [SECURITY.md](SECURITY.md) for complete security documentation.

## Development

```bash
npm test          # Run tests
npm run lint      # Lint code
npm run build     # Production build
```

## Contributing

Contributions welcome! Please submit a Pull Request.

## Disclaimer

**This is an unofficial, third-party application not affiliated with NTTA.**

- ⚠️ Use at your own risk
- ⚠️ No warranty or guarantees provided
- ⚠️ Always verify receipts against official NTTA statements
- ⚠️ Author not liable for any damages, losses, or account issues

This software uses NTTA's undocumented API which may violate their Terms of Service. Your account may be suspended or terminated. **Use official NTTA channels when possible.**

**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.**

## License

MIT License - See [LICENSE](LICENSE)

---

**Star ⭐ this repo if you find it useful!**

Report issues: [GitHub Issues](https://github.com/kyletaylored/ntta-toll-expenser/issues)
Security issues: [GitHub Security Advisories](https://github.com/kyletaylored/ntta-toll-expenser/security/advisories)
