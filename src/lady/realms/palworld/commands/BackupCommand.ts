import { SlashCommandBuilder } from "discord.js";
import {
  completeCommand,
  deferPrivateResponse,
} from "../../../../core/services/discord/InteractionResponseService.js";
import type { WardenCommand } from "../../../../core/types/Command.js";
import { requireAdmin } from "../permissions/Admin.js";
import { PalworldBackupService } from "../services/PalworldBackupService.js";

export function createBackupCommand(
  service: PalworldBackupService,
): WardenCommand {
  const resultVisibility = () => "public" as const;

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

    resultVisibility,

    async execute(interaction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      await deferPrivateResponse(interaction);
      const subcommand = interaction.options.getSubcommand();
      const backup =
        subcommand === "config"
          ? await service.config()
          : await service.world();

      await completeCommand(
        interaction,
        resultVisibility,
        `Backup created: ${backup.path}`,
      );
    },
  };
}
