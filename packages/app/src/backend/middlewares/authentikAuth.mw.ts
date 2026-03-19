import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';

const TRUSTED_JWT_SECRET = process.env.TRUSTED_JWT_SECRET || process.env.PGRST_JWT_SECRET;

/**
 * Simple HMAC-SHA256 JWT verification (same as PGRST_JWT_SECRET signing).
 * We use manual verification to avoid adding a dependency to the app package.
 * The middleware package has `jose` for more advanced JWT operations.
 */
function verifyHS256(token: string, secret: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const signInput = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signInput)
      .digest('base64url');

    if (expectedSig !== signatureB64) return null;

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
 * Supports two authentication flows:
 * - Flow A: Caddy Forward Auth (X-Authentik-* headers)
 * - Flow B: JWT passthrough from ZappImmo iframe or Authorization header
 */
export const authentikAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Flow A: Authentik Forward Auth headers (via Caddy)
  const authentikEmail = req.headers['x-authentik-email'] as string;
  const authentikUid = req.headers['x-authentik-uid'] as string;
  const authentikUsername = req.headers['x-authentik-username'] as string;
  const tenantId = req.headers['x-authentik-meta-tenant-id'] as string;

  if (authentikEmail && authentikUid) {
    req.user = {
      id: authentikUid,
      // @ts-ignore
      email: authentikEmail,
      role: 'admin',
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

  // Flow B: JWT from iframe query param or Authorization header
  const token =
    (req.query.zappimmo_token as string) ||
    req.headers.authorization?.split(' ')[1];

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

  // No auth found — unauthenticated access (let downstream middleware decide)
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
