import { Logger } from "../../core/logger/Logger.js";
import type { Realm } from "../../core/types/Realm.js";
import { palworldEnv } from "./config/env.js";
import { verifyRconConnection } from "./services/RconConnection.js";

export function createRealm(): Realm {
  return {
    name: "Palworld",

    async initialize() {
      const target = `${palworldEnv.rconHost}:${palworldEnv.rconPort}`;

      Logger.info(`Testing RCON connection to ${target}.`);
      await verifyRconConnection(
        palworldEnv.rconHost,
        palworldEnv.rconPort,
      );
      Logger.success(`RCON target ${target} is reachable.`);
    },
  };
}
