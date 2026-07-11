# Warden

Warden is a Docker-first framework for administering dedicated game servers through Discord.

The first deployment is **Lady Astra**, a Guardian that administers one Palworld server through its RCON connection.

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

RCON_HOST=
RCON_PORT=
RCON_PASSWORD=
```

`RCON_*` is a generic connection capability. A Realm that uses RCON validates those fields; a Realm that does not use RCON ignores them.

## Development

Docker is the only supported development and runtime environment.

```bash
docker compose up --build
```

The current bootstrap validates configuration, loads the selected Realm, and connects the Guardian to Discord. RCON commands and Discord command handling are the next implementation phase.

## CI

GitHub Actions builds the Docker image, audits its dependencies, and compiles TypeScript inside it on pushes to `main` and pull requests. After a successful push to `main`, it also publishes the image to GitHub Container Registry:

```text
ghcr.io/<owner>/warden:latest
ghcr.io/<owner>/warden:<commit-sha>
```

## Documentation

The detailed architecture and terminology are in [docs/warden-architecture.md](docs/warden-architecture.md).
