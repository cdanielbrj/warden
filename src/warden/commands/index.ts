import type { Client } from "discord.js";
import type { GuardianCommand } from "../../core/types/Command.js";
import { createServersCommand } from "./ServersCommand.js";

export function createWardenCommands(client: Client): readonly GuardianCommand[] {
  return [createServersCommand(client)];
}
