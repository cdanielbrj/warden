import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { GuardianCommand } from "../../../core/types/Command.js";
import { requireAdmin } from "../permissions/Admin.js";
import { PalworldRconService } from "../services/PalworldRconService.js";
import { formatResponse } from "./Response.js";

export function createSaveCommand(
  service: PalworldRconService,
): GuardianCommand {
  return {
    data: new SlashCommandBuilder()
      .setName("save")
      .setDescription("Save Palworld world data")
      .setDMPermission(false),

    async execute(interaction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const response = await service.save();
      await interaction.editReply(
        formatResponse(response, "Save command accepted."),
      );
    },
  };
}
