export interface PalworldSetting {
  readonly key: string;
  readonly rawValue: string;
}

export interface PalworldSettingsDocument {
  readonly settings: readonly PalworldSetting[];

  get(key: string): string | undefined;
  serialize(): string;
}

class ParsedPalworldSettingsDocument implements PalworldSettingsDocument {
  constructor(
    readonly settings: readonly PalworldSetting[],
    private readonly source: string,
  ) {}

  get(key: string): string | undefined {
    return this.settings.find((setting) => setting.key === key)?.rawValue;
  }

  serialize(): string {
    return this.source;
  }
}

export function parsePalworldSettings(source: string): PalworldSettingsDocument {
  const optionSettingsMatch = /OptionSettings\s*=\s*/.exec(source);

  if (!optionSettingsMatch || optionSettingsMatch.index === undefined) {
    throw new Error("PalWorldSettings.ini does not contain OptionSettings.");
  }

  const openingParenthesis = optionSettingsMatch.index + optionSettingsMatch[0].length;
  if (source[openingParenthesis] !== "(") {
    throw new Error("OptionSettings must begin with an opening parenthesis.");
  }

  const closingParenthesis = findClosingParenthesis(source, openingParenthesis);
  const body = source.slice(openingParenthesis + 1, closingParenthesis);

  return new ParsedPalworldSettingsDocument(parseSettings(body), source);
}

function findClosingParenthesis(source: string, openingParenthesis: number): number {
  let depth = 0;
  let quoted = false;

  for (let index = openingParenthesis; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === "\\") {
        index += 1;
      } else if (character === '"') {
        quoted = false;
      }

      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error("OptionSettings has an unmatched opening parenthesis.");
}

function parseSettings(body: string): readonly PalworldSetting[] {
  return splitTopLevel(body)
    .map(parseSetting)
    .filter((setting): setting is PalworldSetting => setting !== undefined);
}

function splitTopLevel(body: string): readonly string[] {
  const values: string[] = [];
  let start = 0;
  let depth = 0;
  let quoted = false;

  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];

    if (quoted) {
      if (character === "\\") {
        index += 1;
      } else if (character === '"') {
        quoted = false;
      }

      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
    } else if (character === "," && depth === 0) {
      values.push(body.slice(start, index));
      start = index + 1;
    }
  }

  values.push(body.slice(start));
  return values;
}

function parseSetting(value: string): PalworldSetting | undefined {
  const equalsIndex = findTopLevelEquals(value);

  if (equalsIndex < 0) {
    if (value.trim()) {
      throw new Error(`Invalid OptionSettings entry: ${value.trim()}`);
    }

    return undefined;
  }

  const key = value.slice(0, equalsIndex).trim();
  if (!key) {
    throw new Error("OptionSettings contains an entry without a key.");
  }

  return {
    key,
    rawValue: value.slice(equalsIndex + 1).trim(),
  };
}

function findTopLevelEquals(value: string): number {
  let depth = 0;
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (quoted) {
      if (character === "\\") {
        index += 1;
      } else if (character === '"') {
        quoted = false;
      }

      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
    } else if (character === "=" && depth === 0) {
      return index;
    }
  }

  return -1;
}
