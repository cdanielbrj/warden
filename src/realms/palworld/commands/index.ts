import type { GuardianCommand } from "../../../core/types/Command.js";
import { PalworldRconService } from "../services/PalworldRconService.js";
import { createPlayersCommand } from "./PlayersCommand.js";
import { createSaveCommand } from "./SaveCommand.js";
import { createShutdownCommand } from "./ShutdownCommand.js";
import { createStatusCommand } from "./StatusCommand.js";

export function createPalworldCommands(
  service: PalworldRconService,
): readonly GuardianCommand[] {
  return [
    createStatusCommand(service),
    createPlayersCommand(service),
    createSaveCommand(service),
    createShutdownCommand(service),
  ];
}
