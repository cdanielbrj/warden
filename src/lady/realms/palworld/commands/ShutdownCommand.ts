import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  completeCommand,
  formatResponse,
} from "../../../../core/services/discord/InteractionResponseService.js";
import type { WardenCommand } from "../../../../core/types/Command.js";
import { requireAdmin } from "../permissions/Admin.js";
import { PalworldRconService } from "../services/PalworldRconService.js";

export function createShutdownCommand(
  service: PalworldRconService,
): WardenCommand {
  const resultVisibility = () => "public" as const;

  return {
    data: new SlashCommandBuilder()
      .setName("shutdown")
      .setDescription("Schedule a graceful Palworld server shutdown")
      .setDMPermission(false)
      .addIntegerOption((option) =>
        option
          .setName("seconds")
          .setDescription("Countdown before shutdown")
          .setRequired(true)
          .setMinValue(10)
          .setMaxValue(3_600),
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("Message shown to connected players")
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(200),
      ),

    resultVisibility,

    async execute(interaction: ChatInputCommandInteraction) {
      if (!(await requireAdmin(interaction))) {
        return;
      }

      const seconds = interaction.options.getInteger("seconds", true);
      const message = interaction.options.getString("message", true);
      const confirmId = `shutdown-confirm:${interaction.id}`;
      const cancelId = `shutdown-cancel:${interaction.id}`;
      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(confirmId)
          .setLabel("Confirm shutdown")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(cancelId)
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({
        content: `Schedule shutdown in ${seconds} seconds with message: ${message}`,
        components: [buttons],
        flags: MessageFlags.Ephemeral,
      });

      const reply = await interaction.fetchReply();
      let confirmation;
      try {
        confirmation = await reply.awaitMessageComponent({
          componentType: ComponentType.Button,
          time: 30_000,
          filter: (button) =>
            button.user.id === interaction.user.id &&
            (button.customId === confirmId || button.customId === cancelId),
        });
      } catch {
        await interaction.editReply({
          content: "Shutdown confirmation expired.",
          components: [],
        });
        return;
      }

      if (confirmation.customId === cancelId) {
        await confirmation.update({
          content: "Shutdown cancelled.",
          components: [],
        });
        return;
      }

      await confirmation.update({
        content: "Scheduling server shutdown...",
        components: [],
      });
      const response = await service.shutdown(seconds, message);
      await completeCommand(
        interaction,
        resultVisibility,
        formatResponse(response, "Shutdown accepted."),
      );
    },
  };
}
