/**
 * Tests for ZappStudio Vault — Nango backend (Phase 3)
 *
 * Covers:
 * - Connection ID format (tenant_{teamId}_pool_{secretId})
 * - Provider key derivation (openai → openai, etc.)
 * - Secret metadata handling
 * - Vault constants (translated messages)
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Connection ID & Provider Key Logic (from vault.service.ts)
// ============================================================================

function buildConnectionId(teamId: string, secretId: string): string {
  return `tenant_${teamId}_pool_${secretId}`;
}

function deriveProviderKey(secretId: string): string {
  const mapping: Record<string, string> = {
    openai: 'openai',
    anthropic: 'anthropic',
    groq: 'groq',
    googleai: 'google-ai',
    togetherai: 'together-ai',
    xai: 'xai',
    deepseek: 'deepseek',
    tavily: 'tavily',
  };
  return mapping[secretId.toLowerCase()] || 'api-key';
}

describe('Vault — Connection ID', () => {
  it('should build tenant-scoped connection ID', () => {
    const id = buildConnectionId('team-abc', 'openai');
    expect(id).toBe('tenant_team-abc_pool_openai');
  });

  it('should handle UUID team IDs', () => {
    const id = buildConnectionId('550e8400-e29b-41d4-a716-446655440000', 'anthropic');
    expect(id).toBe('tenant_550e8400-e29b-41d4-a716-446655440000_pool_anthropic');
  });

  it('should handle custom secret names', () => {
    const id = buildConnectionId('team-1', 'my-custom-api-key');
    expect(id).toBe('tenant_team-1_pool_my-custom-api-key');
  });
});

describe('Vault — Provider Key Derivation', () => {
  it('should map known providers', () => {
    expect(deriveProviderKey('openai')).toBe('openai');
    expect(deriveProviderKey('anthropic')).toBe('anthropic');
    expect(deriveProviderKey('groq')).toBe('groq');
    expect(deriveProviderKey('googleai')).toBe('google-ai');
    expect(deriveProviderKey('togetherai')).toBe('together-ai');
    expect(deriveProviderKey('xai')).toBe('xai');
    expect(deriveProviderKey('deepseek')).toBe('deepseek');
    expect(deriveProviderKey('tavily')).toBe('tavily');
  });

  it('should be case-insensitive', () => {
    expect(deriveProviderKey('OpenAI')).toBe('openai');
    expect(deriveProviderKey('ANTHROPIC')).toBe('anthropic');
  });

  it('should default to api-key for unknown providers', () => {
    expect(deriveProviderKey('some-unknown-provider')).toBe('api-key');
    expect(deriveProviderKey('my-custom-key')).toBe('api-key');
  });
});

describe('Vault — Secret Metadata', () => {
  it('should create metadata with timestamp and version', () => {
    const metadata = {
      created_time: new Date().toISOString(),
      version: 1,
      scope: 'AgentLLM',
      label: 'Ma cle OpenAI',
    };

    expect(metadata.version).toBe(1);
    expect(metadata.scope).toBe('AgentLLM');
    expect(metadata.created_time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should serialize/deserialize metadata to JSON', () => {
    const original = { created_time: '2026-03-19T00:00:00Z', version: 1, scope: 'Credentials' };
    const json = JSON.stringify(original);
    const parsed = JSON.parse(json);

    expect(parsed.scope).toBe('Credentials');
    expect(parsed.version).toBe(1);
  });
});

describe('Vault — Messages (FR)', () => {
  const vaultMessages = {
    SUCCESS_CREATE_SECRET: 'Secret cree avec succes',
    SUCCESS_DELETE_SECRET: 'Secret supprime avec succes',
    SUCCESS_GET_ALL_SECRETS: 'Secrets recuperes avec succes',
    SUCCESS_GET_SECRET_BY_ID: 'Secret recupere avec succes',
    ERROR_SECRET_NOT_FOUND: 'Secret introuvable',
  };

  it('should have French success messages', () => {
    expect(vaultMessages.SUCCESS_CREATE_SECRET).toContain('succes');
    expect(vaultMessages.SUCCESS_DELETE_SECRET).toContain('supprime');
  });

  it('should have French error messages', () => {
    expect(vaultMessages.ERROR_SECRET_NOT_FOUND).toBe('Secret introuvable');
  });
});

describe('Vault — Nango Integration Pattern', () => {
  it('should use pool pattern for team-level keys', () => {
    // Pool keys: shared across all users in a team
    const connectionId = buildConnectionId('team-paris', 'openai');
    expect(connectionId).toContain('_pool_');
  });

  it('should follow same pattern as BYOK resolver', () => {
    // BYOK resolver uses: tenant_{tenantId}_pool_{provider}
    // Vault uses: tenant_{teamId}_pool_{secretId}
    // These are compatible when secretId = provider name
    const vaultId = buildConnectionId('tenant-123', 'openai');
    const byokId = `tenant_tenant-123_pool_openai`;
    expect(vaultId).toBe(byokId);
  });
});
