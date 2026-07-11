import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

type CommandBuilder = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;

export interface GuardianCommand {
  readonly data: CommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
