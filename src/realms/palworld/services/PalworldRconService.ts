import { palworldEnv } from "../config/env.js";
import { RconClient } from "./RconConnection.js";

export class PalworldRconService {
  async status(): Promise<string> {
    return this.execute("Info");
  }

  async players(): Promise<string> {
    return this.execute("ShowPlayers");
  }

  async save(): Promise<string> {
    return this.execute("Save");
  }

  async shutdown(seconds: number, message: string): Promise<string> {
    return this.execute(`Shutdown ${seconds} ${message}`);
  }

  private async execute(command: string): Promise<string> {
    const rcon = await RconClient.connect(
      palworldEnv.rconHost,
      palworldEnv.rconPort,
    );

    try {
      await rcon.authenticate(palworldEnv.rconPassword);
      return await rcon.execute(command);
    } finally {
      rcon.close();
    }
  }
}
