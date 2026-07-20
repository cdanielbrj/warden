import { SlashCommandBuilder, type Client } from "discord.js";
import {
  completeCommandEmbeds,
  deferPrivateResponse,
} from "../../core/services/discord/InteractionResponseService.js";
import { requireDiscordAdmin } from "../../core/services/discord/AuthorizationService.js";
import type { WardenCommand } from "../../core/types/Command.js";
import { ServersEmbedFactory } from "../presentation/ServersEmbedFactory.js";
import { LadyOverviewService } from "../services/LadyOverviewService.js";
import type { LadyRegistryService } from "../services/LadyRegistryService.js";

export function createServersCommand(client: Client, registry: LadyRegistryService): WardenCommand {
  const resultVisibility = () => "public" as const;
  const overviewService = new LadyOverviewService(registry);
  const embedFactory = new ServersEmbedFactory(client);

  return {
    data: new SlashCommandBuilder()
      .setName("servers")
      .setDescription("Show the current status of every managed Lady")
      .setDMPermission(false),

    resultVisibility,

    async execute(interaction) {
      if (!(await requireDiscordAdmin(interaction))) {
        return;
      }

      await deferPrivateResponse(interaction);
      const overviews = await overviewService.getOverviews({
        includePlayers: true,
      });
      const embeds = await embedFactory.create(overviews);

      await completeCommandEmbeds(interaction, resultVisibility, embeds);
    },
  };
}
