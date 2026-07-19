import { SlashCommandBuilder } from "discord.js";
import {
  completeCommand,
  deferPrivateResponse,
  formatResponse,
} from "../../../core/services/discord/InteractionResponseService.js";
import type { GuardianCommand } from "../../../core/types/Command.js";
import { requireAdmin } from "../permissions/Admin.js";
import { PalworldRconService } from "../services/PalworldRconService.js";

export function createPlayersCommand(
  service: PalworldRconService,
): GuardianCommand {
  const resultVisibility = () => "private" as const;

  return {
    data: new SlashCommandBuilder()
      .setName("players")
      .setDescription("List connected Palworld players")
      .setDMPermission(false),

    resultVisibility,

    async execute(interaction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      await deferPrivateResponse(interaction);
      const players = await service.playerNames();

      if (players.length === 0) {
        await completeCommand(
          interaction,
          resultVisibility,
          "No players are connected.",
        );
        return;
      }

      await completeCommand(
        interaction,
        resultVisibility,
        formatResponse(players.join("\n"), ""),
      );
    },
  };
}
