import { EmbedBuilder, type Client } from "discord.js";
import type { LadyOverview } from "../services/LadyOverviewService.js";

export class ServersEmbedFactory {
  constructor(private readonly client: Client) {}

  async create(overviews: readonly LadyOverview[]): Promise<EmbedBuilder[]> {
    return Promise.all(overviews.map((overview) => this.createLadyEmbed(overview)));
  }

  private async createLadyEmbed(overview: LadyOverview): Promise<EmbedBuilder> {
    if (!overview.status) {
      return new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle(overview.endpoint.id)
        .setDescription("Lady status is unavailable.");
    }

    const { status } = overview;
    const user = await this.client.users.fetch(status.discordBotId).catch(() => undefined);
    const displayName = user?.globalName ?? user?.username ?? `Lady ${status.ladyId}`;

    const embed = new EmbedBuilder()
      .setColor(status.gameStatus === "online" ? 0x57f287 : 0xed4245)
      .setTitle(displayName)
      .setDescription(`${status.realm} · ${status.instanceId}`)
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
