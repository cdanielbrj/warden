import "dotenv/config";
import type { GuardianEndpoint } from "../types/GuardianStatus.js";

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

function optionalRole(): "guardian" | "warden" {
   const role = optional("WARDEN_ROLE") ?? "guardian";

   if (role !== "guardian" && role !== "warden") {
      throw new Error("WARDEN_ROLE must be either guardian or warden.");
   }

   return role;
}

function guardianEndpoints(): readonly GuardianEndpoint[] {
   const value = required("WARDEN_GUARDIANS");

   return value.split(",").map((entry) => {
      const [id, url, ...rest] = entry.trim().split("=");
      if (!id || !url || rest.length > 0) {
         throw new Error("WARDEN_GUARDIANS entries must use guardian-id=https://host:port.");
      }

      try {
         const parsedUrl = new URL(url);
         if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            throw new Error("Unsupported protocol.");
         }
      } catch {
         throw new Error(`Invalid WARDEN_GUARDIANS URL for ${id}.`);
      }

      return { id, url: url.replace(/\/$/, "") };
   });
}

const wardenRole = optionalRole();

export const env = {
   wardenRole,
   guardianName: required("GUARDIAN_NAME"),
   realm: wardenRole === "guardian" ? required("REALM") : undefined,
   discordToken: required("DISCORD_TOKEN"),
   discordClientId: required("DISCORD_CLIENT_ID"),
   discordAdminUserIds: requiredList("DISCORD_ADMIN_USER_IDS"),
   guardianId: optional("GUARDIAN_ID"),
   targetId: optional("TARGET_ID"),
   internalApiPort: optionalPort("WARDEN_INTERNAL_API_PORT", 3_000),
   internalApiToken: optional("WARDEN_INTERNAL_API_TOKEN"),
   guardianEndpoints: wardenRole === "warden" ? guardianEndpoints() : [],
};
