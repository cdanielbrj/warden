import { REST, Routes } from "discord.js";
import { env } from "../config/env.js";
import { Logger } from "../logger/Logger.js";
import type { WardenCommand } from "../types/Command.js";

export async function registerGlobalCommands(
  commands: readonly WardenCommand[],
): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(env.discordToken);

  Logger.info(`Registering ${commands.length} global Discord command(s).`);
  await rest.put(Routes.applicationCommands(env.discordClientId), {
    body: commands.map((command) => command.data.toJSON()),
  });

  Logger.success(`Registered ${commands.length} global Discord command(s).`);
}
