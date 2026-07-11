import type { GuardianCommand } from "./Command.js";

export interface Realm {
  readonly name: string;
  readonly commands: readonly GuardianCommand[];
  initialize(): Promise<void>;
}
