import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { GuardianCommand } from "../../../core/types/Command.js";
import { requireAdmin } from "../permissions/Admin.js";
import { PalworldBackupService } from "../services/PalworldBackupService.js";

export function createBackupCommand(
  service: PalworldBackupService,
): GuardianCommand {
  return {
    data: new SlashCommandBuilder()
      .setName("backup")
      .setDescription("Create a Palworld backup")
      .setDMPermission(false)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("config")
          .setDescription("Back up PalWorldSettings.ini"),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("world")
          .setDescription("Save and back up all Palworld world data"),
      ),

    async execute(interaction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const subcommand = interaction.options.getSubcommand();
      const backup =
        subcommand === "config"
          ? await service.config()
          : await service.world();

      await interaction.editReply(`Backup created: ${backup.path}`);
    },
  };
}
