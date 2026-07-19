import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

export interface RegisteredLady {
  readonly id: string;
  readonly realm: string;
  readonly instance: string;
  readonly instanceId: string;
  readonly discordBotId: string;
  readonly apiUrl: string;
  readonly registeredAt: string;
  readonly syncedAt?: string;
}

export class LadyRegistryService {
  private readonly database: DatabaseSync;

  constructor(dataPath: string) {
    mkdirSync(dataPath, { recursive: true });
    this.database = new DatabaseSync(join(dataPath, "warden.sqlite"));
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS ladies (
        id TEXT PRIMARY KEY,
        realm TEXT NOT NULL,
        instance TEXT NOT NULL,
        instance_id TEXT NOT NULL,
        discord_bot_id TEXT NOT NULL,
        api_url TEXT NOT NULL,
        registered_at TEXT NOT NULL,
        synced_at TEXT
      ) STRICT
    `);
  }

  register(lady: Omit<RegisteredLady, "registeredAt" | "syncedAt">): void {
    const now = new Date().toISOString();
    this.database
      .prepare(`
        INSERT INTO ladies (id, realm, instance, instance_id, discord_bot_id, api_url, registered_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          realm = excluded.realm,
          instance = excluded.instance,
          instance_id = excluded.instance_id,
          discord_bot_id = excluded.discord_bot_id,
          api_url = excluded.api_url,
          registered_at = excluded.registered_at
      `)
      .run(lady.id, lady.realm, lady.instance, lady.instanceId, lady.discordBotId, lady.apiUrl, now);
  }

  list(): readonly RegisteredLady[] {
    return this.database
      .prepare(`SELECT id, realm, instance, instance_id, discord_bot_id, api_url, registered_at, synced_at FROM ladies ORDER BY id`)
      .all()
      .map((row) => this.toLady(row as Record<string, string | null>));
  }

  get(id: string): RegisteredLady | undefined {
    const row = this.database
      .prepare(`SELECT id, realm, instance, instance_id, discord_bot_id, api_url, registered_at, synced_at FROM ladies WHERE id = ?`)
      .get(id) as Record<string, string | null> | undefined;
    return row ? this.toLady(row) : undefined;
  }

  markSynced(id: string): void {
    this.database.prepare(`UPDATE ladies SET synced_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
  }

  private toLady(row: Record<string, string | null>): RegisteredLady {
    return {
      id: row.id!, realm: row.realm!, instance: row.instance!, instanceId: row.instance_id!,
      discordBotId: row.discord_bot_id!, apiUrl: row.api_url!, registeredAt: row.registered_at!,
      syncedAt: row.synced_at ?? undefined,
    };
  }
}
