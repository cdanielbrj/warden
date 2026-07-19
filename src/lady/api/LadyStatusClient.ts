import type { LadyEndpoint, LadyStatus } from "../../core/types/LadyStatus.js";

const STATUS_TIMEOUT_MS = 5_000;

export async function fetchLadyStatus(
  endpoint: LadyEndpoint,
  token: string,
): Promise<LadyStatus> {
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

  return status as LadyStatus;
}
