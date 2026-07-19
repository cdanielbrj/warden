import { createServer } from "node:http";
import { env } from "../../config/env.js";
import { Logger } from "../../logger/Logger.js";
import { GuardianStatusService } from "../../services/guardian/GuardianStatusService.js";
import type { Realm } from "../../types/Realm.js";

export async function startGuardianStatusServer(realm: Realm): Promise<void> {
  if (!env.guardianId || !env.targetId || !env.internalApiToken) {
    Logger.info("Private Guardian status API is disabled until identity and token are configured.");
    return;
  }

  const statusService = new GuardianStatusService(realm);
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

  Logger.success(`Private Guardian status API is listening on port ${env.internalApiPort}.`);
}
