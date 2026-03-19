import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';

const TRUSTED_JWT_SECRET = process.env.TRUSTED_JWT_SECRET || process.env.PGRST_JWT_SECRET;

/**
 * Timing-safe HMAC-SHA256 JWT verification.
 * Validates alg=HS256 only (SEC: no alg confusion).
 * Uses timingSafeEqual to prevent timing side-channel attacks.
 */
function verifyHS256(token: string, secret: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // SEC: Validate algorithm is HS256 (prevent alg confusion)
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    if (header.alg !== 'HS256') return null;

    // Compute expected signature
    const signInput = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signInput)
      .digest('base64url');

    // SEC: Timing-safe comparison (prevent byte-by-byte oracle)
    const sigBuf = Buffer.from(signatureB64, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Authentik authentication middleware for ZappStudio.
 *
 * Flow A: Caddy Forward Auth (X-Authentik-* headers)
 *   NOTE: These headers are ONLY trusted when injected by Caddy forward_auth.
 *   Direct access to the Express server (bypassing Caddy) would allow header
 *   forgery. The container port is NOT exposed publicly (127.0.0.1 only).
 *
 * Flow B: JWT passthrough from ZappImmo iframe or Authorization header
 */
export const authentikAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Flow A: Authentik Forward Auth headers (via Caddy)
  const authentikEmail = req.headers['x-authentik-email'] as string;
  const authentikUid = req.headers['x-authentik-uid'] as string;
  const authentikUsername = req.headers['x-authentik-username'] as string;
  const authentikGroups = req.headers['x-authentik-groups'] as string;
  const tenantId = req.headers['x-authentik-meta-tenant-id'] as string;

  if (authentikEmail && authentikUid) {
    // SEC: Derive role from Authentik groups instead of hardcoding admin
    const isAdmin = authentikGroups?.includes('admins') || authentikGroups?.includes('zappimmo-admin');
    req.user = {
      id: authentikUid,
      // @ts-ignore
      email: authentikEmail,
      role: isAdmin ? 'admin' : 'authenticated',
      accessToken: 'FORWARD_AUTH',
      isAuthenticated: true,
      claims: {
        email: authentikEmail,
        id: authentikUid,
        sub: authentikUid,
        name: authentikUsername || authentikEmail.split('@')[0],
        tenant_id: tenantId,
      },
    };
    return next();
  }

  // Flow B: JWT from Authorization header only (not query param — SEC: avoid URL logging)
  const token = req.headers.authorization?.split(' ')[1];

  if (token && TRUSTED_JWT_SECRET) {
    const decoded = verifyHS256(token, TRUSTED_JWT_SECRET);
    if (decoded) {
      req.user = {
        id: decoded.sub || decoded.user_id,
        // @ts-ignore
        email: decoded.email,
        role: decoded.role || 'authenticated',
        accessToken: token,
        isAuthenticated: true,
        claims: {
          ...decoded,
          id: decoded.sub || decoded.user_id,
        },
      };
      return next();
    }
  }

  // Health check and static assets don't need auth
  if (req.path === '/health' || req.path.startsWith('/assets/') || req.path.startsWith('/static/')) {
    req.user = {
      id: 'anonymous',
      // @ts-ignore
      email: '',
      role: 'none',
      accessToken: '',
      isAuthenticated: false,
      claims: {},
    };
    return next();
  }

  // No auth found
  req.user = {
    id: '',
    // @ts-ignore
    email: '',
    role: 'none',
    accessToken: '',
    isAuthenticated: false,
    claims: {},
  };
  return next();
};
