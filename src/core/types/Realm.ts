import type { WardenCommand } from "./Command.js";
import type { RealmStatus } from "./LadyStatus.js";

export interface Realm {
  readonly name: string;
  readonly commands: readonly WardenCommand[];
  initialize(): Promise<void>;
  getStatus(): Promise<RealmStatus>;
}
