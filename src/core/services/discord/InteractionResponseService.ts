import {
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { CommandResultVisibilityResolver } from "../../types/Command.js";

export async function deferPrivateResponse(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
}

export async function completeCommand(
  interaction: ChatInputCommandInteraction,
  resultVisibility: CommandResultVisibilityResolver,
  content: string,
): Promise<void> {
  if (resultVisibility(interaction) === "private") {
    await interaction.editReply(content);
    return;
  }

  if (!interaction.channel?.isSendable()) {
    throw new Error("Unable to publish command result: interaction channel is unavailable.");
  }

  await interaction.channel.send({ content });
  await interaction.deleteReply();
}

export async function completeCommandEmbeds(
  interaction: ChatInputCommandInteraction,
  resultVisibility: CommandResultVisibilityResolver,
  embeds: EmbedBuilder[],
): Promise<void> {
  if (resultVisibility(interaction) === "private") {
    await interaction.editReply({ embeds });
    return;
  }

  if (!interaction.channel?.isSendable()) {
    throw new Error("Unable to publish command result: interaction channel is unavailable.");
  }

  await interaction.channel.send({ embeds });
  await interaction.deleteReply();
}

export function formatResponse(response: string, fallback: string): string {
  const content = response.trim() || fallback;
  const safeContent = content.replace(/```/g, "`\u200b``").slice(0, 1_800);

  return `\`\`\`\n${safeContent}\n\`\`\``;
}
