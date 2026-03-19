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

    const payload = {
      event: 'workflow.published',
      agent_id: params.aiAgent.id,
      agent_name: params.aiAgent.name,
      team_id: params.aiAgent.teamId,
      tenant_id: team?.tenantId || null,
      version: `${deployment.majorVersion}.${deployment.minorVersion}`,
      release_notes: deployment.releaseNotes,
      deployed_at: new Date().toISOString(),
    };

    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'workflow.published',
      },
      body,
    });
  }
}
