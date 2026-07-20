# Local validation

This directory is reserved for disposable local validation.

Only this document is versioned. Scripts, output, packet captures, copied
configuration and other test artifacts stay local and are ignored by Git.

## Principles

- Validate a change through the same Docker image that will run in Unraid.
- Use the intended Lady environment and confirm its `ROLE`, `REALM`, `ID`, RCON
  target and mounts before executing a check.
- Prefer the smallest check that proves the changed behavior.
- Keep production code free from test-only paths, parsers, feature flags and
  debug output.
- Treat a failed or unexplained validation as a blocker for the related commit.

## Validation flow

1. Inspect the diff and identify the exact behavior that changed.
2. Build the production Docker target. The TypeScript build and dependency audit
   must complete successfully.
3. Run a local, disposable script from this directory against the configured
   Lady only when it is needed to validate the change.
4. Exercise the affected command or service and record the outcome in the
   working conversation, not in a committed artifact.
5. Check the application logs for errors, warnings and unexpected output.
6. Run `git diff --check` and confirm that the proposed commit contains only
   the validated production files.

## Server safety

- Read-only checks are preferred: connection/authentication, status, players
  and configuration reads.
- State-changing commands such as save, backup, configuration writes and
  shutdown require explicit approval for the target server.
- Never include shutdown in a broad validation run.
- Never expose credentials or copy real server data into versioned files.

## Commit gate

A production change is ready to commit only when its behavior is understood,
the relevant validation has passed, no regression is observed in adjacent
commands, and its diff is isolated from unrelated work.

Do not commit a workaround solely because it makes one command pass. First
establish the cause, keep the fix in the responsible realm or core boundary,
and validate it through Docker.
