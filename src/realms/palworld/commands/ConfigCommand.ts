import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { GuardianCommand } from "../../../core/types/Command.js";
import type { PalworldSetting } from "../config/PalworldSettingsParser.js";
import { requireAdmin } from "../permissions/Admin.js";
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
              .setRequired(true),
          ),
      ),

    async execute(interaction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const document = await service.read();
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "get") {
        const key = interaction.options.getString("key", true);
        const value = document.get(key);

        await interaction.editReply(
          value === undefined
            ? `Setting "${key}" was not found.`
            : formatSetting({ key, rawValue: value }),
        );
        return;
      }

      await respondWithSettings(interaction, document.settings);
    },
  };
}

async function respondWithSettings(
  interaction: Parameters<GuardianCommand["execute"]>[0],
  settings: readonly PalworldSetting[],
): Promise<void> {
  const responses = splitSettings(settings);
  const [firstResponse, ...remainingResponses] = responses;

  await interaction.editReply(firstResponse);

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
