import type {
  GuardianEndpoint,
  GuardianStatus,
} from "../../types/GuardianStatus.js";

const STATUS_TIMEOUT_MS = 5_000;

export async function fetchGuardianStatus(
  endpoint: GuardianEndpoint,
  token: string,
): Promise<GuardianStatus> {
  const response = await fetch(`${endpoint.url}/v1/status`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Guardian ${endpoint.id} returned HTTP ${response.status}.`);
  }

  const status = (await response.json()) as Partial<GuardianStatus>;
  if (
    !status.guardianId ||
    !status.guardianName ||
    !status.realm ||
    !status.targetId ||
    !status.discordBotId ||
    !status.gameStatus ||
    !status.checkedAt
  ) {
    throw new Error(`Guardian ${endpoint.id} returned an invalid status response.`);
  }

  return status as GuardianStatus;
}
