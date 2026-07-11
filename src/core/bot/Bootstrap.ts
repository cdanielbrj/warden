import { createDiscordClient } from "./Client.js";
import { env } from "../config/env.js";
import { Logger } from "../logger/Logger.js";
import { loadRealm } from "../realms/RealmLoader.js";

export async function bootstrapBot() {
  const realm = await loadRealm(env.realm);
  await realm.initialize();

  const client = createDiscordClient();

  client.once("clientReady", () => {
    Logger.success(`Logged as ${client.user?.tag}`);
    Logger.success(`${env.guardianName} is watching ${realm.name}.`);
  });

  await client.login(env.discordToken);
}
