import { env } from "../../core/config/env.js";
import { Logger } from "../../core/logger/Logger.js";
import type { LadyStatus } from "../../core/types/LadyStatus.js";
import type { Realm } from "../../core/types/Realm.js";

export class LadyStatusService {
  constructor(private readonly realm: Realm) {}

  async getStatus(): Promise<LadyStatus> {
    try {
      const realmStatus = await this.realm.getStatus();
      return this.createStatus(realmStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Logger.warn(`Lady status check failed: ${message}`);
      return this.createStatus({ gameStatus: "offline" }, message);
    }
  }

  private createStatus(status: {
    readonly gameStatus: LadyStatus["gameStatus"];
    readonly playerNames?: readonly string[];
  }, diagnostic?: string): LadyStatus {
    return {
      ladyId: env.id,
      realm: env.realm!,
      instanceId: env.instanceId!,
      discordBotId: env.discordClientId,
      gameStatus: status.gameStatus,
      playerNames: status.playerNames,
      diagnostic,
      checkedAt: new Date().toISOString(),
    };
  }
}
