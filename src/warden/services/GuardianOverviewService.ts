import { fetchGuardianStatus } from "../../core/api/guardian/GuardianStatusClient.js";
import { env } from "../../core/config/env.js";
import type {
  GuardianEndpoint,
  GuardianStatus,
} from "../../core/types/GuardianStatus.js";

export interface GuardianOverview {
  readonly endpoint: GuardianEndpoint;
  readonly status?: GuardianStatus;
}

export class GuardianOverviewService {
  async getOverviews(): Promise<readonly GuardianOverview[]> {
    return Promise.all(
      env.guardianEndpoints.map(async (endpoint) => ({
        endpoint,
        status: await this.getStatus(endpoint),
      })),
    );
  }

  private async getStatus(endpoint: GuardianEndpoint): Promise<GuardianStatus | undefined> {
    try {
      return await fetchGuardianStatus(endpoint, env.internalApiToken!);
    } catch {
      return undefined;
    }
  }
}
