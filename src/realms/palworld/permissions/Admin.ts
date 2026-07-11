import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { env } from "../../../core/config/env.js";

export function isAdminUser(userId: string): boolean {
  return env.discordAdminUserIds.includes(userId);
}

export async function requireAdmin(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  if (isAdminUser(interaction.user.id)) {
    return true;
  }

  await interaction.reply({
    content: "You are not authorized to administer this Guardian.",
    flags: MessageFlags.Ephemeral,
  });
  return false;
}
