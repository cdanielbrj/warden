import { createConnection, type Socket } from "node:net";

const RCON_TIMEOUT_MS = 5_000;
const MAX_PACKET_LENGTH = 10 * 1024 * 1024;

const RconPacketType = {
  ResponseValue: 0,
  ExecuteCommand: 2,
  AuthResponse: 2,
  Auth: 3,
} as const;

interface RconPacket {
  id: number;
  type: number;
  body: string;
}

interface PacketWaiter {
  predicate: (packet: RconPacket) => boolean;
  resolve: (packet: RconPacket) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class RconClient {
  private readonly packets: RconPacket[] = [];
  private readonly waiters: PacketWaiter[] = [];
  private buffer = Buffer.alloc(0);
  private closedError?: Error;
  private nextRequestId = 1;

  private constructor(
    private readonly socket: Socket,
    private readonly target: string,
    private readonly timeoutMs: number,
  ) {
    socket.on("data", (chunk: Buffer) => this.handleData(chunk));
    socket.on("error", (error) => {
      this.fail(new Error(`RCON connection to ${target} failed: ${error.message}`));
    });
    socket.on("close", () => {
      if (!this.closedError) {
        this.fail(new Error(`RCON connection to ${target} closed unexpectedly.`));
      }
    });
  }

  static async connect(
    host: string,
    port: number,
    timeoutMs = RCON_TIMEOUT_MS,
  ): Promise<RconClient> {
    const target = `${host}:${port}`;

    return new Promise((resolve, reject) => {
      const socket = createConnection({ host, port });
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(
          new Error(
            `Timed out after ${timeoutMs}ms while connecting to RCON target ${target}.`,
          ),
        );
      }, timeoutMs);

      socket.once("error", (error) => {
        clearTimeout(timeout);
        reject(
          new Error(`Unable to connect to RCON target ${target}: ${error.message}`),
        );
      });
      socket.once("connect", () => {
        clearTimeout(timeout);
        socket.removeAllListeners("error");
        resolve(new RconClient(socket, target, timeoutMs));
      });
    });
  }

  async authenticate(password: string): Promise<void> {
    const requestId = this.getRequestId();
    this.writePacket(requestId, RconPacketType.Auth, password);

    // Palworld does not reliably mirror Source RCON request IDs in responses.
    const response = await this.waitForPacket(
      (packet) =>
        packet.type === RconPacketType.AuthResponse,
    );

    if (response.id === -1) {
      throw new Error(`RCON authentication failed for target ${this.target}.`);
    }
  }

  async execute(command: string): Promise<string> {
    const requestId = this.getRequestId();
    this.writePacket(requestId, RconPacketType.ExecuteCommand, command);

    const response = await this.waitForPacket(
      (packet) => packet.type === RconPacketType.ResponseValue,
    );

    return response.body;
  }

  close(): void {
    if (this.closedError) {
      return;
    }

    this.closedError = new Error("RCON client closed.");
    this.socket.destroy();
  }

  private getRequestId(): number {
    const requestId = this.nextRequestId;
    this.nextRequestId += 1;
    return requestId;
  }

  private writePacket(id: number, type: number, body: string): void {
    if (this.closedError) {
      throw this.closedError;
    }

    const bodyBuffer = Buffer.from(body, "utf8");
    const length = 10 + bodyBuffer.length;
    const packet = Buffer.alloc(length + 4);

    packet.writeInt32LE(length, 0);
    packet.writeInt32LE(id, 4);
    packet.writeInt32LE(type, 8);
    bodyBuffer.copy(packet, 12);

    this.socket.write(packet);
  }

  private waitForPacket(
    predicate: (packet: RconPacket) => boolean,
  ): Promise<RconPacket> {
    if (this.closedError) {
      return Promise.reject(this.closedError);
    }

    const packetIndex = this.packets.findIndex(predicate);
    if (packetIndex >= 0) {
      return Promise.resolve(this.packets.splice(packetIndex, 1)[0]);
    }

    return new Promise((resolve, reject) => {
      const waiter: PacketWaiter = {
        predicate,
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.removeWaiter(waiter);
          reject(
            new Error(
              `Timed out after ${this.timeoutMs}ms while waiting for an RCON response from ${this.target}.`,
            ),
          );
        }, this.timeoutMs),
      };

      this.waiters.push(waiter);
    });
  }

  private handleData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= 4) {
      const length = this.buffer.readInt32LE(0);
      if (length < 10 || length > MAX_PACKET_LENGTH) {
        this.fail(
          new Error(`Received an invalid RCON packet length from ${this.target}.`),
        );
        return;
      }

      const totalLength = length + 4;
      if (this.buffer.length < totalLength) {
        return;
      }

      const packet = this.buffer.subarray(0, totalLength);
      this.buffer = this.buffer.subarray(totalLength);

      const bodyEnd = totalLength - 2;
      if (packet[bodyEnd] !== 0 || packet[bodyEnd + 1] !== 0) {
        this.fail(new Error(`Received an invalid RCON packet from ${this.target}.`));
        return;
      }

      this.receivePacket({
        id: packet.readInt32LE(4),
        type: packet.readInt32LE(8),
        body: packet.toString("utf8", 12, bodyEnd),
      });
    }
  }

  private receivePacket(packet: RconPacket): void {
    const waiterIndex = this.waiters.findIndex((waiter) =>
      waiter.predicate(packet),
    );

    if (waiterIndex < 0) {
      this.packets.push(packet);
      return;
    }

    const [waiter] = this.waiters.splice(waiterIndex, 1);
    clearTimeout(waiter.timeout);
    waiter.resolve(packet);
  }

  private fail(error: Error): void {
    if (this.closedError) {
      return;
    }

    this.closedError = error;
    this.socket.destroy();

    for (const waiter of this.waiters.splice(0)) {
      clearTimeout(waiter.timeout);
      waiter.reject(error);
    }
  }

  private removeWaiter(waiter: PacketWaiter): void {
    const index = this.waiters.indexOf(waiter);
    if (index >= 0) {
      this.waiters.splice(index, 1);
    }
  }
}
