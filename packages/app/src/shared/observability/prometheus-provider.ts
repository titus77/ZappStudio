/**
 * Prometheus Observability Provider for ZappStudio
 *
 * Replaces PostHog analytics with our own telemetry endpoint.
 * Events are sent to POST /api/telemetry which exposes them as
 * Prometheus metrics on the middleware's /metrics endpoint.
 *
 * Grafana dashboards can then visualize:
 * - zs_agent_created_total (counter)
 * - zs_workflow_executed_total (counter)
 * - zs_debug_session_total (counter)
 * - zs_deployment_total{status} (counter)
 * - zs_active_users (gauge, via identify/clear)
 */

import type {
  IObservabilityProvider,
  ObservabilityEventProperties,
  UserIdentityContext,
} from './types';

const TELEMETRY_ENDPOINT = '/api/telemetry';
const BATCH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 50;

interface TelemetryEvent {
  event: string;
  properties?: ObservabilityEventProperties;
  timestamp: number;
  userId?: string;
}

export class PrometheusObservabilityProvider implements IObservabilityProvider {
  private eventBatch: TelemetryEvent[] = [];
  private userId: string | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Flush events periodically
    this.flushTimer = setInterval(() => this.flush(), BATCH_INTERVAL_MS);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  observeInteraction(eventName: string, properties?: ObservabilityEventProperties): void {
    this.eventBatch.push({
      event: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.userId ?? undefined,
    });

    if (this.eventBatch.length >= MAX_BATCH_SIZE) {
      this.flush();
    }
  }

  identifyUser(context: UserIdentityContext): void {
    this.userId = context.userId;
    this.observeInteraction('user_identified', {
      userId: context.userId,
      ...context.properties,
    });
  }

  setUserProperties(properties: ObservabilityEventProperties): void {
    this.observeInteraction('user_properties_set', properties);
  }

  clearUserIdentity(): void {
    this.userId = null;
  }

  // Feature flags are not supported via Prometheus — return defaults
  getFeatureFlag(_featureName: string): string | boolean | undefined {
    return undefined;
  }

  isFeatureEnabled(_featureName: string): boolean {
    return false;
  }

  getFeatureFlagPayload(_featureName: string): unknown {
    return undefined;
  }

  reloadFeatureFlags(): void {
    // No-op — feature flags managed via ZappImmo billing plans
  }

  onFeatureFlagsReady(callback: () => void): void {
    callback();
  }

  private flush(): void {
    if (this.eventBatch.length === 0) return;

    const batch = this.eventBatch.splice(0, MAX_BATCH_SIZE);

    // Fire-and-forget POST to telemetry endpoint
    if (typeof fetch !== 'undefined') {
      fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      }).catch(() => {
        // Silently ignore telemetry failures
      });
    }
  }
}
