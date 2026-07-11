export interface PalworldSetting {
  readonly key: string;
  readonly rawValue: string;
}

export interface PalworldSettingsDocument {
  readonly settings: readonly PalworldSetting[];

  get(key: string): string | undefined;
  set(key: string, rawValue: string): PalworldSettingsDocument;
  serialize(): string;
}

interface ParsedPalworldSetting extends PalworldSetting {
  readonly valueStart: number;
  readonly valueEnd: number;
}

class ParsedPalworldSettingsDocument implements PalworldSettingsDocument {
  constructor(
    readonly settings: readonly ParsedPalworldSetting[],
    private readonly source: string,
    private readonly optionSettingsBodyStart: number,
  ) {}

  get(key: string): string | undefined {
    return this.settings.find((setting) => setting.key === key)?.rawValue;
  }

  set(key: string, rawValue: string): PalworldSettingsDocument {
    if (!rawValue.trim() || /[\r\n]/.test(rawValue)) {
      throw new Error("Palworld setting values must be a single non-empty line.");
    }

    const setting = this.settings.find((candidate) => candidate.key === key);
    if (!setting) {
      throw new Error(`Palworld setting "${key}" was not found.`);
    }

    const valueStart = this.optionSettingsBodyStart + setting.valueStart;
    const valueEnd = this.optionSettingsBodyStart + setting.valueEnd;
    const updatedSource =
      this.source.slice(0, valueStart) +
      rawValue +
      this.source.slice(valueEnd);

    return parsePalworldSettings(updatedSource);
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

  return new ParsedPalworldSettingsDocument(
    parseSettings(body),
    source,
    openingParenthesis + 1,
  );
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

function parseSettings(body: string): readonly ParsedPalworldSetting[] {
  return splitTopLevel(body)
    .map(({ value, start }) => parseSetting(value, start))
    .filter(
      (setting): setting is ParsedPalworldSetting => setting !== undefined,
    );
}

function splitTopLevel(body: string): readonly { value: string; start: number }[] {
  const values: { value: string; start: number }[] = [];
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
      values.push({ value: body.slice(start, index), start });
      start = index + 1;
    }
  }

  values.push({ value: body.slice(start), start });
  return values;
}

function parseSetting(
  value: string,
  start: number,
): ParsedPalworldSetting | undefined {
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

  const valueStart = findFirstNonWhitespace(value, equalsIndex + 1);
  const valueEnd = findLastNonWhitespace(value, valueStart);

  return {
    key,
    rawValue: value.slice(valueStart, valueEnd),
    valueStart: start + valueStart,
    valueEnd: start + valueEnd,
  };
}

function findFirstNonWhitespace(value: string, start: number): number {
  let index = start;

  while (index < value.length && /\s/.test(value[index])) {
    index += 1;
  }

  return index;
}

function findLastNonWhitespace(value: string, start: number): number {
  let index = value.length;

  while (index > start && /\s/.test(value[index - 1])) {
    index -= 1;
  }

  return index;
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
