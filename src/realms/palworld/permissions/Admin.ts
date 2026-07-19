import type { ChatInputCommandInteraction } from "discord.js";
import {
  isDiscordAdmin,
  requireDiscordAdmin,
} from "../../../core/services/discord/AuthorizationService.js";

export function isAdminUser(userId: string): boolean {
  return isDiscordAdmin(userId);
}

export async function requireAdmin(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  return requireDiscordAdmin(interaction);
}
