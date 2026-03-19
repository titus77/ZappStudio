import crypto from 'crypto';
import { AbstractDeployer, DeployParams } from './AbstractDeployer';

const WEBHOOK_URL = process.env.SMYTHOS_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.SMYTHOS_WEBHOOK_SECRET;

export class SmythOsDeployer extends AbstractDeployer {
  async deploy(params: DeployParams) {
    const aggregatedSettings = params.aiAgent.settings.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {});

    const _newDeployment = await params.tx.aiAgentDeployment.create({
      data: {
        aiAgent: {
          connect: {
            id: params.aiAgent.id,
          },
        },
        majorVersion: params.payload.versionComponents.major,
        minorVersion: params.payload.versionComponents.minor,
        aiAgentData: params.aiAgent.snapshotData || {},
        aiAgentSettings: aggregatedSettings,
        releaseNotes: params.payload.releaseNotes,
      },
    });

    // Fire webhook to ZappImmo with tenant_id (fire-and-forget)
    this.notifyZappImmo(params, _newDeployment).catch((err) => {
      console.error('[SmythOsDeployer] Webhook notification failed:', err.message);
    });

    return _newDeployment;
  }

  private async notifyZappImmo(params: DeployParams, deployment: any): Promise<void> {
    if (!WEBHOOK_URL || !WEBHOOK_SECRET) return;

    // Resolve tenant_id from team
    const team = await params.tx.team.findFirst({
      where: { id: params.aiAgent.teamId || undefined },
      select: { tenantId: true, name: true },
    });

    // SEC: Validate tenant_id is a UUID before sending
    if (team?.tenantId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(team.tenantId)) {
      console.error('[SmythOsDeployer] Invalid tenant_id format, skipping webhook');
      return;
    }

    // FIX GAP-4.1/4.2: Payload matches ZappImmo receiver expectations
    // Receiver: frontend/src/app/api/connector/workflows-webhook/route.ts
    const payload = {
      event: 'workflow.published' as const,
      workflow_id: params.aiAgent.id,          // receiver expects workflow_id, not agent_id
      name: params.aiAgent.name,               // receiver expects name, not agent_name
      description: '',
      content: params.aiAgent.snapshotData || {},  // receiver expects content (workflow data)
      version: deployment.majorVersion,        // receiver expects number, not string
      tenant_id: team?.tenantId || '',
    };

    const body = JSON.stringify(payload);

    // FIX GAP-4.1: Header must be x-smythos-signature (lowercase, matches receiver)
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');  // receiver expects hex, not base64

    // SEC: Only send to HTTPS in production
    if (process.env.NODE_ENV === 'production' && !WEBHOOK_URL.startsWith('https://')) {
      console.error('[SmythOsDeployer] WEBHOOK_URL must use HTTPS in production');
      return;
    }

    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-smythos-signature': signature,      // matches receiver header name
      },
      body,
    });
  }
}
