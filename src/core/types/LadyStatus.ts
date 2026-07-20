export type GameServerStatus = "online" | "offline" | "unknown";

export interface RealmStatus {
  readonly gameStatus: GameServerStatus;
  readonly playerNames?: readonly string[];
}

export interface LadyStatus {
  readonly ladyId: string;
  readonly realm: string;
  readonly instanceId: string;
  readonly discordBotId: string;
  readonly gameStatus: GameServerStatus;
  readonly playerNames?: readonly string[];
  readonly diagnostic?: string;
  readonly checkedAt: string;
}

export interface LadyEndpoint {
  readonly id: string;
  readonly url: string;
}
