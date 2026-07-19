import type { GuardianCommand } from "./Command.js";
import type { RealmStatus } from "./GuardianStatus.js";

export interface Realm {
  readonly name: string;
  readonly commands: readonly GuardianCommand[];
  initialize(): Promise<void>;
  getStatus(): Promise<RealmStatus>;
}
