export type GameServerStatus = "online" | "offline" | "unknown";

export interface RealmStatus {
  readonly gameStatus: GameServerStatus;
  readonly playerNames?: readonly string[];
}

export interface GuardianStatus {
  readonly guardianId: string;
  readonly guardianName: string;
  readonly realm: string;
  readonly targetId: string;
  readonly discordBotId: string;
  readonly gameStatus: GameServerStatus;
  readonly playerNames?: readonly string[];
  readonly checkedAt: string;
}

export interface GuardianEndpoint {
  readonly id: string;
  readonly url: string;
}
