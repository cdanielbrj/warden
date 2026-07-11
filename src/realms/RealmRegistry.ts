import type { Realm } from "../core/types/Realm.js";

interface RealmModule {
  createRealm(): Realm;
}

const realmImporters: Readonly<
  Record<string, () => Promise<RealmModule>>
> = {
  palworld: () => import("./palworld/index.js"),
};

export async function createRegisteredRealm(name: string): Promise<Realm> {
  const importRealm = realmImporters[name];

  if (!importRealm) {
    throw new Error(`Unsupported realm: ${name}`);
  }

  const realmModule = await importRealm();

  if (typeof realmModule.createRealm !== "function") {
    throw new Error(`Realm module "${name}" must export createRealm().`);
  }

  return realmModule.createRealm();
}
