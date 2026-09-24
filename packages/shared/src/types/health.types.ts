export type ServiceStatus = 'up' | 'down' | 'unconfigured';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: ServiceStatus;
      latencyMs?: number;
      message?: string;
    };
    redis: {
      status: ServiceStatus;
      latencyMs?: number;
      message?: string;
    };
    websocket: {
      status: ServiceStatus;
      message?: string;
    };
  };
}
