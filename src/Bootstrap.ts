import { MessageFlags } from "discord.js";
import { createWardenCommands } from "./warden/commands/index.js";
import { env } from "./core/config/env.js";
import { Logger } from "./core/logger/Logger.js";
import { loadRealm } from "./lady/realms/RealmLoader.js";
import { startLadyStatusServer } from "./lady/api/LadyStatusServer.js";
import { startMasterRegistryServer } from "./warden/api/MasterRegistryServer.js";
import { startLadyRegistration } from "./lady/services/LadyRegistrationService.js";
import { LadyRegistryService } from "./warden/services/LadyRegistryService.js";
import type { WardenCommand } from "./core/types/Command.js";
import { createDiscordClient } from "./core/bot/Client.js";
import { registerGlobalCommands } from "./core/bot/Commands.js";

export async function bootstrapBot(): Promise<void> {
  if (env.role === "master") {
    await bootstrapMaster();
    return;
  }

  const realm = await loadRealm(env.realm!);
  await realm.initialize();
  await startLadyStatusServer(realm);
  startLadyRegistration();

  const client = createDiscordClient();
  await startDiscordBot(
    client,
    realm.commands,
    `Lady ${env.id} is watching ${env.instanceId}.`,
  );
}

async function bootstrapMaster(): Promise<void> {
  if (!env.internalApiToken) {
    throw new Error("Missing environment variable: WARDEN_INTERNAL_API_TOKEN");
  }

  const client = createDiscordClient();
  const registry = new LadyRegistryService(env.dataPath);
  await startMasterRegistryServer(registry);
  await startDiscordBot(
    client,
    createWardenCommands(client, registry),
    "Master is watching managed Ladies.",
  );
}

async function startDiscordBot(
  client: ReturnType<typeof createDiscordClient>,
  commands: readonly WardenCommand[],
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

    Logger.info(`Discord command /${interaction.commandName} received.`);

    try {
      await command.execute(interaction);
      Logger.info(`Discord command /${interaction.commandName} handled.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Logger.error(
        `Discord command /${interaction.commandName} failed: ${message}`,
      );

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
