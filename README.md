# Warden

Warden is a Docker-first framework for administering dedicated game servers through Discord.

## Operating model

One Guardian controls exactly one game-server instance:

```text
Lady Iris  -> Palworld 1
Lady Astra -> Palworld 2
```

Each Guardian has its own Discord Application, token, container, permissions, and target-server configuration. All Guardians use the same Warden source code and Docker image.

`Lady Warden`, a future coordinator across Guardians, is explicitly outside the first phase.

## Architecture

Warden keeps shared runtime concerns in the Core and all game-specific behavior in a Realm.

```text
src/core/           Shared runtime: configuration, logging, Discord lifecycle, Realm loading
src/realms/<realm>/ Game-specific configuration, services, commands, and permissions
```

The Core never administers a game directly. It loads the Realm selected by `REALM`; each Realm exports the same `createRealm()` contract.

## Configuration

Each deployed container receives its own `.env` file. Start from `.env.example`:

```env
GUARDIAN_NAME=Lady Astra
REALM=palworld

DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_ADMIN_USER_IDS=

RCON_HOST=
RCON_PORT=
RCON_PASSWORD=
```

`RCON_*` is a generic connection capability. A Realm that uses RCON validates those fields; a Realm that does not use RCON ignores them. `DISCORD_ADMIN_USER_IDS` is a comma-separated allowlist of Discord user IDs; every administrative command is denied by default.

## Development

Docker is the only supported development and runtime environment.

```bash
docker compose up --build
```

The current MVP authenticates with the configured RCON target, executes a safe server-info check, registers global Discord commands, and connects the Guardian to Discord.

## Palworld commands

The Palworld Realm currently provides these admin-only slash commands. Responses are ephemeral.

| Command | Behavior |
| --- | --- |
| `/status` | Shows server information. |
| `/players` | Lists connected player names only. |
| `/save` | Saves the world data. |
| `/shutdown` | Schedules a shutdown after an explicit button confirmation. |

`/shutdown` requires a countdown between 10 and 3,600 seconds plus a player-facing message. The game container's restart policy is responsible for bringing the server back after shutdown.

## CI

GitHub Actions builds the development and production images, audits dependencies, and compiles TypeScript inside Docker on pushes to `main` and pull requests. After a successful push to `main`, it also publishes the production image to GitHub Container Registry:

```text
ghcr.io/cdanielbrj/warden:latest
```

The published image is a multi-stage production image: it contains only compiled JavaScript and production dependencies, and starts with `node dist/index.js`. Docker Compose uses the separate `development` build target, preserving live reload through `tsx watch`.

## Documentation

The detailed architecture and terminology are in [docs/warden-architecture.md](docs/warden-architecture.md).
