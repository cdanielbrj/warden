import { readFile } from "node:fs/promises";
import {
  parsePalworldSettings,
  type PalworldSettingsDocument,
} from "../config/PalworldSettingsParser.js";

const PALWORLD_SETTINGS_FILE =
  "/data/serverfiles/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini";

export class PalworldSettingsService {
  async read(): Promise<PalworldSettingsDocument> {
    try {
      const source = await readFile(PALWORLD_SETTINGS_FILE, "utf8");
      return parsePalworldSettings(source);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to read Palworld settings: ${message}`);
    }
  }
}
