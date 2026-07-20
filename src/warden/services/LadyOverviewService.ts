import { fetchLadyStatus } from "../../lady/api/LadyStatusClient.js";
import { env } from "../../core/config/env.js";
import { Logger } from "../../core/logger/Logger.js";
import type { LadyRegistryService } from "./LadyRegistryService.js";
import type { LadyEndpoint, LadyStatus } from "../../core/types/LadyStatus.js";
import type { RegisteredLady } from "./LadyRegistryService.js";

export interface LadyOverview {
  readonly endpoint: LadyEndpoint;
  readonly lady: RegisteredLady;
  readonly status?: LadyStatus;
}

export class LadyOverviewService {
  constructor(private readonly registry: LadyRegistryService) {}
  async getOverviews(): Promise<readonly LadyOverview[]> {
    return Promise.all(
      this.registry.list().map(async (lady) => ({
        lady,
        endpoint: { id: lady.id, url: lady.apiUrl },
        status: await this.getStatus(lady.id, { id: lady.id, url: lady.apiUrl }),
      })),
    );
  }

  async getOverview(id: string): Promise<LadyOverview | undefined> {
    const lady = this.registry.get(id);
    if (!lady) return undefined;
    return { lady, endpoint: { id: lady.id, url: lady.apiUrl }, status: await this.getStatus(lady.id, { id: lady.id, url: lady.apiUrl }) };
  }

  private async getStatus(id: string, endpoint: LadyEndpoint): Promise<LadyStatus | undefined> {
    try {
      const status = await fetchLadyStatus(endpoint, env.internalApiToken!);
      this.registry.markSynced(id);
      if (status.gameStatus === "offline") {
        Logger.warn(`Lady ${id} reported an unavailable status: ${status.diagnostic ?? "No diagnostic provided."}`);
      }
      return status;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Logger.warn(`Unable to query Lady ${id}: ${message}`);
      return undefined;
    }
  }
}
