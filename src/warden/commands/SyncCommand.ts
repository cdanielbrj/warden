import { SlashCommandBuilder } from "discord.js";
import { requireDiscordAdmin } from "../../core/services/discord/AuthorizationService.js";
import { completeCommand, deferPrivateResponse } from "../../core/services/discord/InteractionResponseService.js";
import type { LadyRegistryService } from "../services/LadyRegistryService.js";
import type { WardenCommand } from "../../core/types/Command.js";
import { LadyOverviewService } from "../services/LadyOverviewService.js";

export function createSyncCommand(registry: LadyRegistryService): WardenCommand {
  const visibility = () => "public" as const;
  const overviews = new LadyOverviewService(registry);
  return { data: new SlashCommandBuilder().setName("sync").setDescription("Synchronize the registered Ladies").setDMPermission(false), resultVisibility: visibility,
    async execute(interaction) { if (!(await requireDiscordAdmin(interaction))) return; await deferPrivateResponse(interaction); const results = await overviews.getOverviews(); const online = results.filter((result) => result.status).length; await completeCommand(interaction, visibility, `Synchronized ${online}/${results.length} registered Ladies.`); },
  };
}
