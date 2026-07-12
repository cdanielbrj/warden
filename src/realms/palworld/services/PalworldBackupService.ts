import { basename } from "node:path";
import {
  BackupStorageService,
  type StoredBackup,
} from "../../../core/services/storage/BackupStorageService.js";
import { palworldPaths } from "../config/Paths.js";
import { PalworldRconService } from "./PalworldRconService.js";

export class PalworldBackupService {
  constructor(
    private readonly rcon: PalworldRconService,
    private readonly storage: BackupStorageService,
  ) {}

  async config(): Promise<StoredBackup> {
    const backupName = `${basename(palworldPaths.settingsFile, ".ini")}.${timestamp()}.ini`;

    try {
      return await this.storage.copy({
        category: "config",
        name: backupName,
        sourcePath: palworldPaths.settingsFile,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to create Palworld configuration backup: ${message}`);
    }
  }

  async world(): Promise<StoredBackup> {
    const backupName = timestamp();

    await this.rcon.save();

    try {
      return await this.storage.copy({
        category: "world",
        name: backupName,
        recursive: true,
        sourcePath: palworldPaths.saveGamesDirectory,
        filter: (source) => basename(source) !== "backup",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to create Palworld world backup: ${message}`);
    }
  }
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
