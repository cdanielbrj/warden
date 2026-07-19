import type { Realm } from "../../core/types/Realm.js";
import { createRegisteredRealm } from "./RealmRegistry.js";

export async function loadRealm(name: string): Promise<Realm> {
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error(`Invalid realm name: ${name}`);
  }

  return createRegisteredRealm(name);
}
