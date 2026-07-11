import type { Realm } from "../types/Realm.js";

interface RealmModule {
  createRealm(): Realm;
}

export async function loadRealm(name: string): Promise<Realm> {
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error(`Invalid realm name: ${name}`);
  }

  const realmModule = (await import(
    `../../realms/${name}/index.js`
  )) as RealmModule;

  if (typeof realmModule.createRealm !== "function") {
    throw new Error(`Realm module "${name}" must export createRealm().`);
  }

  return realmModule.createRealm();
}
