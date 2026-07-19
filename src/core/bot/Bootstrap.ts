import { MessageFlags } from "discord.js";
import { createWardenCommands } from "../../warden/commands/index.js";
import { env } from "../config/env.js";
import { Logger } from "../logger/Logger.js";
import { loadRealm } from "../realms/RealmLoader.js";
import { startGuardianStatusServer } from "../api/guardian/GuardianStatusServer.js";
import type { GuardianCommand } from "../types/Command.js";
import { createDiscordClient } from "./Client.js";
import { registerGlobalCommands } from "./Commands.js";

export async function bootstrapBot(): Promise<void> {
  if (env.wardenRole === "warden") {
    await bootstrapWarden();
    return;
  }

  const realm = await loadRealm(env.realm!);
  await realm.initialize();
  await startGuardianStatusServer(realm);

  const client = createDiscordClient();
  await startDiscordBot(
    client,
    realm.commands,
    `${env.guardianName} is watching ${realm.name}.`,
  );
}

async function bootstrapWarden(): Promise<void> {
  if (!env.internalApiToken) {
    throw new Error("Missing environment variable: WARDEN_INTERNAL_API_TOKEN");
  }

  const client = createDiscordClient();
  await startDiscordBot(
    client,
    createWardenCommands(client),
    `${env.guardianName} is watching managed Guardians.`,
  );
}

async function startDiscordBot(
  client: ReturnType<typeof createDiscordClient>,
  commands: readonly GuardianCommand[],
  readyMessage: string,
): Promise<void> {
  await registerGlobalCommands(commands);

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
      const command = commands.find(
        (candidate) => candidate.data.name === interaction.commandName,
      );

      if (!command?.autocomplete) {
        await interaction.respond([]);
        return;
      }

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        Logger.error(`Autocomplete ${interaction.commandName} failed: ${message}`);
        await interaction.respond([]);
      }

      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = commands.find(
      (candidate) => candidate.data.name === interaction.commandName,
    );

    if (!command) {
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Logger.error(`Command ${interaction.commandName} failed: ${message}`);

      const response = "Unable to complete that command. Check the Warden logs.";
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(response);
        return;
      }

      await interaction.reply({
        content: response,
        flags: MessageFlags.Ephemeral,
      });
    }
  });

  client.once("clientReady", () => {
    Logger.success(`Logged as ${client.user?.tag}`);
    Logger.success(readyMessage);
  });

  await client.login(env.discordToken);
}
