import { Logger } from "./core/logger/Logger.js";
import { bootstrapBot } from "./Bootstrap.js";

async function main() {
  Logger.info("Starting Warden...");

  await bootstrapBot();
}

main().catch((error) => {
  Logger.error(error.message);

  process.exit(1);
});
