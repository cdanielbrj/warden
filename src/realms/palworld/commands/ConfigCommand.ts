import {
  MessageFlags,
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  completeCommand,
  deferPrivateResponse,
} from "../../../core/services/discord/InteractionResponseService.js";
import type { GuardianCommand } from "../../../core/types/Command.js";
import type { PalworldSetting } from "../config/PalworldSettingsParser.js";
import {
  getPalworldSettingDefinition,
  getPalworldSettingValueSuggestions,
  palworldSettingsRegistry,
} from "../config/SettingsRegistry.js";
import { isAdminUser, requireAdmin } from "../permissions/Admin.js";
import { PalworldSettingsService } from "../services/PalworldSettingsService.js";

const MAX_RESPONSE_LENGTH = 1_800;

export function createConfigCommand(
  service: PalworldSettingsService,
): GuardianCommand {
  return {
    data: new SlashCommandBuilder()
      .setName("config")
      .setDescription("Read Palworld server configuration")
      .setDMPermission(false)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("show")
          .setDescription("Show all Palworld OptionSettings"),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setDescription("Show one Palworld OptionSettings value")
          .addStringOption((option) =>
            option
              .setName("key")
              .setDescription("Exact Palworld setting key")
              .setAutocomplete(true)
              .setRequired(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setDescription("Update one existing Palworld setting")
          .addStringOption((option) =>
            option
              .setName("key")
              .setDescription("Exact Palworld setting key")
              .setAutocomplete(true)
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName("value")
              .setDescription("New setting value")
              .setAutocomplete(true)
              .setRequired(true),
          ),
      ),

    resultVisibility: getConfigResultVisibility,

    async execute(interaction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      await deferPrivateResponse(interaction);
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "set") {
        const key = interaction.options.getString("key", true);
        const value = interaction.options.getString("value", true);
        const update = await service.update(key, value);

        await completeCommand(
          interaction,
          getConfigResultVisibility,
          `${formatSetting({ key, rawValue: update.value })}\nBackup created: ${update.backupPath}\nRestart the server with /shutdown to apply this setting.`,
        );
        return;
      }

      const document = await service.read();

      if (subcommand === "get") {
        const key = interaction.options.getString("key", true);
        const value = document.get(key);

        await completeCommand(
          interaction,
          getConfigResultVisibility,
          value === undefined
            ? `Setting "${key}" was not found.`
            : formatSetting({ key, rawValue: value }),
        );
        return;
      }

      await respondWithSettings(interaction, document.settings);
    },

    async autocomplete(interaction) {
      await respondToConfigAutocomplete(interaction);
    },
  };
}

function getConfigResultVisibility(
  interaction: ChatInputCommandInteraction,
): "private" | "public" {
  return interaction.options.getSubcommand() === "set" ? "public" : "private";
}

async function respondToConfigAutocomplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  if (!isAdminUser(interaction.user.id)) {
    await interaction.respond([]);
    return;
  }

  const focused = interaction.options.getFocused(true);
  const query = String(focused.value).toLowerCase();

  if (focused.name === "key") {
    await interaction.respond(
      palworldSettingsRegistry
        .filter((setting) => setting.key.toLowerCase().includes(query))
        .slice(0, 25)
        .map((setting) => ({
          name: `${setting.key} (${setting.kind})`,
          value: setting.key,
        })),
    );
    return;
  }

  const key = interaction.options.getString("key");
  const definition = key ? getPalworldSettingDefinition(key) : undefined;
  const values = key ? getPalworldSettingValueSuggestions(key) : [];

  await interaction.respond(
    values
      .filter((value) => value.toLowerCase().includes(query))
      .slice(0, 25)
      .map((value) => ({
        name: definition ? `${value} (${definition.kind})` : value,
        value,
      })),
  );
}

async function respondWithSettings(
  interaction: Parameters<GuardianCommand["execute"]>[0],
  settings: readonly PalworldSetting[],
): Promise<void> {
  const responses = splitSettings(settings);
  const [firstResponse, ...remainingResponses] = responses;

  await completeCommand(interaction, getConfigResultVisibility, firstResponse);

  for (const response of remainingResponses) {
    await interaction.followUp({
      content: response,
      flags: MessageFlags.Ephemeral,
    });
  }
}

function splitSettings(settings: readonly PalworldSetting[]): readonly string[] {
  const responses: string[] = [];
  let current = "";

  for (const setting of settings) {
    const line = `${setting.key}=${setting.rawValue}`.replace(
      /```/g,
      "`\u200b``",
    );
    const next = current ? `${current}\n${line}` : line;

    if (next.length <= MAX_RESPONSE_LENGTH) {
      current = next;
      continue;
    }

    if (current) {
      responses.push(formatCodeBlock(current));
      current = "";
    }

    if (line.length <= MAX_RESPONSE_LENGTH) {
      current = line;
      continue;
    }

    for (let index = 0; index < line.length; index += MAX_RESPONSE_LENGTH) {
      responses.push(formatCodeBlock(line.slice(index, index + MAX_RESPONSE_LENGTH)));
    }
  }

  if (current) {
    responses.push(formatCodeBlock(current));
  }

  return responses.length > 0 ? responses : ["No Palworld settings were found."];
}

function formatSetting(setting: PalworldSetting): string {
  return formatCodeBlock(`${setting.key}=${setting.rawValue}`);
}

function formatCodeBlock(content: string): string {
  return `\`\`\`ini\n${content}\n\`\`\``;
}
