import type { Client } from "discord.js";
import type { WardenCommand } from "../../core/types/Command.js";
import type { LadyRegistryService } from "../services/LadyRegistryService.js";
import { createServersCommand } from "./ServersCommand.js";
import { createLadyCommand } from "./LadyCommand.js";
import { createSyncCommand } from "./SyncCommand.js";

export function createWardenCommands(client: Client, registry: LadyRegistryService): readonly WardenCommand[] {
  return [createServersCommand(client, registry), createLadyCommand(client, registry), createSyncCommand(registry)];
}
