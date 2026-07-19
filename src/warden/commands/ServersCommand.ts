import { SlashCommandBuilder, type Client } from "discord.js";
import {
  completeCommandEmbeds,
  deferPrivateResponse,
} from "../../core/services/discord/InteractionResponseService.js";
import { requireDiscordAdmin } from "../../core/services/discord/AuthorizationService.js";
import type { GuardianCommand } from "../../core/types/Command.js";
import { ServersEmbedFactory } from "../presentation/ServersEmbedFactory.js";
import { GuardianOverviewService } from "../services/GuardianOverviewService.js";

export function createServersCommand(client: Client): GuardianCommand {
  const resultVisibility = () => "public" as const;
  const overviewService = new GuardianOverviewService();
  const embedFactory = new ServersEmbedFactory(client);

  return {
    data: new SlashCommandBuilder()
      .setName("servers")
      .setDescription("Show the current status of every managed Guardian")
      .setDMPermission(false),

    resultVisibility,

    async execute(interaction) {
      if (!(await requireDiscordAdmin(interaction))) {
        return;
      }

      await deferPrivateResponse(interaction);
      const overviews = await overviewService.getOverviews();
      const embeds = await embedFactory.create(overviews);

      await completeCommandEmbeds(interaction, resultVisibility, embeds);
    },
  };
}
