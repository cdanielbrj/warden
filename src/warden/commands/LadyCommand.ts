import { SlashCommandBuilder, type Client } from "discord.js";
import { requireDiscordAdmin } from "../../core/services/discord/AuthorizationService.js";
import { completeCommandEmbeds, deferPrivateResponse } from "../../core/services/discord/InteractionResponseService.js";
import type { LadyRegistryService } from "../services/LadyRegistryService.js";
import type { WardenCommand } from "../../core/types/Command.js";
import { ServersEmbedFactory } from "../presentation/ServersEmbedFactory.js";
import { LadyOverviewService } from "../services/LadyOverviewService.js";

export function createLadyCommand(client: Client, registry: LadyRegistryService): WardenCommand {
  const visibility = () => "public" as const;
  const overviews = new LadyOverviewService(registry);
  const embeds = new ServersEmbedFactory(client);
  return { data: new SlashCommandBuilder().setName("lady").setDescription("Show one managed Lady").addStringOption((option) => option.setName("id").setDescription("Lady ID").setRequired(true).setAutocomplete(true)).setDMPermission(false), resultVisibility: visibility,
    async autocomplete(interaction) { const query = interaction.options.getFocused().toLowerCase(); await interaction.respond(registry.list().filter((lady) => lady.id.includes(query)).slice(0, 25).map((lady) => ({ name: lady.id, value: lady.id }))); },
    async execute(interaction) { if (!(await requireDiscordAdmin(interaction))) return; await deferPrivateResponse(interaction); const overview = await overviews.getOverview(interaction.options.getString("id", true)); if (!overview) { await interaction.editReply("Lady is not registered."); return; } await completeCommandEmbeds(interaction, visibility, await embeds.create([overview])); },
  };
}
