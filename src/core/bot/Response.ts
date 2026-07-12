import {
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { CommandResultVisibilityResolver } from "../types/Command.js";

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

  await interaction.followUp({ content });
  await interaction.editReply(
    "Command completed. The result was posted in this channel.",
  );
}

export function formatResponse(response: string, fallback: string): string {
  const content = response.trim() || fallback;
  const safeContent = content.replace(/```/g, "`\u200b``").slice(0, 1_800);

  return `\`\`\`\n${safeContent}\n\`\`\``;
}
