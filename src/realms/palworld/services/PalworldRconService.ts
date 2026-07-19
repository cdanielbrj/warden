import { palworldEnv } from "../config/env.js";
import type { RealmStatus } from "../../../core/types/GuardianStatus.js";
import { RconClient } from "./RconConnection.js";

export class PalworldRconService {
  async status(): Promise<string> {
    return this.execute("Info");
  }

  async players(): Promise<string> {
    return this.execute("ShowPlayers");
  }

  async playerNames(): Promise<readonly string[]> {
    return parsePlayerNames(await this.players());
  }

  async getStatus(): Promise<RealmStatus> {
    const rcon = await this.connect();

    try {
      await rcon.execute("Info");
      const players = parsePlayerNames(await rcon.execute("ShowPlayers"));
      return { gameStatus: "online", playerNames: players };
    } finally {
      rcon.close();
    }
  }

  async save(): Promise<string> {
    return this.execute("Save");
  }

  async shutdown(seconds: number, message: string): Promise<string> {
    return this.execute(`Shutdown ${seconds} ${message}`);
  }

  private async execute(command: string): Promise<string> {
    const rcon = await this.connect();

    try {
      return await rcon.execute(command);
    } finally {
      rcon.close();
    }
  }

  private async connect(): Promise<RconClient> {
    const rcon = await RconClient.connect(
      palworldEnv.rconHost,
      palworldEnv.rconPort,
    );

    await rcon.authenticate(palworldEnv.rconPassword);
    return rcon;
  }
}

export function parsePlayerNames(response: string): readonly string[] {
  const rows = response
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvRow);

  if (rows.length < 2) {
    return [];
  }

  const nameIndex = rows[0].findIndex(
    (column) => column.toLowerCase() === "name",
  );
  if (nameIndex < 0) {
    return [];
  }

  return rows
    .slice(1)
    .map((row) => row[nameIndex]?.trim())
    .filter((name): name is string => Boolean(name));
}

function parseCsvRow(row: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    const nextCharacter = row[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
      continue;
    }

    value += character;
  }

  values.push(value.trim());
  return values;
}
