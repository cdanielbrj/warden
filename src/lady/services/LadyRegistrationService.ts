import { env } from "../../core/config/env.js";
import { Logger } from "../../core/logger/Logger.js";

const RETRY_DELAY_MS = 10_000;

export function startLadyRegistration(): void {
  if (!env.internalApiToken) { Logger.info("Master registration is disabled until its token is configured."); return; }
  const register = async (): Promise<void> => {
    try {
      Logger.info("Registering Lady with the Master.");
      const response = await fetch(`${env.masterUrl}/v1/lady/register`, { method: "POST", headers: { authorization: `Bearer ${env.internalApiToken}`, "content-type": "application/json" }, body: JSON.stringify({ id: env.id, realm: env.realm, instance: env.instance, instanceId: env.instanceId, discordBotId: env.discordClientId, apiPort: env.internalApiPort }), signal: AbortSignal.timeout(5_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      Logger.success("Registered with the Master.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Logger.warn(`Master registration pending: ${message}`);
      setTimeout(() => void register(), RETRY_DELAY_MS).unref();
    }
  };
  void register();
}
