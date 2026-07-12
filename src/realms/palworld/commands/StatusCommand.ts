import { SlashCommandBuilder } from "discord.js";
import {
  completeCommand,
  deferPrivateResponse,
  formatResponse,
} from "../../../core/services/discord/InteractionResponseService.js";
import type { GuardianCommand } from "../../../core/types/Command.js";
import { requireAdmin } from "../permissions/Admin.js";
import { PalworldRconService } from "../services/PalworldRconService.js";

export function createStatusCommand(
  service: PalworldRconService,
): GuardianCommand {
  const resultVisibility = () => "private" as const;

  return {
    data: new SlashCommandBuilder()
      .setName("status")
      .setDescription("Show Palworld server information")
      .setDMPermission(false),

    resultVisibility,

    async execute(interaction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      await deferPrivateResponse(interaction);
      const response = await service.status();
      await completeCommand(
        interaction,
        resultVisibility,
        formatResponse(response, "No server information returned."),
      );
    },
  };
}
