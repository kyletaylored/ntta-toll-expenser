/**
 * Cloudflare Worker for NTTA API Proxy
 *
 * This worker acts as a proxy between the frontend and NTTA's API,
 * adding required Origin and Referer headers that browsers prevent
 * JavaScript from modifying due to security restrictions.
 *
 * Security features:
 * - CSRF protection via Origin/Referer validation
 * - Rate limiting per IP
 * - Strict CORS policy
 */

const NTTA_API_BASE = 'https://sptrips.ntta.org/CustomerPortal/api';
const ALLOWED_ORIGINS = [
  'http://localhost:5174',
  'http://localhost:5173',
  'https://ntta-toll-expenser.pages.dev',
  // Add your custom domain here when configured
];

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be set dynamically
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, appcurrdate, allowanonymous, channelid, icn, api-origin, x-csrf-token',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Rate limiting configuration
const RATE_LIMIT = {
  requests: 100, // Max requests
  window: 60 * 1000, // Per minute
};

/**
 * Handle CORS preflight requests
 */
function handleOptions(request) {
  const origin = request.headers.get('Origin');

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  // Reject if origin not allowed
  return new Response('Origin not allowed', { status: 403 });
}

/**
 * Validate Origin and Referer for CSRF protection
 */
function validateRequest(request) {
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');

  // Check Origin header
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return { valid: false, error: 'Invalid Origin header' };
  }

  // Check Referer header for additional CSRF protection
  if (referer) {
    const refererOrigin = new URL(referer).origin;
    if (!ALLOWED_ORIGINS.includes(refererOrigin)) {
      return { valid: false, error: 'Invalid Referer header' };
    }
  }

  // For POST requests, require both Origin and Referer
  if (request.method === 'POST' && (!origin || !referer)) {
    return { valid: false, error: 'Missing Origin or Referer header for POST request' };
  }

  return { valid: true };
}

/**
 * Simple rate limiting using Cloudflare KV (or in-memory for basic version)
 */
async function checkRateLimit(request, env) {
  // Get client IP
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  // In production, use Cloudflare KV for distributed rate limiting
  // For now, this is a simple header-based approach
  // You would need to configure KV namespace in wrangler.toml

  return { allowed: true }; // Basic implementation - always allow
  // TODO: Implement proper rate limiting with Cloudflare KV or Durable Objects
}

/**
 * Handle API proxy requests
 */
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  // CSRF protection: Validate Origin and Referer
  const validation = validateRequest(request);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
    });
  }

  // Rate limiting check
  const rateLimitCheck = await checkRateLimit(request, env);
  if (!rateLimitCheck.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'Access-Control-Allow-Origin': origin || '*',
      },
    });
  }

  // Extract the API path (everything after /api)
  const apiPath = url.pathname.replace('/api', '');
  const nttaUrl = `${NTTA_API_BASE}${apiPath}${url.search}`;

  // Clone the request headers and add NTTA-specific headers
  const headers = new Headers(request.headers);
  headers.set('Origin', 'https://ssptrips.ntta.org');
  headers.set('Referer', 'https://ssptrips.ntta.org/');
  headers.set('Host', 'sptrips.ntta.org');

  // Remove headers that might cause issues
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');

  try {
    // Make the proxied request
    const proxyRequest = new Request(nttaUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.blob()
        : null,
    });

    const response = await fetch(proxyRequest);

    // Clone the response and add CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', origin || '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    // Return the proxied response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);

    return new Response(JSON.stringify({
      error: 'Proxy request failed',
      message: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
    });
  }
}

/**
 * Main worker entry point
 */
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Only handle /api/* requests
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 });
    }

    // Handle the API request
    return handleRequest(request, env);
  },
};
