import { Logger } from "../../core/logger/Logger.js";
import type { Realm } from "../../core/types/Realm.js";
import { createPalworldCommands } from "./commands/index.js";
import { palworldEnv } from "./config/env.js";
import { RconClient } from "./services/RconConnection.js";
import { PalworldRconService } from "./services/PalworldRconService.js";
import { PalworldSettingsService } from "./services/PalworldSettingsService.js";

export function createRealm(): Realm {
  const rcon = new PalworldRconService();
  const settings = new PalworldSettingsService();

  return {
    name: "Palworld",
    commands: createPalworldCommands(rcon, settings),

    async initialize() {
      const target = `${palworldEnv.rconHost}:${palworldEnv.rconPort}`;

      Logger.info(`Authenticating RCON connection to ${target}.`);
      const rcon = await RconClient.connect(
        palworldEnv.rconHost,
        palworldEnv.rconPort,
      );

      try {
        await rcon.authenticate(palworldEnv.rconPassword);
        const info = await rcon.execute("Info");
        Logger.success(`RCON authentication succeeded for ${target}.`);

        if (info) {
          Logger.info(`RCON Info: ${info.replace(/\s+/g, " ").trim()}`);
        }
      } finally {
        rcon.close();
      }
    },
  };
}
