import { createServer } from "node:http";
import { env } from "../../core/config/env.js";
import { Logger } from "../../core/logger/Logger.js";
import { LadyStatusService } from "../services/LadyStatusService.js";
import type { Realm } from "../../core/types/Realm.js";

export async function startLadyStatusServer(realm: Realm): Promise<void> {
  if (!env.internalApiToken) {
    Logger.info("Private Lady status API is disabled until its token is configured.");
    return;
  }

  const statusService = new LadyStatusService(realm);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://lady");
    if (
      request.method !== "GET" ||
      url.pathname !== "/v1/status" ||
      request.headers.authorization !== `Bearer ${env.internalApiToken}`
    ) {
      Logger.warn("Rejected private Lady status request.");
      response.writeHead(request.headers.authorization ? 404 : 401).end();
      return;
    }

    Logger.info("Serving private Lady status request.");
    const status = await statusService.getStatus({
      includePlayers: url.searchParams.get("players") === "true",
    });
    response
      .writeHead(200, { "content-type": "application/json; charset=utf-8" })
      .end(JSON.stringify(status));
    Logger.success(
      `Private Lady status request completed: ${status.gameStatus}${status.playerNames ? ` (${status.playerNames.length} player(s))` : ""}.`,
    );
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(env.internalApiPort, "0.0.0.0", () => {
      server.off("error", reject);
      resolve();
    });
  });

  Logger.success(`Private Lady status API is listening on port ${env.internalApiPort}.`);
}
