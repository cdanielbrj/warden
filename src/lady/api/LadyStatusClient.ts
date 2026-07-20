import type { LadyEndpoint, LadyStatus } from "../../core/types/LadyStatus.js";
import { Logger } from "../../core/logger/Logger.js";

const STATUS_TIMEOUT_MS = 5_000;

export async function fetchLadyStatus(
  endpoint: LadyEndpoint,
  token: string,
): Promise<LadyStatus> {
  Logger.info(`Requesting status from Lady ${endpoint.id}.`);
  const response = await fetch(`${endpoint.url}/v1/status`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Lady ${endpoint.id} returned HTTP ${response.status}.`);
  }

  const status = (await response.json()) as Partial<LadyStatus>;
  if (
    !status.ladyId ||
    !status.realm ||
    !status.instanceId ||
    !status.discordBotId ||
    !status.gameStatus ||
    !status.checkedAt
  ) {
    throw new Error(`Lady ${endpoint.id} returned an invalid status response.`);
  }

  Logger.success(`Received status from Lady ${endpoint.id}.`);
  return status as LadyStatus;
}
