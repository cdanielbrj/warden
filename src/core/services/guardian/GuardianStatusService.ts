import { env } from "../../config/env.js";
import { Logger } from "../../logger/Logger.js";
import type { GuardianStatus } from "../../types/GuardianStatus.js";
import type { Realm } from "../../types/Realm.js";

export class GuardianStatusService {
  constructor(private readonly realm: Realm) {}

  async getStatus(): Promise<GuardianStatus> {
    try {
      const realmStatus = await this.realm.getStatus();
      return this.createStatus(realmStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Logger.warn(`Guardian status check failed: ${message}`);
      return this.createStatus({ gameStatus: "offline" });
    }
  }

  private createStatus(status: {
    readonly gameStatus: GuardianStatus["gameStatus"];
    readonly playerNames?: readonly string[];
  }): GuardianStatus {
    return {
      guardianId: env.guardianId!,
      guardianName: env.guardianName,
      realm: env.realm!,
      targetId: env.targetId!,
      discordBotId: env.discordClientId,
      gameStatus: status.gameStatus,
      playerNames: status.playerNames,
      checkedAt: new Date().toISOString(),
    };
  }
}
