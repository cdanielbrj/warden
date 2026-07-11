export type PalworldSettingKind =
  | "boolean"
  | "integer"
  | "number"
  | "string"
  | "enum";

export interface PalworldSettingDefinition {
  readonly key: string;
  readonly kind: PalworldSettingKind;
  readonly values?: readonly string[];
}

const booleanKeys = [
  "RCONEnabled",
  "bActiveUNKO",
  "bAutoResetGuildNoOnlinePlayers",
  "bCanPickupOtherGuildDeathPenaltyDrop",
  "bEnableAimAssistKeyboard",
  "bEnableAimAssistPad",
  "bEnableDefenseOtherGuildPlayer",
  "bEnableFastTravel",
  "bEnableFriendlyFire",
  "bEnableInvaderEnemy",
  "bEnableNonLoginPenalty",
  "bEnablePlayerToPlayerDamage",
  "bExistPlayerAfterLogout",
  "bIsMultiplay",
  "bIsPvP",
  "bIsStartLocationSelectByMap",
  "bUseAuth",
] as const;

const integerKeys = [
  "BaseCampMaxNum",
  "BaseCampWorkerMaxNum",
  "CoopPlayerMaxNum",
  "DropItemMaxNum",
  "DropItemMaxNum_UNKO",
  "GuildPlayerMaxNum",
  "PublicPort",
  "RCONPort",
  "ServerPlayerMaxNum",
] as const;

const numberKeys = [
  "AutoResetGuildTimeNoOnlinePlayers",
  "BuildObjectDamageRate",
  "BuildObjectDeteriorationDamageRate",
  "CollectionDropRate",
  "CollectionObjectHpRate",
  "CollectionObjectRespawnSpeedRate",
  "DayTimeSpeedRate",
  "DropItemAliveMaxHours",
  "EnemyDropItemRate",
  "ExpRate",
  "NightTimeSpeedRate",
  "PalAutoHPRegeneRate",
  "PalAutoHpRegeneRateInSleep",
  "PalCaptureRate",
  "PalDamageRateAttack",
  "PalDamageRateDefense",
  "PalEggDefaultHatchingTime",
  "PalSpawnNumRate",
  "PalStaminaDecreaceRate",
  "PalStomachDecreaceRate",
  "PlayerAutoHPRegeneRate",
  "PlayerAutoHpRegeneRateInSleep",
  "PlayerDamageRateAttack",
  "PlayerDamageRateDefense",
  "PlayerStaminaDecreaceRate",
  "PlayerStomachDecreaceRate",
  "WorkSpeedRate",
] as const;

const stringKeys = [
  "AdminPassword",
  "BanListURL",
  "Difficulty",
  "PublicIP",
  "Region",
  "ServerDescription",
  "ServerName",
  "ServerPassword",
] as const;

export const palworldSettingsRegistry: readonly PalworldSettingDefinition[] = [
  ...booleanKeys.map((key) => ({ key, kind: "boolean" as const })),
  ...integerKeys.map((key) => ({ key, kind: "integer" as const })),
  ...numberKeys.map((key) => ({ key, kind: "number" as const })),
  ...stringKeys.map((key) => ({ key, kind: "string" as const })),
  {
    key: "DeathPenalty",
    kind: "enum",
    values: ["None", "Item", "ItemAndEquipment", "All"],
  },
];

export function getPalworldSettingDefinition(
  key: string,
): PalworldSettingDefinition | undefined {
  return palworldSettingsRegistry.find((setting) => setting.key === key);
}

export function getPalworldSettingValueSuggestions(
  key: string,
): readonly string[] {
  const setting = getPalworldSettingDefinition(key);

  if (!setting) {
    return [];
  }

  if (setting.kind === "boolean") {
    return ["True", "False"];
  }

  return setting.values ?? [];
}
