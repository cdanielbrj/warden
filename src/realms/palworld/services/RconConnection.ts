import { createConnection } from "node:net";

const RCON_CONNECT_TIMEOUT_MS = 5_000;

export function verifyRconConnection(
  host: string,
  port: number,
  timeoutMs = RCON_CONNECT_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host, port });
    let settled = false;

    function finish(error?: Error) {
      if (settled) {
        return;
      }

      settled = true;
      socket.removeAllListeners();
      socket.destroy();

      if (error) {
        reject(error);
        return;
      }

      resolve();
    }

    socket.once("connect", () => finish());
    socket.once("timeout", () => {
      finish(
        new Error(
          `Timed out after ${timeoutMs}ms while connecting to RCON target ${host}:${port}.`,
        ),
      );
    });
    socket.once("error", (error) => {
      finish(
        new Error(
          `Unable to connect to RCON target ${host}:${port}: ${error.message}`,
        ),
      );
    });

    socket.setTimeout(timeoutMs);
  });
}
