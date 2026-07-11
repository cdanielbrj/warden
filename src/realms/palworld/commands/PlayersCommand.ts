import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { GuardianCommand } from "../../../core/types/Command.js";
import { requireAdmin } from "../permissions/Admin.js";
import { PalworldRconService } from "../services/PalworldRconService.js";
import { formatResponse } from "./Response.js";

function parseCsvRow(row: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    const nextCharacter = row[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
      continue;
    }

    value += character;
  }

  values.push(value.trim());
  return values;
}

function getPlayerNames(response: string): string[] {
  const rows = response
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvRow);

  if (rows.length < 2) {
    return [];
  }

  const nameIndex = rows[0].findIndex(
    (column) => column.toLowerCase() === "name",
  );
  if (nameIndex < 0) {
    return [];
  }

  return rows
    .slice(1)
    .map((row) => row[nameIndex]?.trim())
    .filter((name): name is string => Boolean(name));
}

export function createPlayersCommand(
  service: PalworldRconService,
): GuardianCommand {
  return {
    data: new SlashCommandBuilder()
      .setName("players")
      .setDescription("List connected Palworld players")
      .setDMPermission(false),

    async execute(interaction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const response = await service.players();
      const players = getPlayerNames(response);

      if (players.length === 0) {
        await interaction.editReply("No players are connected.");
        return;
      }

      await interaction.editReply(formatResponse(players.join("\n"), ""));
    },
  };
}
