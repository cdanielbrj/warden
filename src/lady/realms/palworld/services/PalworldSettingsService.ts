import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { palworldPaths } from "../config/Paths.js";
import {
  getPalworldSettingDefinition,
  type PalworldSettingDefinition,
} from "../config/SettingsRegistry.js";
import {
  parsePalworldSettings,
  type PalworldSettingsDocument,
} from "../config/PalworldSettingsParser.js";
import { PalworldBackupService } from "./PalworldBackupService.js";

export interface PalworldSettingsUpdate {
  readonly backupPath: string;
  readonly value: string;
}

export class PalworldSettingsService {
  constructor(private readonly backups: PalworldBackupService) {}

  async read(): Promise<PalworldSettingsDocument> {
    try {
      const source = await readFile(palworldPaths.settingsFile, "utf8");
      return parsePalworldSettings(source);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to read Palworld settings: ${message}`);
    }
  }

  async update(key: string, value: string): Promise<PalworldSettingsUpdate> {
    const source = await this.readSource();
    const document = parsePalworldSettings(source);
    if (document.get(key) === undefined) {
      throw new Error(`Palworld setting "${key}" was not found in this server.`);
    }

    const definition = getPalworldSettingDefinition(key);
    if (!definition) {
      throw new Error(`Palworld setting "${key}" is not supported.`);
    }

    const updatedValue = formatValue(definition, value);
    const updatedSource = document.set(key, updatedValue).serialize();
    const backup = await this.backups.config();

    const settingsDirectory = dirname(palworldPaths.settingsFile);
    const temporaryFile = join(
      settingsDirectory,
      `.${basename(palworldPaths.settingsFile)}.${process.pid}.${Date.now()}.tmp`,
    );

    try {
      const currentStats = await stat(palworldPaths.settingsFile);
      await writeFile(temporaryFile, updatedSource, {
        encoding: "utf8",
        mode: currentStats.mode,
      });
      await rename(temporaryFile, palworldPaths.settingsFile);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to update Palworld settings: ${message}`);
    }

    return { backupPath: backup.path, value: updatedValue };
  }

  private async readSource(): Promise<string> {
    try {
      return await readFile(palworldPaths.settingsFile, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to read Palworld settings: ${message}`);
    }
  }
}

function formatValue(definition: PalworldSettingDefinition, value: string): string {
  const trimmedValue = value.trim();

  if (definition.kind === "string") {
    return `"${trimmedValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }

  if (definition.kind === "boolean") {
    if (!/^(true|false)$/i.test(trimmedValue)) {
      throw new Error("This Palworld setting only accepts True or False.");
    }

    return trimmedValue.toLowerCase() === "true" ? "True" : "False";
  }

  if (definition.kind === "integer") {
    const number = Number(trimmedValue);
    if (!Number.isInteger(number)) {
      throw new Error("This Palworld setting only accepts an integer.");
    }

    return trimmedValue;
  }

  if (definition.kind === "number") {
    const number = Number(trimmedValue);
    if (!Number.isFinite(number)) {
      throw new Error("This Palworld setting only accepts a finite number.");
    }

    return trimmedValue;
  }

  if (!definition.values?.includes(trimmedValue)) {
    throw new Error(
      `This Palworld setting accepts: ${definition.values?.join(", ")}.`,
    );
  }

  return trimmedValue;
}
