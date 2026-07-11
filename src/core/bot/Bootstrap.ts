import { createDiscordClient } from "./Client.js";
import { MessageFlags } from "discord.js";
import { env } from "../config/env.js";
import { Logger } from "../logger/Logger.js";
import { loadRealm } from "../realms/RealmLoader.js";
import { registerGlobalCommands } from "./Commands.js";

export async function bootstrapBot() {
  const realm = await loadRealm(env.realm);
  await realm.initialize();
  await registerGlobalCommands(realm.commands);

  const client = createDiscordClient();

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
      const command = realm.commands.find(
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

    const command = realm.commands.find(
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
    Logger.success(`${env.guardianName} is watching ${realm.name}.`);
  });

  await client.login(env.discordToken);
}
