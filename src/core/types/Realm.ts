import type { WardenCommand } from "./Command.js";
import type { RealmStatus } from "./LadyStatus.js";

export interface RealmStatusOptions {
  readonly includePlayers?: boolean;
}

export interface Realm {
  readonly name: string;
  readonly commands: readonly WardenCommand[];
  initialize(): Promise<void>;
  getStatus(options?: RealmStatusOptions): Promise<RealmStatus>;
}
