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
    if (
      request.method !== "GET" ||
      request.url !== "/v1/status" ||
      request.headers.authorization !== `Bearer ${env.internalApiToken}`
    ) {
      response.writeHead(request.headers.authorization ? 404 : 401).end();
      return;
    }

    const status = await statusService.getStatus();
    response
      .writeHead(200, { "content-type": "application/json; charset=utf-8" })
      .end(JSON.stringify(status));
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
