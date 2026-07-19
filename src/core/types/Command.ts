import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

type CommandBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export type CommandResultVisibility = "private" | "public";
export type CommandResultVisibilityResolver = (
  interaction: ChatInputCommandInteraction,
) => CommandResultVisibility;

export interface WardenCommand {
  readonly data: CommandBuilder;
  readonly resultVisibility: CommandResultVisibilityResolver;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}
