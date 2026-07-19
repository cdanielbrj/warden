import type { WardenCommand } from "../../../../core/types/Command.js";
import { PalworldBackupService } from "../services/PalworldBackupService.js";
import { PalworldRconService } from "../services/PalworldRconService.js";
import { PalworldSettingsService } from "../services/PalworldSettingsService.js";
import { createBackupCommand } from "./BackupCommand.js";
import { createConfigCommand } from "./ConfigCommand.js";
import { createPlayersCommand } from "./PlayersCommand.js";
import { createSaveCommand } from "./SaveCommand.js";
import { createShutdownCommand } from "./ShutdownCommand.js";
import { createStatusCommand } from "./StatusCommand.js";

export function createPalworldCommands(
  rcon: PalworldRconService,
  settings: PalworldSettingsService,
  backups: PalworldBackupService,
): readonly WardenCommand[] {
  return [
    createStatusCommand(rcon),
    createPlayersCommand(rcon),
    createSaveCommand(rcon),
    createShutdownCommand(rcon),
    createConfigCommand(settings),
    createBackupCommand(backups),
  ];
}
