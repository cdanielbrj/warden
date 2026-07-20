# Warden — Architecture and Implementation Guide

**Status:** Accepted baseline  
**Software version:** 0.3.2
**Architecture baseline:** 0.3
**Document revision:** 2026-07-20
**Initial Lady:** Lady Astra
**Initial Realm:** Palworld  
**Runtime:** Docker only  
**Primary language:** TypeScript  
**Discord library:** discord.js 14.26.5  

---

## 1. Purpose

Warden is a modular framework for administering dedicated game servers through Discord.

The first implementation is **Lady Astra**, a Discord bot responsible for administering exactly one Palworld server through its local RCON interface. Version 0.3 introduced **Lady Warden**, the Master that persists registered Ladies and aggregates their live status.

The initial project must remain deliberately small. The immediate goal is not to build a universal game-server platform, but to establish a clean foundation that supports other games, other Ladies, and the read-only aggregation provided by **Lady Warden**.

---

## 2. Core terminology

The following terms are official and must be used consistently in code, documentation, logs, configuration, and discussions.

### Warden

The framework, source repository, Docker image, and shared runtime.

Examples:

- Repository: `warden`
- Docker image: `ghcr.io/<owner>/warden`
- Package name: `warden`

Warden does not know how to administer a specific game. It provides the runtime that hosts a Lady and its Realm.

### Lady

A deployed bot identity responsible for one game-server instance.

The first Lady is:

- **Lady Astra**

A Lady corresponds to:

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

- Lady: Lady Astra
- Realm: Palworld
- Target: one Palworld dedicated server

### Instance

The concrete game-server deployment controlled by a Lady.

A Realm and optional Instance suffix form a stable technical identifier:

- `palworld`
- `palworld2`
- `valheim`

The Target identifier is independent from both the Lady identity and the Realm.

Examples:

```text
Lady Astra
Lady ID: astra
Realm: palworld
Instance: 2 (`palworld2`)
```

```text
Lady Iris
Lady ID: iris
Realm: palworld
Instance: empty (`palworld`)
```

Multiple Ladys may use the same Realm while controlling different Targets.

### Server

The single game-server instance represented by a Target and controlled by the running Lady.

In the Lady runtime, a Warden container never needs to discover or select among multiple servers. Each container controls exactly one Target.

### Lady Warden

The Master supervisor of the Warden ecosystem.

Lady Warden uses the same repository and Docker image as every other Lady, but operates at a different level of authority.

Lady Warden currently provides:

- persistent SQLite registration of Ladies;
- authenticated private registration and status APIs;
- live health and player aggregation through `/servers`, `/lady`, and `/sync`;
- centralized operational logs for registration and status queries.

Future responsibilities include maintenance orchestration, schedules, restricted
container lifecycle control, centralized alerts, and coordinated operations.

Lady Warden does not replace individual Ladys and must not implement game-specific behavior directly. Ladys remain autonomous and own all Realm-specific operations.

The architectural distinction is:

> Individual Ladys administer game servers. Lady Warden administers the Warden ecosystem.

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
- choose between multiple game servers in the Lady runtime;
- contain `if game === "palworld"` branches spread across the application.

Additional accepted rules:

> A Lady identity is not a Realm and is not a Target.

> Discord is the human interface and audit surface. Coordination between Warden services must use authenticated private service-to-service communication, not bot messages as a command transport.

> Lady Warden coordinates infrastructure and Ladys. Individual Ladys perform Realm-specific work.

> Lady Warden must never receive unrestricted access to the Docker host.

---

## 4. Deployment model

The deployment model is:

> One Lady = one Discord Application = one token = one container = one game server.

All Ladys use the same Warden source code and Docker image. Their behavior differs through runtime configuration.

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

A Lady identity represents a deployment, not a game category. Two Palworld servers therefore use two distinct Lady identities and Discord Applications:

```text
Lady Astra
├── Realm: palworld
└── Target: palworld

Lady Iris
├── Realm: palworld
└── Target: palworld2
```

The shared Palworld Realm code is reused by both containers. Their tokens, Target paths, RCON configuration, permissions, and visual identities remain isolated.

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

The shared image is configured per container through environment variables. The
common configuration is:

- `ROLE`
- `ID`
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_ADMIN_USER_IDS`
- `WARDEN_INTERNAL_API_PORT`
- `WARDEN_INTERNAL_API_TOKEN`

Lady containers additionally require `REALM` and may define `INSTANCE`.
Master containers use `DATA_PATH` for the persistent SQLite registry.

Each Realm owns the validation of its game-specific needs. Realms that connect through RCON, including the current Palworld Realm, require:

- `RCON_HOST`
- `RCON_PORT`
- `RCON_PASSWORD`

The implemented identity model is:

- `ID`: canonical identity such as `astra`, `iris`, or `warden`;
- `INSTANCE`: optional suffix that forms `palworld`, `palworld2`, or `valheim3` with the Realm;
- `REALM`: game implementation loaded by a Lady;
- `ROLE`: the `lady` or `master` execution mode.

The root `.env.example` is the single configuration template for a Warden container. It contains shared settings and the connection capabilities currently used by the project. A Realm ignores values it does not use and validates the values it requires.

Each deployed container must receive its own environment file or secret set. The Docker Compose file must not hard-code a particular Lady identity.

RCON transmits its password without transport encryption. RCON endpoints must remain private to the LAN or host-local Docker network and must never be exposed through a public tunnel or proxy.

The Core resolves `REALM` through a centralized explicit registry and imports
only the selected Realm. Each Realm module must export `createRealm()`, which
returns the shared `Realm` contract.

### Mini PC storage convention

Game-server data follows a stable host-side layout:

```text
/mnt/user/games/<INSTANCE>/serverfiles/
```

Examples:

```text
/mnt/user/games/palworld/serverfiles/
/mnt/user/games/palworld2/serverfiles/
/mnt/user/games/valheim/serverfiles/
```

Warden-managed backups follow the matching host-side convention:

```text
/mnt/user/games/backups/<INSTANCE>/
```

Examples:

```text
/mnt/user/games/backups/palworld/
/mnt/user/games/backups/palworld2/
/mnt/user/games/backups/valheim/
```

For Palworld, the effective settings file is always resolved relative to the Target server-files root:

```text
Pal/Saved/Config/LinuxServer/PalWorldSettings.ini
```

Therefore, the full host path is:

```text
/mnt/user/games/<INSTANCE>/serverfiles/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini
```

Warden code must not hard-code `/mnt/user` host paths. Unraid maps the
Target-specific server-files directory to the stable container path:

```text
/data/serverfiles
```

Current volume mappings for a Palworld Lady are read/write because configuration edits and backups are implemented:

```yaml
volumes:
  - /mnt/user/games/<INSTANCE>/serverfiles:/data/serverfiles:rw
  - /mnt/user/games/backups/<INSTANCE>:/data/backups:rw
```

For example, Lady Iris maps `palworld` to those paths and Lady Astra maps `palworld2`. Each Lady receives only the mounts for its own Target.

The Realm resolves its own files relative to these stable container roots. The Palworld Realm therefore resolves:

```text
/data/serverfiles/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini
```

The backup mount stores Warden-managed snapshots under `config/` and `world/`.
`SERVER_FILES_ROOT` and `BACKUP_ROOT` are intentionally not environment
variables while the fixed container-path contract is sufficient.

---

## 6. Current technology choices

Current stack:

- Node.js 24 Alpine image
- TypeScript
- ECMAScript modules
- discord.js 14.26.5
- dotenv
- tsx for development
- Docker Compose for local development
- Node's built-in SQLite support for the Master registry
- authenticated private HTTP APIs between Master and Ladies

Do not introduce additional frameworks or libraries unless they solve an immediate requirement.

In particular, the first phase does not need:

- NestJS;
- Express;
- an external database;
- an ORM;
- Redis;
- dependency-injection frameworks;
- Winston or Pino;
- a web dashboard;
- a public HTTP API;
- dynamic plugin discovery;
- a message broker.

---

## 7. Project structure

Current structure:

```text
warden/
├── docker/
│   └── Dockerfile
│
├── docs/
│   └── warden-architecture.md
│
├── src/
│   ├── Bootstrap.ts
│   ├── index.ts
│   │
│   ├── core/
│   │   ├── bot/
│   │   │   └── Client.ts
│   │   │
│   │   ├── config/
│   │   │   └── env.ts
│   │   │
│   │   ├── logger/
│   │   │   └── Logger.ts
│   │   │
│   │   ├── services/
│   │   │   ├── discord/
│   │   │   └── storage/
│   │   └── types/
│   │       ├── Command.ts
│   │       ├── LadyStatus.ts
│   │       └── Realm.ts
│   │
│   ├── lady/
│   │   ├── api/
│   │   ├── realms/
│   │   │   ├── RealmLoader.ts
│   │   │   └── palworld/
│   │   └── services/
│   │
│   └── warden/
│       ├── api/
│       ├── commands/
│       ├── presentation/
│       └── services/
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
ROLE=lady
ID=astra
REALM=palworld
INSTANCE=2

DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_ADMIN_USER_IDS=

WARDEN_INTERNAL_API_PORT=3000
WARDEN_INTERNAL_API_TOKEN=

RCON_HOST=
RCON_PORT=
RCON_PASSWORD=
```

The Master uses the same image with:

```env
ROLE=master
ID=warden
DATA_PATH=/data
WARDEN_INTERNAL_API_PORT=3000
WARDEN_INTERNAL_API_TOKEN=
```

Definitions:

- `ROLE`: either `lady` or `master`.
- `ID`: stable Lady or Master identity, such as `iris` or `warden`.
- `REALM`: Realm loaded by a Lady container.
- `INSTANCE`: optional suffix that forms the technical instance ID with the Realm.
- `DISCORD_TOKEN`: bot token from the Discord Developer Portal.
- `DISCORD_CLIENT_ID`: Discord Application ID.
- `DISCORD_ADMIN_USER_IDS`: comma-separated Discord user IDs authorized to administer the Lady.
- `WARDEN_INTERNAL_API_PORT`: private API port; it is never published to the host.
- `WARDEN_INTERNAL_API_TOKEN`: shared token used only between Master and Ladies.
- `MASTER_URL`: optional Master URL; it defaults to `http://lady-warden:3000`.
- `DATA_PATH`: persistent Master data directory; it defaults to `/data`.
- `RCON_HOST`, `RCON_PORT`, and `RCON_PASSWORD`: generic RCON connection settings. They are required and validated only by a Realm that uses RCON.

The Discord Public Key is not required for the gateway-based `discord.js` client used by this project.

The RCON settings are part of the stable container configuration format. A Realm that does not use RCON ignores them.

During startup, the Palworld Realm authenticates against the configured RCON target and executes the safe `Info` query. A Lady then exposes its authenticated private status endpoint and registers with the Master. Registration retries every 10 seconds until the Master confirms it, so Master and Lady startup order is not significant.

Secrets must never be committed.

The real `.env` must be ignored by Git. `.env.example` must contain names only, never real values.

---

## 9. Application lifecycle

Expected startup sequence:

```text
1. Start Warden
2. Read and validate environment variables
3. If ROLE=lady: load and initialize the configured Realm
4. If ROLE=lady: start the private status API and register with the Master
5. If ROLE=master: open the persistent Lady registry and registry API
6. Register the role-specific global Discord commands
7. Create the Discord client and connect to Discord
8. Begin listening for interactions and report readiness
```

Expected startup logs:

```text
[INFO] Starting Lady iris for palworld (build v0.3.2).
[INFO] Authenticating RCON connection to <host>:<port>.
[SUCCESS] RCON authentication succeeded for <host>:<port>.
[SUCCESS] Private Lady status API is listening on port 3000.
[SUCCESS] Registered with the Master.
[SUCCESS] Registered 6 global Discord command(s).
[SUCCESS] Logged as Lady Iris#0000
[SUCCESS] Lady iris is watching palworld.
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
import type { LadyCommand } from "./Command.js";

export interface Realm {
  readonly name: string;
  readonly commands: readonly LadyCommand[];

  initialize(): Promise<void>;
}
```

A Realm is responsible for initializing its own game-specific dependencies.

The Core may access the Realm metadata and commands, but must not access internal services directly.

### Command contract

Suggested shape when slash-command registration begins:

```ts
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface LadyCommand {
  readonly data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;

  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
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
- private/public response delivery;
- reusable mounted-filesystem backup storage.

The Realm owns:

- command names and descriptions;
- command options;
- game-specific validation;
- permissions required by the command;
- game-specific execution;
- game-specific response content.

Commands are registered globally for the Lady's Discord Application. A Lady remains restricted by its own token and its `DISCORD_ADMIN_USER_IDS` allowlist.

### Implemented Palworld commands

The current Palworld Realm exposes six global slash commands, all restricted to `DISCORD_ADMIN_USER_IDS`:

- `/status`: show server information through RCON `Info`;
- `/players`: show connected player names through RCON `ShowPlayers`;
- `/save`: save world data through RCON `Save`;
- `/shutdown`: schedule a graceful shutdown through RCON `Shutdown` after an explicit Discord button confirmation.
- `/config`: show the parsed settings, get a setting, or set a catalogued setting;
- `/backup`: create a configuration backup or a world snapshot.

Queries, errors, authorization denials, and critical confirmations are private. Successful actions that change server state are posted publicly in the channel where the command was invoked. `/shutdown` requires a countdown between 10 and 3,600 seconds and a player-facing message. `/config get` and `/config set` offer Discord autocomplete from the Realm's settings catalogue; value autocomplete is available for boolean and enumerated settings.

`/config set` validates the key and value, calls the same configuration-backup service as `/backup config`, writes a temporary file, and atomically renames it into place. It never restarts the server implicitly; an administrator uses `/shutdown` to apply restart-dependent changes. `/backup world` calls RCON `Save` before copying active `SaveGames` data into Warden's backup mount. Palworld's native rotating directories named `backup` are excluded from that copy only; the game source is never modified or deleted.

---

## 13. Permission model

Permissions are part of the Realm because different games may expose different administrative capabilities.

However, Discord identity and role retrieval are infrastructure provided by the Core.

The first administrative phase implements a Lady-level allowlist through `DISCORD_ADMIN_USER_IDS`. It denies access by default; richer command- and role-based permissions may be introduced later.

Future Palworld permissions should be command-oriented, for example:

```text
palworld.players.read
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

The startup message must identify the running role, its ID and instance when
applicable, and the package build version. Operational logs must record
Discord command handling, authorization denials, RCON operations, backup and
configuration writes, and authenticated private API registration and status
requests. They must remain concise and must not include secrets or setting
values.

Do not log:

- Discord bot tokens;
- RCON passwords;
- full secret-bearing configuration objects;
- sensitive command payloads unless redacted.

Future administrative logs should include:

- Lady;
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

Implemented for the Palworld MVP.

The RCON layer must continue to distinguish:

- connection refused;
- authentication failed;
- timeout;
- malformed response;
- unsupported command;
- server unavailable.

Discord-facing responses remain generic and must never expose passwords, internal stack traces, or unnecessary network details.

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

The published image uses a multi-stage build:

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

The production runtime does not include TypeScript, `tsx`, or source files and does not use `tsx watch`. The Compose configuration explicitly selects the `development` target for local live reload.

Production configuration must come from environment variables or mounted configuration, not be baked into the image.

---

## 17. Current implementation state

Already validated:

- Docker Compose builds the `development` target successfully.
- The published runtime uses Node.js 24 Alpine, compiled JavaScript, and production dependencies only.
- TypeScript runs through `tsx watch` only in the Compose development target.
- `.env` is loaded into the container.
- `discord.js` version is 14.26.5.
- Lady Astra authenticates successfully.
- The Discord client reaches the ready state.
- Terminal logger produces timestamped messages.
- The `ready` event was changed to `clientReady` to avoid the deprecation warning.
- Palworld configuration management parses `PalWorldSettings.ini`, preserves
  unknown source content, validates catalogued keys and values, creates a
  timestamped backup, and applies atomic updates through the production
  image's `/data/serverfiles` mount contract.
- Lady Iris validated `/config show`, `/config get`, autocomplete, sequential
  `/config set` updates, configuration backups, and restart persistence against
  the real Palworld server.
- Lady Iris validated `/backup config` and `/backup world`; world snapshots
  exclude only Palworld's native rotating `backup` directories and leave the
  source save data intact.
- Successful state-changing commands publish their outcome in the invoking
  Discord channel, while queries, errors, and confirmations remain private.
- Lady Warden persists registrations in SQLite and can aggregate live Lady
  status through authenticated private APIs.
- Startup logs identify the role, ID or instance, and build version; operational
  logs cover commands, RCON, backups, configuration writes, and private API
  activity without printing secrets.

Current successful output is conceptually:

```text
[INFO] Starting Lady iris for palworld (build v0.3.2).
[INFO] Authenticating RCON connection to <host>:<port>.
[SUCCESS] RCON authentication succeeded for <host>:<port>.
[SUCCESS] Registered 6 global Discord command(s).
[SUCCESS] Logged as Lady Astra#4463
[SUCCESS] Lady Astra is watching Palworld.
```

---

## 18. Phase plan

### Phase 1 — Foundation — Complete

Scope:

- environment validation;
- logger;
- Discord client bootstrap;
- graceful startup failure;
- Realm contract;
- explicit Realm loader;
- Palworld Realm;
- global slash-command registration;
- interaction routing;
- generic interaction error handling.

Acceptance criteria:

1. `docker compose up --build` starts Warden.
2. Warden loads only the `palworld` Realm.
3. Lady Astra connects to Discord.
4. Realm commands are registered globally for the Lady Application.
5. Interactions route to the selected Realm.
6. Missing required configuration stops the container with a useful error.
7. The project type-checks successfully inside Docker.

### Phase 2 — Palworld connectivity — Complete

Scope:

- integrate a Palworld-compatible RCON client;
- validate RCON environment variables;
- implement connection and response timeouts;
- distinguish authentication and network failures;
- expose `/status`.

Acceptance criteria:

- Lady Astra connects and authenticates against the correct local RCON endpoint;
- no RCON port is exposed publicly;
- failure responses do not leak the password;
- `Info`, `ShowPlayers`, `Save`, and `Shutdown` are validated against the actual Palworld server.

### Phase 3 — Administrative commands — Complete for MVP

Initial candidates:

- status;
- players;
- save;
- shutdown.

Commands must be tested against the actual Palworld server behavior before being generalized.

### Phase 4 — Permissions and audit — Partially complete

Scope:

- Discord user-ID allowlist;
- deny-by-default authorization;
- ephemeral denial responses;
- confirmation for critical actions;
- administrative audit logs (future).

### Phase 5 — Production delivery — Complete

Scope:

- production Dockerfile;
- GitHub Actions;
- image publication to GHCR;
- Unraid container template or documented variables;
- health checks;
- versioned releases.

### Phase 6 — Palworld configuration management — Complete

Scope:

- resolve `PalWorldSettings.ini` from the stable Target storage layout;
- parse `OptionSettings=(...)` without losing unknown fields or formatting-critical values;
- expose read and write configuration commands with autocomplete;
- create timestamped configuration backups and world snapshots.

Completed delivery sequence:

1. validate `/config show` and `/config get` against Lady Iris's actual file;
2. add catalogue-backed edits and autocomplete;
3. add shared configuration backup creation and atomic replacement;
4. validate sequential edits and restart persistence on Lady Iris;
5. validate configuration and world backups on Lady Iris.

Future work can add a configuration diff, rollback, and restart reporting.

### Phase 7 — Lady Warden read-only aggregation — Complete

Lady Warden uses the same repository and Docker image as individual Ladies in
`ROLE=master`. It persists registrations in SQLite and queries registered
Ladies through authenticated private APIs. The current commands are `/servers`,
`/lady`, and `/sync`. Synchronization requests availability only; `/servers`
and `/lady` additionally request the player list for presentation. Their
online embeds use a single `Status` field with the player summary; unavailable
Ladies show only their wellness message.

### Future — Lady Warden infrastructure control

Accepted future responsibilities:

- health aggregation;
- authenticated coordination with Ladys;
- schedules such as daily server restarts;
- orchestration of prepare, stop, container restart, and post-restart validation;
- centralized alerts and audit;
- restricted container lifecycle management.

Individual Ladys remain necessary because they own Realm-specific work. Lady Warden must communicate with them through a private authenticated service contract rather than by sending Discord commands or parsing bot messages.

Any future Docker integration must be restricted to Warden-managed containers, preferably through a limited controller or Docker Socket Proxy and labels such as:

```text
warden.managed=true
warden.lady=astra
warden.realm=palworld
```

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

## 21. Non-goals for version 0.3.2

The following capabilities remain outside the immediate Palworld configuration-management delivery:

- multiple servers in one Lady container;
- multiple Realms in one Lady process;
- selection menus for server instances;
- unrestricted Docker socket access;
- REST or GraphQL public APIs;
- a web interface;
- database-backed permissions;
- dynamic module installation;
- hot-swapping Realms;
- automated game-server updates;
- VPN management;
- Playit.gg integration.

Configuration backups and rollback are explicitly in scope for the Palworld configuration phase.

---
## 22. Security principles

1. RCON remains private to the local Docker or LAN network.
2. The Discord bot is the authenticated bridge from Discord to the private RCON endpoint.
3. Secrets are injected at runtime.
4. Authorization denies access by default.
5. Destructive actions require stronger permissions and confirmation.
6. Logs must be useful without revealing credentials.
7. A compromised Lady token should affect only that Lady.
8. Each Lady uses a distinct Discord Application and token.
9. The bot should request only the Discord permissions and gateway intents it actually needs.
10. No privileged Docker socket access should be introduced without a specific reviewed need.
11. Host paths must be injected through container mounts; application code must not hard-code Unraid host paths.
12. A Lady may access only the Target server files and backup directory mounted into its own container.
13. Configuration writes require backup, validation, temporary-file generation, and atomic replacement.
14. Lady Warden must use restricted infrastructure control and may act only on explicitly Warden-managed containers.

---

## 23. Instructions for Codex

When modifying this repository:

1. Read this document before proposing structural changes.
2. Preserve the one-container-per-server deployment model.
3. Keep all game-specific behavior inside `src/lady/realms/<realm>/`.
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
16. Treat `ID`, `ROLE`, `REALM`, and `INSTANCE` as separate concepts.
17. Resolve Target files from mounted container roots; never build application paths from `/mnt/user`.
18. Preserve unknown Palworld settings when parsing and rewriting `OptionSettings`.
19. Write the real Palworld settings file only through validation, a shared
    configuration backup, temporary-file generation, and atomic replacement.
20. Use the writable backup mount only for Warden-managed snapshots of that
    Lady's Target.

---

## 24. Next task

Validate the Master deployment with Lady Iris:

1. publish the `0.3.2` image and update Lady Iris before the Master;
2. confirm retry registration, `/servers`, `/lady`, and `/sync` after the
   Master starts;
3. restart only the Master and confirm its SQLite registry still lists Iris;
4. update Lady Astra only after the Iris flow is confirmed.

After this integration validation, discover the Valheim Realm control surface:

1. inspect the existing Valheim container for supported remote administration
   and native backup capabilities;
2. identify the mounted world-data path and determine whether a live copy is a
   consistent recovery point;
3. define the smallest safe Valheim Realm command set;
4. reuse Core backup storage only after its source and consistency model are
   verified.
