import { Logger } from "../../core/logger/Logger.js";
import type { Realm } from "../../core/types/Realm.js";
import { palworldEnv } from "./config/env.js";

export function createRealm(): Realm {
  return {
    name: "Palworld",

    async initialize() {
      Logger.info(
        `Loaded Palworld realm for RCON target ${palworldEnv.rconHost}:${palworldEnv.rconPort}.`,
      );
    },
  };
}
