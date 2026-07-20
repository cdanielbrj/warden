import { EmbedBuilder, type Client } from "discord.js";
import type { LadyOverview } from "../services/LadyOverviewService.js";

export class ServersEmbedFactory {
  constructor(private readonly client: Client) {}

  async create(overviews: readonly LadyOverview[]): Promise<EmbedBuilder[]> {
    return Promise.all(overviews.map((overview) => this.createLadyEmbed(overview)));
  }

  private async createLadyEmbed(overview: LadyOverview): Promise<EmbedBuilder> {
    const user = await this.client.users.fetch(overview.lady.discordBotId).catch(() => undefined);
    const displayName = user?.globalName ?? user?.username ?? `Lady ${overview.lady.id}`;

    if (!overview.status || overview.status.gameStatus !== "online") {
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle(displayName)
        .setDescription(`${displayName} wellness is unknown.`);

      if (user) embed.setThumbnail(user.displayAvatarURL());
      return embed;
    }

    const { status } = overview;

    const embed = new EmbedBuilder()
      .setColor(status.gameStatus === "online" ? 0x57f287 : 0xed4245)
      .setTitle(displayName)
      .setDescription(`${displayName} is assisting **${status.realm}**.`)
      .addFields(
        {
          name: "Status",
          value: formatPlayers(status.playerNames),
          inline: false,
        },
      );

    if (user) {
      embed.setThumbnail(user.displayAvatarURL());
    }

    return embed;
  }
}

function formatPlayers(playerNames: readonly string[] | undefined): string {
  if (!playerNames || playerNames.length === 0) {
    return "I can see no one near me.";
  }

  const names = playerNames.join(", ");
  return `I can see ${names}.`;
}
