/**
 * Tests for ZappStudio Prisma schema (Phase 0 — PostgreSQL)
 *
 * Covers:
 * - Provider is postgresql (not mysql)
 * - All models have @@map("zs_*") prefix
 * - Team model has tenantId field
 * - No @db.MediumText (MySQL-specific)
 * - Migration lock is postgresql
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.resolve(__dirname, '../prisma/schema.prisma');
const LOCK_PATH = path.resolve(__dirname, '../prisma/migrations/migration_lock.toml');

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

describe('Prisma Schema — PostgreSQL Migration', () => {
  it('should use postgresql provider', () => {
    expect(schema).toContain('provider = "postgresql"');
    expect(schema).not.toContain('provider = "mysql"');
  });

  it('should not contain @db.MediumText (MySQL-specific)', () => {
    expect(schema).not.toContain('@db.MediumText');
  });

  it('should use @db.Text instead', () => {
    expect(schema).toContain('@db.Text');
  });
});

describe('Prisma Schema — Table Prefix (zs_)', () => {
  const expectedMappings = [
    '@@map("zs_user")',
    '@@map("zs_user_setting")',
    '@@map("zs_team")',
    '@@map("zs_team_setting")',
    '@@map("zs_team_role")',
    '@@map("zs_user_team_role")',
    '@@map("zs_subscription")',
    '@@map("zs_plan")',
    '@@map("zs_ai_agent")',
    '@@map("zs_ai_agent_activity")',
    '@@map("zs_ai_agent_contributor")',
    '@@map("zs_ai_agent_settings")',
    '@@map("zs_ai_agent_data")',
    '@@map("zs_ai_agent_deployment")',
    '@@map("zs_ai_agent_state")',
    '@@map("zs_embodiment")',
    '@@map("zs_ai_agent_conversation")',
  ];

  for (const mapping of expectedMappings) {
    it(`should have ${mapping}`, () => {
      expect(schema).toContain(mapping);
    });
  }

  it('should have 17 @@map directives', () => {
    const matches = schema.match(/@@map\("zs_/g);
    expect(matches).toHaveLength(17);
  });
});

describe('Prisma Schema — Multi-Tenant', () => {
  it('should have tenantId on Team model', () => {
    expect(schema).toContain('tenantId');
    expect(schema).toMatch(/tenantId\s+String\?\s+@unique/);
  });
});

describe('Prisma Migration Lock', () => {
  it('should have postgresql provider in migration_lock.toml', () => {
    const lock = fs.readFileSync(LOCK_PATH, 'utf8');
    expect(lock).toContain('provider = "postgresql"');
    expect(lock).not.toContain('provider = "mysql"');
  });
});

describe('Prisma Schema — Model Completeness', () => {
  const expectedModels = [
    'model User',
    'model UserSetting',
    'model Team',
    'model TeamSetting',
    'model TeamRole',
    'model UserTeamRole',
    'model Subscription',
    'model Plan',
    'model AiAgent',
    'model AiAgentActivity',
    'model AiAgentContributor',
    'model AiAgentSettings',
    'model AiAgentData',
    'model AiAgentDeployment',
    'model AiAgentState',
    'model Embodiment',
    'model AiAgentConversation',
  ];

  for (const model of expectedModels) {
    it(`should define ${model}`, () => {
      expect(schema).toContain(model);
    });
  }

  it('should have exactly 17 models', () => {
    const matches = schema.match(/^model \w+/gm);
    expect(matches).toHaveLength(17);
  });
});
