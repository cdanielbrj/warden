# Warden — Architecture and Implementation Guide

**Status:** Accepted baseline  
**Architecture version:** 0.1  
**Initial Guardian:** Lady Astra  
**Initial Realm:** Palworld  
**Runtime:** Docker only  
**Primary language:** TypeScript  
**Discord library:** discord.js 14.26.5  

---

## 1. Purpose

Warden is a modular framework for administering dedicated game servers through Discord.

The first implementation is **Lady Astra**, a Discord bot responsible for administering exactly one Palworld server through its local RCON interface.

The initial project must remain deliberately small. The immediate goal is not to build a universal game-server platform, but to establish a clean foundation that can later support other games, other Guardians, and eventually a central hub called **Lady Warden**.

---

## 2. Core terminology

The following terms are official and must be used consistently in code, documentation, logs, configuration, and discussions.

### Warden

The framework, source repository, Docker image, and shared runtime.

Examples:

- Repository: `warden`
- Docker image: `ghcr.io/<owner>/warden`
- Package name: `warden`

Warden does not know how to administer a specific game. It provides the runtime that hosts a Guardian and its Realm.

### Guardian

A deployed bot identity responsible for one game-server instance.

The first Guardian is:

- **Lady Astra**

A Guardian corresponds to:

- one Discord Application;
- one Discord bot token;
- one running Warden container;
- one game-server instance;
- one permission scope.

Future examples may include Lady Selene, Lady Vesper, or Lady Lyra.

### Realm

The game-specific implementation loaded by Warden.

Examples:

- `palworld`
- `valheim`
- `minecraft`

A Realm contains the commands, connection services, permission definitions, configuration types, and behavior required for its game.

For the first version:

- Guardian: Lady Astra
- Realm: Palworld
- Target: one Palworld dedicated server

### Server

The single game-server instance controlled by the running Guardian.

In the current architecture, a Warden container never needs to discover or select among multiple servers. Each container controls exactly one target server.

### Lady Warden

A possible future hub or coordinator.

Lady Warden is explicitly outside the first implementation. It may later aggregate status or delegate operations across multiple Guardians.

---

## 3. Architectural rule

> The Warden Core must never know how to administer a game.

All game-specific behavior belongs inside a Realm.

The Core may:

- load configuration;
- initialize logging;
- create the Discord client;
- load one Realm;
- register the Realm's Discord commands;
- route Discord interactions;
- manage application lifecycle and errors.

The Core must not:

- contain Palworld RCON commands;
- contain player, save, broadcast, shutdown, kick, or ban behavior;
- know Palworld connection details;
- contain game-specific permission rules;
- choose between multiple game servers;
- contain `if game === "palworld"` branches spread across the application.

---

## 4. Deployment model

The deployment model is:

> One Guardian = one Discord Application = one token = one container = one game server.

All Guardians use the same Warden source code and Docker image. Their behavior differs through runtime configuration.

Example:

```text
ghcr.io/<owner>/warden:latest
├── Container: lady-astra
│   ├── Discord Application: Lady Astra
│   ├── Realm: palworld
│   └── Server: Palworld A
│
└── Container: lady-selene
    ├── Discord Application: Lady Selene
    ├── Realm: valheim
    └── Server: Valheim A
```

Multiple containers must never share the same Discord bot token.

---

## 5. Environment policy

The project is Docker-first and Docker-only.

The host development machine should not require:

- Node.js;
- npm;
- pnpm;
- TypeScript;
- tsx;
- project dependencies installed globally or locally outside Docker.

The host only needs:

- Docker;
- Docker Compose;
- Git;
- an editor such as VS Code.

Development command:

```bash
docker compose up --build
```

Commands that inspect or execute project tooling must run inside the container, for example:

```bash
docker compose exec warden npm list discord.js
docker compose exec warden npm run build
```

### Runtime configuration

The shared image is configured per Guardian through environment variables. Core configuration is common to every Realm:

- `GUARDIAN_NAME`
- `REALM`
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`

Each Realm owns the validation of its game-specific needs. Realms that connect through RCON, including the current Palworld Realm, require:

- `RCON_HOST`
- `RCON_PORT`
- `RCON_PASSWORD`

The root `.env.example` is the single configuration template for a Warden container. It contains shared settings and the connection capabilities currently used by the project. A Realm ignores values it does not use and validates the values it requires.

Each deployed container must receive its own environment file or secret set. The Docker Compose file must not hard-code a particular Guardian name.

RCON transmits its password without transport encryption. RCON endpoints must remain private to the LAN or host-local Docker network and must never be exposed through a public tunnel or proxy.

The Core loads the module at `src/realms/<REALM>/index.ts` without enumerating or importing individual games. Each Realm module must export `createRealm()`, which returns the shared `Realm` contract.

---

## 6. Current technology choices

Initial stack:

- Node.js 22 Alpine image
- TypeScript
- ECMAScript modules
- discord.js 14.26.5
- dotenv
- tsx for development
- Docker Compose for local development
- npm inside the image for the initial version

Do not introduce additional frameworks or libraries unless they solve an immediate requirement.

In particular, the first phase does not need:

- NestJS;
- Express;
- a database;
- an ORM;
- Redis;
- dependency-injection frameworks;
- Winston or Pino;
- a web dashboard;
- an HTTP API;
- dynamic plugin discovery;
- a message broker.

---

## 7. Project structure

Target structure for the first phases:

```text
warden/
├── docker/
│   └── Dockerfile
│
├── docs/
│   └── architecture.md
│
├── src/
│   ├── core/
│   │   ├── bot/
│   │   │   ├── Bootstrap.ts
│   │   │   └── Client.ts
│   │   │
│   │   ├── config/
│   │   │   └── env.ts
│   │   │
│   │   ├── logger/
│   │   │   └── Logger.ts
│   │   │
│   │   ├── realms/
│   │   │   └── RealmLoader.ts
│   │   │
│   │   └── types/
│   │       ├── Command.ts
│   │       └── Realm.ts
│   │
│   ├── realms/
│   │   └── palworld/
│   │       ├── commands/
│   │       ├── config/
│   │       ├── permissions/
│   │       ├── services/
│   │       ├── types/
│   │       └── index.ts
│   │
│   └── index.ts
│
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

Empty directories should only be created when they are about to receive a real file. Avoid placeholder complexity.

---

## 8. Runtime configuration

### Environment variables

```env
GUARDIAN_NAME=Lady Astra
REALM=palworld

DISCORD_TOKEN=
DISCORD_CLIENT_ID=

RCON_HOST=
RCON_PORT=
RCON_PASSWORD=
```

Definitions:

- `GUARDIAN_NAME`: human-readable Guardian identity used in logs and responses.
- `REALM`: Realm loaded by this container.
- `DISCORD_TOKEN`: bot token from the Discord Developer Portal.
- `DISCORD_CLIENT_ID`: Discord Application ID.
- `RCON_HOST`, `RCON_PORT`, and `RCON_PASSWORD`: generic RCON connection settings. They are required and validated only by a Realm that uses RCON.

The Discord Public Key is not required for the gateway-based `discord.js` client used by this project.

The RCON settings are present in the template before the RCON client is implemented, so a deployment has one stable configuration format. A Realm that does not use RCON ignores them.

During the initial Palworld phase, Warden authenticates against the configured RCON target and executes the safe `Info` query during startup. Additional game commands are introduced separately after this deployment-level check succeeds.

Secrets must never be committed.

The real `.env` must be ignored by Git. `.env.example` must contain names only, never real values.

---

## 9. Application lifecycle

Expected startup sequence:

```text
1. Start Warden
2. Read and validate environment variables
3. Initialize logger
4. Load the configured Realm
5. Create Discord client
6. Register development slash commands
7. Connect to Discord
8. Begin listening for interactions
9. Report readiness
```

Expected startup logs:

```text
[INFO] Starting Warden v0.0.1
[INFO] Guardian: Lady Astra
[INFO] Loading Realm: palworld
[SUCCESS] Realm loaded: Palworld
[INFO] Connecting to Discord
[SUCCESS] Logged in as Lady Astra#4463
[SUCCESS] Warden is ready
```

A missing required environment variable must:

1. produce a clear error;
2. avoid printing secret values;
3. terminate the process with a non-zero exit code.

Unhandled promise rejections and uncaught exceptions must also be logged before process termination.

---

## 10. Core contracts

Contracts should remain small and expand only when an implemented feature requires it.

### Realm contract

Suggested initial shape:

```ts
import type { GuardianCommand } from "./Command.js";

export interface Realm {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly commands: readonly GuardianCommand[];

  initialize(): Promise<void>;
}
```

A Realm is responsible for initializing its own game-specific dependencies.

The Core may access the Realm metadata and commands, but must not access internal services directly.

### Command contract

Suggested shape when slash-command registration begins:

```ts
import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

export interface GuardianCommand {
  readonly data: SlashCommandBuilder;

  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
```

The contract may later receive a Realm-specific context object, but this must not be added before it is needed.

### Avoid premature abstractions

Do not create interfaces for every file merely for symmetry.

Create a contract when:

- the Core depends on an implementation through that contract;
- multiple implementations are expected;
- replacing the implementation is a realistic need;
- the contract clarifies an actual architectural boundary.

---

## 11. Realm loading

Only one Realm is loaded per process.

The first implementation may use an explicit registry:

```ts
const realmFactories = {
  palworld: () => import("../../realms/palworld/index.js"),
};
```

This is preferable to filesystem scanning in the first version because it is:

- explicit;
- type-safe;
- easy to debug;
- compatible with compiled JavaScript;
- resistant to unexpected files being loaded.

The loader must:

1. receive the configured Realm ID;
2. reject unknown Realm IDs clearly;
3. dynamically import only the selected Realm;
4. call its initialization method;
5. return the initialized Realm.

Do not load every Realm and then select one.

---

## 12. Discord command model

Each Realm owns its commands.

The Core owns:

- command registration transport;
- interaction-event handling;
- command lookup;
- generic error handling.

The Realm owns:

- command names and descriptions;
- command options;
- game-specific validation;
- permissions required by the command;
- game-specific execution;
- game-specific response content.

For development, commands should be registered to `DISCORD_GUILD_ID`, not globally. Global registration may be introduced only when a production release needs it.

### Initial command

The first command should be `/about`.

Purpose:

- prove the Realm loaded;
- prove command registration works;
- prove interaction routing works;
- expose Warden, Guardian, Realm, and version information.

Suggested response:

```text
Lady Astra

Framework: Warden
Version: 0.0.1
Realm: Palworld
Status: Online
```

No RCON connection is required for `/about`.

---

## 13. Permission model

Permissions are part of the Realm because different games may expose different administrative capabilities.

However, Discord identity and role retrieval are infrastructure provided by the Core.

The first foundation phase does not implement permissions.

Future Palworld permissions should be command-oriented, for example:

```text
palworld.about
palworld.players.read
palworld.broadcast
palworld.save
palworld.shutdown
palworld.kick
palworld.ban
```

Authorization should rely on immutable Discord IDs, not display names or nicknames.

Likely supported subjects:

- Discord user IDs;
- Discord role IDs.

Critical commands must support explicit confirmation before execution.

Examples:

- shutdown;
- restart;
- ban;
- rollback;
- destructive maintenance operations.

The permission system must deny by default.

---

## 14. Logging policy

All application logs must go through the Warden logger.

Do not scatter direct `console.log`, `console.warn`, or `console.error` calls across the project. The logger itself may use the console internally.

Initial levels:

- `debug`
- `info`
- `success`
- `warn`
- `error`

Every log line should include:

- ISO timestamp;
- level;
- message.

Suggested output:

```text
[2026-07-10T18:47:49.507Z] [INFO] Starting Warden...
```

Do not log:

- Discord bot tokens;
- RCON passwords;
- full secret-bearing configuration objects;
- sensitive command payloads unless redacted.

Future administrative logs should include:

- Guardian;
- Realm;
- Discord user ID;
- Discord username for readability;
- command;
- result;
- target server name;
- timestamp.

Terminal logging is sufficient for the initial phases. Persistent logging may be added later.

---

## 15. Error handling

Expected error categories:

### Configuration errors

Examples:

- missing Discord token;
- unsupported Realm;
- invalid RCON port.

Behavior: clear log and process termination.

### Discord startup errors

Examples:

- invalid token;
- missing bot permissions;
- command registration failure.

Behavior: clear log and process termination when startup cannot continue.

### Command execution errors

Behavior:

- log the full internal error safely;
- send a generic ephemeral error response to the Discord user;
- do not expose tokens, passwords, stack traces, local paths, or internal network details.

### RCON errors

To be implemented later.

Expected distinction:

- connection refused;
- authentication failed;
- timeout;
- malformed response;
- unsupported command;
- server unavailable.

---

## 16. Docker development model

### Development image

The development container may run:

```bash
npm run dev
```

with:

```json
{
  "dev": "tsx watch src/index.ts"
}
```

The source directory may be bind-mounted:

```yaml
volumes:
  - ./src:/app/src
```

This permits live reload without installing Node on the host.

### Production image

The production image should eventually use a multi-stage build:

```text
builder
  ├── install dependencies
  ├── type-check
  └── compile TypeScript

runtime
  ├── copy production dependencies
  ├── copy dist
  └── run node dist/index.js
```

Production must not use `tsx watch`.

Production configuration must come from environment variables or mounted configuration, not be baked into the image.

---

## 17. Current implementation state

Already validated:

- Docker Compose builds successfully.
- The container runs Node.js 22 Alpine.
- TypeScript runs through `tsx watch`.
- `.env` is loaded into the container.
- `discord.js` version is 14.26.5.
- Lady Astra authenticates successfully.
- The Discord client reaches the ready state.
- Terminal logger produces timestamped messages.
- The `ready` event was changed to `clientReady` to avoid the deprecation warning.

Current successful output is conceptually:

```text
[INFO] Starting Warden...
[SUCCESS] Logged as Lady Astra#4463
[SUCCESS] Lady Astra is watching.
```

---

## 18. Phase plan

### Phase 1 — Foundation

Scope:

- environment validation;
- logger;
- Discord client bootstrap;
- graceful startup failure;
- Realm contract;
- explicit Realm loader;
- empty Palworld Realm;
- guild slash-command registration;
- `/about`;
- interaction routing;
- clean shutdown handling.

Acceptance criteria:

1. `docker compose up --build` starts Warden.
2. Warden loads only the `palworld` Realm.
3. Lady Astra connects to Discord.
4. `/about` appears in the development guild.
5. `/about` returns the expected framework and Realm information.
6. Missing required configuration stops the container with a useful error.
7. The project type-checks successfully inside Docker.
8. No RCON code exists yet.

### Phase 2 — Palworld connectivity

Scope:

- choose and integrate a Palworld-compatible RCON client;
- validate RCON environment variables;
- implement connection timeout;
- implement a connection test service;
- distinguish authentication and network failures;
- expose a safe diagnostic command, likely `/status` or `/connection`.

Acceptance criteria:

- Lady Astra connects to the correct local RCON endpoint;
- no RCON port is exposed publicly;
- failure responses do not leak the password;
- connection behavior is observable through logs.

### Phase 3 — Administrative commands

Initial candidates:

- players;
- broadcast;
- save;
- shutdown.

Commands must be tested against the actual Palworld server behavior before being generalized.

### Phase 4 — Permissions and audit

Scope:

- Discord role and user-ID rules;
- deny-by-default authorization;
- per-command permission metadata;
- ephemeral denial responses;
- confirmation for critical actions;
- administrative audit logs.

### Phase 5 — Production delivery

Scope:

- production Dockerfile;
- GitHub Actions;
- image publication to GHCR;
- Unraid container template or documented variables;
- health checks;
- versioned releases.

### Future — Lady Warden hub

Out of scope until multiple independent Guardians are stable.

---

## 19. Coding conventions

### Language

- Source code, identifiers, comments, logs, commit messages, and technical documentation should use English.
- User-facing Discord messages may later support localization.
- Initial bot responses may be English or Portuguese, but the choice should be consistent.

### TypeScript

- enable strict mode;
- avoid `any`;
- prefer `unknown` plus explicit narrowing for caught errors;
- use `readonly` for immutable metadata;
- prefer named exports;
- keep functions focused;
- avoid unnecessary classes;
- use async functions for I/O boundaries;
- use explicit return types on exported functions.

### Imports

The project uses ESM and NodeNext resolution.

TypeScript source imports must use `.js` extensions when required by the compiled Node.js output:

```ts
import { Logger } from "../logger/Logger.js";
```

### Naming

- Files containing a primary exported type or component may use PascalCase.
- Variables and functions use camelCase.
- Environment variables use SCREAMING_SNAKE_CASE.
- Realm IDs use lowercase identifiers, such as `palworld`.
- Discord command names use lowercase names accepted by Discord.

### Formatting

Introduce ESLint and Prettier only when their configuration is committed and executable inside Docker.

Do not require editor-global tooling.

---

## 20. Git and repository conventions

Suggested commit style:

```text
feat(core): add realm loader
feat(palworld): add about command
fix(discord): use clientReady event
chore(docker): add development compose service
docs(architecture): document deployment model
```

Commits should be small enough to review but complete enough to leave the branch runnable.

Never commit:

- `.env`;
- tokens;
- RCON credentials;
- generated `dist`;
- host `node_modules`;
- temporary logs containing secrets.

---

## 21. Non-goals for the first version

Do not implement these during Phase 1:

- multiple servers in one container;
- multiple Realms in one process;
- selection menus for server instances;
- a Lady Warden hub;
- REST or GraphQL APIs;
- a web interface;
- database-backed permissions;
- dynamic module installation;
- hot-swapping Realms;
- Docker socket control;
- game-server restart through Docker;
- backups;
- scheduled tasks;
- public RCON exposure;
- VPN management;
- Playit.gg integration.

These may be reconsidered after the basic Palworld administration workflow is stable.

---

## 22. Security principles

1. RCON remains private to the local Docker or LAN network.
2. The Discord bot is the authenticated bridge from Discord to the private RCON endpoint.
3. Secrets are injected at runtime.
4. Authorization denies access by default.
5. Destructive actions require stronger permissions and confirmation.
6. Logs must be useful without revealing credentials.
7. A compromised Guardian token should affect only that Guardian.
8. Each Guardian uses a distinct Discord Application and token.
9. The bot should request only the Discord permissions and gateway intents it actually needs.
10. No privileged Docker socket access should be introduced without a specific reviewed need.

---

## 23. Instructions for Codex

When modifying this repository:

1. Read this document before proposing structural changes.
2. Preserve the one-container-per-server deployment model.
3. Keep all game-specific behavior inside `src/realms/<realm>/`.
4. Keep the Core independent of Palworld and RCON.
5. Do not introduce a new dependency without explaining the immediate requirement.
6. Run type-checking or the relevant Docker command after edits.
7. Report every created, modified, and deleted file.
8. Do not edit `.env` values or print secrets.
9. Do not implement future phases unless explicitly requested.
10. Prefer a working minimal implementation over speculative abstractions.
11. Preserve Docker-only development; do not instruct the user to install Node locally.
12. Use the installed discord.js major version unless a migration is explicitly requested.
13. Treat this document as the current architectural source of truth.
14. When code and this document conflict, identify the conflict before changing the architecture.
15. Update this document when an accepted architectural decision changes.

---

## 24. Immediate next task

Implement the remainder of **Phase 1 — Foundation** from the current working Discord connection.

Recommended sequence:

1. improve environment typing and validation;
2. add process-level error handlers;
3. define the `Realm` contract;
4. create the explicit `RealmLoader`;
5. create the minimal Palworld Realm;
6. load the configured Realm before Discord login;
7. define the command contract;
8. implement `/about` inside the Palworld Realm;
9. register commands to the development guild;
10. route interactions to Realm commands;
11. add graceful shutdown for `SIGINT` and `SIGTERM`;
12. validate with Docker Compose and TypeScript build.

Do not add RCON during this task.
