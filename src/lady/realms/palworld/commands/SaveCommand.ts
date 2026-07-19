import { SlashCommandBuilder } from "discord.js";
import {
  completeCommand,
  deferPrivateResponse,
  formatResponse,
} from "../../../../core/services/discord/InteractionResponseService.js";
import type { WardenCommand } from "../../../../core/types/Command.js";
import { requireAdmin } from "../permissions/Admin.js";
import { PalworldRconService } from "../services/PalworldRconService.js";

export function createSaveCommand(
  service: PalworldRconService,
): WardenCommand {
  const resultVisibility = () => "public" as const;

  return {
    data: new SlashCommandBuilder()
      .setName("save")
      .setDescription("Save Palworld world data")
      .setDMPermission(false),

    resultVisibility,

    async execute(interaction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      await deferPrivateResponse(interaction);
      const response = await service.save();
      await completeCommand(
        interaction,
        resultVisibility,
        formatResponse(response, "Save command accepted."),
      );
    },
  };
}
