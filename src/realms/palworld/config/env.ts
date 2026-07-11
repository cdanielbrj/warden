import { required, requiredPort } from "../../../core/config/env.js";

export const palworldEnv = {
  rconHost: required("RCON_HOST"),
  rconPort: requiredPort("RCON_PORT"),
  rconPassword: required("RCON_PASSWORD"),
};
