import "dotenv/config";

export function required(name: string): string {
   const value = process.env[name];

   if (!value) {
      throw new Error(`Missing environment variable: ${name}`);
   }

   return value;
}

function optional(name: string): string | undefined {
   const value = process.env[name]?.trim();
   return value || undefined;
}

export function requiredPort(name: string): number {
   const value = required(name);
   const port = Number(value);

   if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      throw new Error(`Invalid port in environment variable: ${name}`);
   }

   return port;
}

function requiredList(name: string): readonly string[] {
   const values = required(name)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

   if (values.length === 0) {
      throw new Error(`Missing environment variable: ${name}`);
   }

   return values;
}

function optionalPort(name: string, fallback: number): number {
   const value = optional(name);
   return value ? requiredPort(name) : fallback;
}

function optionalRole(): "lady" | "master" {
   const role = optional("ROLE") ?? "lady";

   if (role !== "lady" && role !== "master") {
      throw new Error("ROLE must be either lady or master.");
   }

   return role;
}

const role = optionalRole();
const realm = role === "lady" ? required("REALM") : undefined;
const instance = role === "lady" ? optional("INSTANCE") ?? "" : undefined;

export const env = {
   role,
   id: required("ID"),
   realm,
   instance,
   instanceId: realm ? `${realm}${instance}` : undefined,
   discordToken: required("DISCORD_TOKEN"),
   discordClientId: required("DISCORD_CLIENT_ID"),
   discordAdminUserIds: requiredList("DISCORD_ADMIN_USER_IDS"),
   internalApiPort: optionalPort("WARDEN_INTERNAL_API_PORT", 3_000),
   internalApiToken: optional("WARDEN_INTERNAL_API_TOKEN"),
   masterUrl: optional("MASTER_URL") ?? "http://lady-warden:3000",
   dataPath: optional("DATA_PATH") ?? "/data",
};
