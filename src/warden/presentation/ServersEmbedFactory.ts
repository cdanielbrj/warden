import { EmbedBuilder, type Client } from "discord.js";
import type { GuardianStatus } from "../../core/types/GuardianStatus.js";
import type { GuardianOverview } from "../services/GuardianOverviewService.js";

export class ServersEmbedFactory {
  constructor(private readonly client: Client) {}

  async create(overviews: readonly GuardianOverview[]): Promise<EmbedBuilder[]> {
    return Promise.all(overviews.map((overview) => this.createGuardianEmbed(overview)));
  }

  private async createGuardianEmbed(overview: GuardianOverview): Promise<EmbedBuilder> {
    if (!overview.status) {
      return new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle(overview.endpoint.id)
        .setDescription("Guardian status is unavailable.");
    }

    const { status } = overview;
    const embed = new EmbedBuilder()
      .setColor(status.gameStatus === "online" ? 0x57f287 : 0xed4245)
      .setTitle(status.guardianName)
      .setDescription(`${status.realm} · ${status.targetId}`)
      .addFields(
        {
          name: "Status",
          value: status.gameStatus === "online" ? "Online" : "Offline",
          inline: true,
        },
        {
          name: "Players",
          value: formatPlayers(status.playerNames),
          inline: true,
        },
      )
      .setTimestamp(new Date(status.checkedAt));

    const user = await this.client.users.fetch(status.discordBotId).catch(() => undefined);
    if (user) {
      embed.setThumbnail(user.displayAvatarURL());
    }

    return embed;
  }
}

function formatPlayers(playerNames: readonly string[] | undefined): string {
  if (!playerNames) {
    return "Unavailable";
  }

  if (playerNames.length === 0) {
    return "0";
  }

  const names = playerNames.join(", ");
  return names.length <= 900 ? `${playerNames.length} — ${names}` : String(playerNames.length);
}
