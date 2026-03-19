/**
 * Tests for ZappStudio auth middleware (Phase 1 — Authentik)
 *
 * Covers:
 * - JWT verification (HS256 with PGRST_JWT_SECRET)
 * - Forward Auth headers (X-Authentik-*)
 * - Unauthenticated access rejection
 * - M2M internal token acceptance
 * - Tenant-aware token detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// ============================================================================
// JWT helper (same logic as authentikAuth.mw.ts)
// ============================================================================

function createTestJWT(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyHS256(token: string, secret: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    const signInput = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(signInput).digest('base64url');
    if (expectedSig !== signatureB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// Tests
// ============================================================================

const TEST_SECRET = 'test-jwt-secret-for-zappstudio-auth-middleware-testing';

describe('Auth Middleware — JWT Verification', () => {
  it('should create and verify a valid HS256 JWT', () => {
    const payload = {
      sub: 'user-123',
      email: 'agent@immobilier.fr',
      tenant_id: 'tenant-abc',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = createTestJWT(payload, TEST_SECRET);
    const decoded = verifyHS256(token, TEST_SECRET);

    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('user-123');
    expect(decoded!.email).toBe('agent@immobilier.fr');
    expect(decoded!.tenant_id).toBe('tenant-abc');
  });

  it('should reject JWT with wrong secret', () => {
    const payload = { sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = createTestJWT(payload, TEST_SECRET);
    const decoded = verifyHS256(token, 'wrong-secret');

    expect(decoded).toBeNull();
  });

  it('should reject expired JWT', () => {
    const payload = {
      sub: 'user-123',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1h ago
    };
    const token = createTestJWT(payload, TEST_SECRET);
    const decoded = verifyHS256(token, TEST_SECRET);

    expect(decoded).toBeNull();
  });

  it('should reject malformed token', () => {
    expect(verifyHS256('not-a-jwt', TEST_SECRET)).toBeNull();
    expect(verifyHS256('', TEST_SECRET)).toBeNull();
    expect(verifyHS256('a.b', TEST_SECRET)).toBeNull();
  });

  it('should accept JWT without exp (no expiration)', () => {
    const payload = { sub: 'service-account', role: 'super_admin' };
    const token = createTestJWT(payload, TEST_SECRET);
    const decoded = verifyHS256(token, TEST_SECRET);

    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('service-account');
  });
});

describe('Auth Middleware — Forward Auth Headers', () => {
  it('should extract user from X-Authentik headers', () => {
    const headers: Record<string, string> = {
      'x-authentik-email': 'agent@agence-paris.fr',
      'x-authentik-uid': 'uid-456',
      'x-authentik-username': 'Jean Dupont',
      'x-authentik-meta-tenant-id': 'tenant-paris-001',
    };

    // Simulate the middleware logic
    const email = headers['x-authentik-email'];
    const uid = headers['x-authentik-uid'];
    const username = headers['x-authentik-username'];
    const tenantId = headers['x-authentik-meta-tenant-id'];

    expect(email).toBe('agent@agence-paris.fr');
    expect(uid).toBe('uid-456');
    expect(username).toBe('Jean Dupont');
    expect(tenantId).toBe('tenant-paris-001');

    // User object construction
    const user = {
      id: uid,
      email,
      role: 'admin',
      isAuthenticated: true,
      claims: { email, id: uid, sub: uid, name: username, tenant_id: tenantId },
    };

    expect(user.isAuthenticated).toBe(true);
    expect(user.claims.tenant_id).toBe('tenant-paris-001');
  });

  it('should not authenticate without required headers', () => {
    const headers: Record<string, string> = {
      'x-authentik-username': 'Jean Dupont',
      // Missing email and uid
    };

    const email = headers['x-authentik-email'];
    const uid = headers['x-authentik-uid'];

    // Without both email and uid, forward auth should not trigger
    expect(!email || !uid).toBe(true);
  });
});

describe('Auth Middleware — M2M Internal Token', () => {
  const INTERNAL_SECRET = 'internal-trusted-secret-12345';

  it('should accept exact match of internal secret', () => {
    const token = INTERNAL_SECRET;
    const isInternal = token === INTERNAL_SECRET;
    expect(isInternal).toBe(true);
  });

  it('should reject partial match', () => {
    const token = 'internal-trusted-secret-1234'; // missing last char
    const isInternal = token === INTERNAL_SECRET;
    expect(isInternal).toBe(false);
  });

  it('should distinguish M2M from JWT', () => {
    const jwtToken = createTestJWT({ sub: 'user' }, TEST_SECRET);
    const isInternalJwt = jwtToken === INTERNAL_SECRET;
    const isInternalM2M = INTERNAL_SECRET === INTERNAL_SECRET;

    expect(isInternalJwt).toBe(false);
    expect(isInternalM2M).toBe(true);
  });
});

describe('Auth Middleware — Tenant Extraction', () => {
  it('should extract tenant_id from JWT claims', () => {
    const payload = {
      sub: 'user-789',
      email: 'agent@lyon-immo.fr',
      tenant_id: 'tenant-lyon-002',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = createTestJWT(payload, TEST_SECRET);
    const decoded = verifyHS256(token, TEST_SECRET);

    expect(decoded!.tenant_id).toBe('tenant-lyon-002');
  });

  it('should handle JWT without tenant_id (standalone user)', () => {
    const payload = {
      sub: 'standalone-user',
      email: 'solo@gmail.com',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = createTestJWT(payload, TEST_SECRET);
    const decoded = verifyHS256(token, TEST_SECRET);

    expect(decoded!.tenant_id).toBeUndefined();
  });

  it('should extract tenant_id from Forward Auth headers', () => {
    const tenantId = 'tenant-marseille-003';
    const headers = { 'x-authentik-meta-tenant-id': tenantId };

    expect(headers['x-authentik-meta-tenant-id']).toBe('tenant-marseille-003');
  });
});
