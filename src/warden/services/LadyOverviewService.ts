import { fetchLadyStatus } from "../../lady/api/LadyStatusClient.js";
import { env } from "../../core/config/env.js";
import type { LadyRegistryService } from "./LadyRegistryService.js";
import type { LadyEndpoint, LadyStatus } from "../../core/types/LadyStatus.js";

export interface LadyOverview {
  readonly endpoint: LadyEndpoint;
  readonly status?: LadyStatus;
}

export class LadyOverviewService {
  constructor(private readonly registry: LadyRegistryService) {}
  async getOverviews(): Promise<readonly LadyOverview[]> {
    return Promise.all(
      this.registry.list().map(async (lady) => ({
        endpoint: { id: lady.id, url: lady.apiUrl },
        status: await this.getStatus(lady.id, { id: lady.id, url: lady.apiUrl }),
      })),
    );
  }

  async getOverview(id: string): Promise<LadyOverview | undefined> {
    const lady = this.registry.get(id);
    if (!lady) return undefined;
    return { endpoint: { id: lady.id, url: lady.apiUrl }, status: await this.getStatus(lady.id, { id: lady.id, url: lady.apiUrl }) };
  }

  private async getStatus(id: string, endpoint: LadyEndpoint): Promise<LadyStatus | undefined> {
    try {
      const status = await fetchLadyStatus(endpoint, env.internalApiToken!);
      this.registry.markSynced(id);
      return status;
    } catch {
      return undefined;
    }
  }
}
