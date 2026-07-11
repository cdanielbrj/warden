import "dotenv/config";

export function required(name: string): string {
   const value = process.env[name];

   if (!value) {
      throw new Error(`Missing environment variable: ${name}`);
   }

   return value;
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

export const env = {
   guardianName: required("GUARDIAN_NAME"),
   realm: required("REALM"),
   discordToken: required("DISCORD_TOKEN"),
   discordClientId: required("DISCORD_CLIENT_ID"),
   discordAdminUserIds: requiredList("DISCORD_ADMIN_USER_IDS"),
};
