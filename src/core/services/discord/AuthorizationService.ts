import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { env } from "../../config/env.js";

export function isDiscordAdmin(userId: string): boolean {
  return env.discordAdminUserIds.includes(userId);
}

export async function requireDiscordAdmin(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  if (isDiscordAdmin(interaction.user.id)) {
    return true;
  }

  await interaction.reply({
    content: "You are not authorized to administer this Lady.",
    flags: MessageFlags.Ephemeral,
  });
  return false;
}
