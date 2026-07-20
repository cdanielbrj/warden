import { readFileSync } from "node:fs";
import { env } from "./core/config/env.js";
import { Logger } from "./core/logger/Logger.js";
import { bootstrapBot } from "./Bootstrap.js";

async function main() {
  const identity =
    env.role === "master"
      ? `Master ${env.id}`
      : `Lady ${env.id} for ${env.instanceId}`;

  Logger.info(`Starting ${identity} (build v${getVersion()}).`);

  await bootstrapBot();
}

function getVersion(): string {
  try {
    const packageJson = readFileSync(new URL("../package.json", import.meta.url), "utf8");
    return (JSON.parse(packageJson) as { version?: string }).version ?? "unknown";
  } catch {
    return "unknown";
  }
}

main().catch((error) => {
  Logger.error(error.message);

  process.exit(1);
});
