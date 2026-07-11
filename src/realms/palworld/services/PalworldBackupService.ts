import { cp, mkdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { palworldPaths } from "../config/Paths.js";
import { PalworldRconService } from "./PalworldRconService.js";

export interface PalworldBackup {
  readonly path: string;
}

export class PalworldBackupService {
  constructor(private readonly rcon: PalworldRconService) {}

  async config(): Promise<PalworldBackup> {
    const backupDirectory = await this.createBackupDirectory("config");
    const backupName = `${basename(palworldPaths.settingsFile, ".ini")}.${timestamp()}.ini`;
    const backupPath = join(backupDirectory, backupName);

    try {
      await cp(palworldPaths.settingsFile, backupPath, {
        errorOnExist: true,
        force: false,
        preserveTimestamps: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to create Palworld configuration backup: ${message}`);
    }

    return { path: `config/${backupName}` };
  }

  async world(): Promise<PalworldBackup> {
    const backupDirectory = await this.createBackupDirectory("world");
    const backupName = timestamp();
    const backupPath = join(backupDirectory, backupName);

    await this.rcon.save();

    try {
      await cp(palworldPaths.saveGamesDirectory, backupPath, {
        recursive: true,
        errorOnExist: true,
        force: false,
        preserveTimestamps: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to create Palworld world backup: ${message}`);
    }

    return { path: `world/${backupName}` };
  }

  private async createBackupDirectory(kind: "config" | "world"): Promise<string> {
    try {
      const backupRoot = await stat(palworldPaths.backupDirectory);
      if (!backupRoot.isDirectory()) {
        throw new Error("Backup root is not a directory.");
      }

      const backupDirectory = join(palworldPaths.backupDirectory, kind);
      await mkdir(backupDirectory, { recursive: true });
      return backupDirectory;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to access Palworld backup directory: ${message}`);
    }
  }
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
