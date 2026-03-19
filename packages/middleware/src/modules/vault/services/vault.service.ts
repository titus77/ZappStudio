/**
 * Vault Service — Nango-backed secret storage for ZappStudio
 *
 * Delegates API key storage to Nango (our OAuth/API key hub).
 * Connection ID format: tenant_{teamId}_pool_{secretId}
 *
 * The ZappImmo stack already manages BYOK keys via:
 * - Nango: stores API keys and OAuth tokens per tenant
 * - byok-resolver.ts (Genkit): resolves keys at LLM execution time
 *
 * This service maintains the same vault API interface used by the Studio UI
 * while using Nango as the backend instead of a JSON file.
 *
 * For the SRE runtime: keys are resolved via env vars (OPENAI_API_KEY, etc.)
 * passed through docker-compose. User-added BYOK keys are resolved by Genkit
 * at execution time via the byok-resolver middleware.
 */

import { vaultMessages } from '../constants/vault.constants';
import { prisma } from '../../../../prisma/prisma-client';

const NANGO_HOST = process.env.NANGO_URL || process.env.NANGO_HOST || 'http://immo-nango:3003';
const NANGO_SECRET_KEY = process.env.NANGO_SECRET_KEY || '';

// =============================================================================
// Nango API helpers (direct HTTP calls, no @nangohq/node dependency needed)
// =============================================================================

async function nangoFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${NANGO_HOST}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${NANGO_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

async function nangoSetApiKey(
  providerConfigKey: string,
  connectionId: string,
  apiKey: string,
): Promise<boolean> {
  const response = await nangoFetch('/connection', {
    method: 'POST',
    body: JSON.stringify({
      provider_config_key: providerConfigKey,
      connection_id: connectionId,
      credentials: { apiKey },
    }),
  });
  return response.ok;
}

async function nangoGetApiKey(
  providerConfigKey: string,
  connectionId: string,
): Promise<string | null> {
  try {
    const response = await nangoFetch(`/connection/${connectionId}?provider_config_key=${providerConfigKey}`);
    if (!response.ok) return null;
    const data = await response.json() as { credentials?: { apiKey?: string; access_token?: string } };
    return data.credentials?.apiKey || data.credentials?.access_token || null;
  } catch {
    return null;
  }
}

async function nangoDeleteConnection(
  providerConfigKey: string,
  connectionId: string,
): Promise<boolean> {
  const response = await nangoFetch(`/connection/${connectionId}?provider_config_key=${providerConfigKey}`, {
    method: 'DELETE',
  });
  return response.ok;
}

async function nangoListConnections(prefix: string): Promise<Array<{ connection_id: string; provider_config_key: string }>> {
  try {
    const response = await nangoFetch('/connection');
    if (!response.ok) return [];
    const data = await response.json() as { connections?: Array<{ connection_id: string; provider_config_key: string }> };
    return (data.connections || []).filter(c => c.connection_id.startsWith(prefix));
  } catch {
    return [];
  }
}

// =============================================================================
// Vault Service — Same interface, Nango backend
// =============================================================================

/** Build Nango connection ID from team and secret */
function buildConnectionId(teamId: string, secretId: string): string {
  return `tenant_${teamId}_pool_${secretId}`;
}

/** Derive Nango provider config key from secret ID */
function deriveProviderKey(secretId: string): string {
  // Map common key names to Nango provider config keys
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

export function formatSecretData(secret: any, secretId: string) {
  return {
    id: secretId,
    key: secretId,
    value: secret,
    metadata: {},
  };
}

export async function createSecret({ teamId, secretId, key, value, metadata }: {
  teamId: string;
  secretId: string;
  key: string;
  value: string;
  metadata?: any;
}) {
  const providerKey = deriveProviderKey(secretId);
  const connectionId = buildConnectionId(teamId, secretId);

  const success = await nangoSetApiKey(providerKey, connectionId, value);

  if (!success) {
    // Fallback: store in zs_team_setting if Nango is unavailable
    await prisma.teamSetting.upsert({
      where: { teamId_settingKey: { teamId, settingKey: `vault:${secretId}` } },
      update: { settingValue: value },
      create: { teamId, settingKey: `vault:${secretId}`, settingValue: value },
    });
  }

  // Store metadata in DB (lightweight, Nango doesn't support custom metadata)
  if (metadata) {
    await prisma.teamSetting.upsert({
      where: { teamId_settingKey: { teamId, settingKey: `vault-meta:${secretId}` } },
      update: { settingValue: JSON.stringify({ created_time: new Date().toISOString(), version: 1, ...metadata }) },
      create: { teamId, settingKey: `vault-meta:${secretId}`, settingValue: JSON.stringify({ created_time: new Date().toISOString(), version: 1, ...metadata }) },
    });
  }

  return {
    success: vaultMessages.SUCCESS_CREATE_SECRET,
    secret: { id: secretId, key, value, metadata: metadata || {} },
  };
}

export async function updateSecretMetadata({ teamId, secretId, metadata }: {
  teamId: string;
  secretId: string;
  metadata: any;
}) {
  const updatedMeta = { created_time: new Date().toISOString(), version: 1, ...metadata };

  await prisma.teamSetting.upsert({
    where: { teamId_settingKey: { teamId, settingKey: `vault-meta:${secretId}` } },
    update: { settingValue: JSON.stringify(updatedMeta) },
    create: { teamId, settingKey: `vault-meta:${secretId}`, settingValue: JSON.stringify(updatedMeta) },
  });

  const secretData = await getSecretById(teamId, secretId);
  return {
    success: vaultMessages.SUCCESS_UPDATE_SECRET_METADATA,
    secret: {
      id: secretId,
      key: secretId,
      value: secretData.secret?.value || '',
      metadata: updatedMeta,
    },
  };
}

export async function getAllSecrets(teamId: string, metadataFilter: string = '') {
  try {
    const prefix = `tenant_${teamId}_pool_`;
    const connections = await nangoListConnections(prefix);

    let secrets = connections.map(c => {
      const secretId = c.connection_id.replace(prefix, '');
      return { id: secretId, key: secretId, value: '***', metadata: {} as any };
    });

    // Also check DB fallback secrets
    const dbSettings = await prisma.teamSetting.findMany({
      where: { teamId, settingKey: { startsWith: 'vault:' } },
      select: { settingKey: true },
    });
    for (const s of dbSettings) {
      const secretId = s.settingKey.replace('vault:', '');
      if (!secrets.find(sec => sec.id === secretId)) {
        secrets.push({ id: secretId, key: secretId, value: '***', metadata: {} });
      }
    }

    // Load metadata from DB
    const metaSettings = await prisma.teamSetting.findMany({
      where: { teamId, settingKey: { startsWith: 'vault-meta:' } },
      select: { settingKey: true, settingValue: true },
    });
    const metaMap = new Map(metaSettings.map(m => [m.settingKey.replace('vault-meta:', ''), m.settingValue]));

    for (const secret of secrets) {
      const metaStr = metaMap.get(secret.id);
      if (metaStr) {
        try { secret.metadata = JSON.parse(metaStr); } catch {}
      }
    }

    // Apply metadata filter
    if (metadataFilter) {
      try {
        const filterObj = JSON.parse(metadataFilter);
        secrets = secrets.filter(s => {
          for (const key in filterObj) {
            if (s.metadata[key] !== filterObj[key]) return false;
          }
          return true;
        });
      } catch {}
    }

    return { success: vaultMessages.SUCCESS_GET_ALL_SECRETS, secrets };
  } catch (error: any) {
    return { success: vaultMessages.SUCCESS_GET_ALL_SECRETS, secrets: [] };
  }
}

export async function getSecretById(teamId: string, secretId: string) {
  // Try Nango first
  const providerKey = deriveProviderKey(secretId);
  const connectionId = buildConnectionId(teamId, secretId);
  const apiKey = await nangoGetApiKey(providerKey, connectionId);

  if (apiKey) {
    let metadata = {};
    const metaSetting = await prisma.teamSetting.findUnique({
      where: { teamId_settingKey: { teamId, settingKey: `vault-meta:${secretId}` } },
      select: { settingValue: true },
    });
    if (metaSetting) {
      try { metadata = JSON.parse(metaSetting.settingValue); } catch {}
    }

    return {
      success: vaultMessages.SUCCESS_GET_SECRET_BY_ID,
      secret: { id: secretId, key: secretId, value: apiKey, metadata },
    };
  }

  // Fallback: check DB
  const setting = await prisma.teamSetting.findUnique({
    where: { teamId_settingKey: { teamId, settingKey: `vault:${secretId}` } },
    select: { settingValue: true },
  });

  if (setting) {
    return {
      success: vaultMessages.SUCCESS_GET_SECRET_BY_ID,
      secret: { id: secretId, key: secretId, value: setting.settingValue, metadata: {} },
    };
  }

  return { error: vaultMessages.ERROR_SECRET_NOT_FOUND, secret: null };
}

export async function checkSecretExistsById(teamId: string, secretId: string) {
  const result = await getSecretById(teamId, secretId);
  return !!result.secret;
}

export async function getSecretByName(teamId: string, secretName: string) {
  return getSecretById(teamId, secretName);
}

export async function checkSecretExistsByName(teamId: string, secretName: string, excludeId: string | null = null) {
  const result = await getSecretById(teamId, secretName);
  return result.secret && result.secret.id !== excludeId;
}

export async function deleteSecretById(teamId: string, secretId: string) {
  // Delete from Nango
  const providerKey = deriveProviderKey(secretId);
  const connectionId = buildConnectionId(teamId, secretId);
  await nangoDeleteConnection(providerKey, connectionId);

  // Delete from DB (fallback + metadata)
  await prisma.teamSetting.deleteMany({
    where: { teamId, settingKey: { in: [`vault:${secretId}`, `vault-meta:${secretId}`] } },
  });

  return { success: vaultMessages.SUCCESS_DELETE_SECRET };
}

export async function getSecretsCount(teamId: string) {
  const result = await getAllSecrets(teamId);
  return { success: vaultMessages.SUCCESS_GET_ALL_SECRETS_COUNT, count: result.secrets.length };
}
