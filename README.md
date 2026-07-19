# Warden

Warden is a Docker-first framework for administering dedicated game servers through Discord.

Current release: **0.3.0**.

## Operating model

One Lady controls exactly one game-server instance; Lady Warden is the Master that aggregates them.

```text
Lady Iris  -> Palworld 1
Lady Astra -> Palworld 2
```

Each Lady has its own Discord Application, token, container, permissions, and instance configuration. All use the same Warden source code and Docker image.

## Architecture

Warden separates shared infrastructure, Ladies and the Master.

```text
src/core/                 Shared contracts, Discord, logging and storage
src/lady/realms/<realm>/  Game-specific configuration, services, commands and permissions
src/lady/                 Lady API, status and Master registration
src/warden/               Master registry, commands and Discord presentation
```

The Core never administers a game directly. It loads the Realm selected by `REALM`; each Realm exports the same `createRealm()` contract.

## Configuration

Each deployed container receives its own `.env` file. Start from `.env.example`:

```env
ROLE=lady
ID=astra
REALM=palworld
INSTANCE=2

DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_ADMIN_USER_IDS=

RCON_HOST=
RCON_PORT=
RCON_PASSWORD=
```

`INSTANCE` is optional: `palworld` plus an empty value identifies `palworld`; `palworld` plus `2` identifies `palworld2`. `RCON_*` is a generic connection capability. `DISCORD_ADMIN_USER_IDS` is a comma-separated allowlist; every administrative command is denied by default.

## Lady Warden Master

Lady Warden uses `ROLE=master` and the same image. It persists a catalog of registered Ladies in SQLite, mounted only into the Master container at `DATA_PATH` (default `/data`). Each Lady registers through the authenticated private endpoint `POST /v1/lady/register`; registration retries in the background until confirmed and never blocks the Lady.

The Master provides three admin-only commands:

| Command | Behavior |
| --- | --- |
| `/servers` | Shows every registered Lady with live server status and players. |
| `/lady id` | Shows one registered Lady. |
| `/sync` | Rechecks every registered Lady and refreshes its synchronization timestamp. |

Lady and Master containers communicate only through the private `warden_net` Docker network. No internal API port is published to the host.

## Development

Docker is the only supported development and runtime environment.

```bash
docker compose up --build
```

Each Lady authenticates with its configured RCON target, executes a safe server-info check, registers Discord commands, and connects to Discord.

## Palworld commands

The Palworld Realm currently provides these admin-only slash commands. Queries,
errors, and confirmations are private; successful actions that change server state
are published in the channel where the command was used.

| Command | Behavior | Result |
| --- | --- | --- |
| `/status` | Shows server information. | Private |
| `/players` | Lists connected player names only. | Private |
| `/save` | Saves the world data. | Public on success |
| `/shutdown` | Schedules a shutdown after an explicit button confirmation. | Public on success |
| `/config show` | Shows the parsed `OptionSettings` configuration. | Private |
| `/config get key` | Shows one configuration value. | Private |
| `/config set key value` | Validates and atomically updates one supported setting after creating a configuration backup. | Public on success |
| `/backup config` | Creates a timestamped copy of `PalWorldSettings.ini`. | Public on success |
| `/backup world` | Requests an RCON save and creates a timestamped snapshot of active world data. | Public on success |

`/shutdown` requires a countdown between 10 and 3,600 seconds plus a player-facing message. The game container's restart policy is responsible for bringing the server back after shutdown.

`/config get` and `/config set` offer key autocomplete. `/config set` preserves unknown settings, writes through a temporary file followed by an atomic rename, and does not restart the server itself; use `/shutdown` when the changed setting requires a restart.

World snapshots deliberately exclude Palworld's own rotating `backup` directories from the copy. The source game files are never deleted or modified by this command. Configuration and world backups are validated on Lady Iris.

## Unraid mounts for Palworld

The container template must map the Target-specific directories to Warden's fixed container paths with read/write access:

| Host path | Container path | Purpose |
| --- | --- | --- |
| `/mnt/user/games/<target>/serverfiles` | `/data/serverfiles` | Reads and updates `PalWorldSettings.ini`; reads active world data. |
| `/mnt/user/games/backups/<target>` | `/data/backups` | Stores Warden-managed configuration and world backups. |

Host paths stay in the Unraid template; application code only uses the stable `/data/...` paths.

## CI

GitHub Actions builds the development and production images, audits dependencies, and compiles TypeScript inside Docker on pushes to `main` and pull requests. After a successful push to `main`, it also publishes the production image to GitHub Container Registry:

```text
ghcr.io/cdanielbrj/warden:latest
```

The published image is a multi-stage production image: it contains only compiled JavaScript and production dependencies, and starts with `node dist/index.js`. Docker Compose uses the separate `development` build target, preserving live reload through `tsx watch`.

## Documentation

The detailed architecture and terminology are in [docs/warden-architecture.md](docs/warden-architecture.md).
