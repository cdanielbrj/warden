import { createServer } from "node:http";
import { env } from "../../core/config/env.js";
import { Logger } from "../../core/logger/Logger.js";
import { LadyRegistryService } from "../services/LadyRegistryService.js";

interface LadyRegistration {
  readonly id: string;
  readonly realm: string;
  readonly instance: string;
  readonly instanceId: string;
  readonly discordBotId: string;
  readonly apiPort: number;
}

export async function startMasterRegistryServer(registry: LadyRegistryService): Promise<void> {
  if (!env.internalApiToken) throw new Error("Missing environment variable: WARDEN_INTERNAL_API_TOKEN");
  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/v1/lady/register" || request.headers.authorization !== `Bearer ${env.internalApiToken}`) {
      Logger.warn("Rejected Lady registration request.");
      response.writeHead(request.headers.authorization ? 404 : 401).end(); return;
    }
    try {
      Logger.info("Receiving Lady registration request.");
      const registration = await readRegistration(request);
      const address = request.socket.remoteAddress?.replace(/^::ffff:/, "");
      if (!address) throw new Error("Missing source address.");
      registry.register({ ...registration, apiUrl: `http://${address}:${registration.apiPort}` });
      Logger.success(`Detected Lady ${registration.id} for ${registration.instanceId}.`);
      response.writeHead(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid registration.";
      Logger.warn(`Lady registration failed: ${message}`);
      response.writeHead(400).end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(env.internalApiPort, "0.0.0.0", () => { server.off("error", reject); resolve(); });
  });
  Logger.success(`Master registry API is listening on port ${env.internalApiPort}.`);
}

async function readRegistration(request: import("node:http").IncomingMessage): Promise<LadyRegistration> {
  const body = await new Promise<string>((resolve, reject) => { let value = ""; request.on("data", (chunk) => { value += chunk; }); request.on("end", () => resolve(value)); request.on("error", reject); });
  const value = JSON.parse(body) as Partial<LadyRegistration>;
  if (!value.id || !value.realm || value.instance === undefined || !value.instanceId || !value.discordBotId || !Number.isInteger(value.apiPort)) throw new Error("Incomplete registration.");
  return value as LadyRegistration;
}
