# @tomelliot/obsidian-logger

Lightweight logger for Obsidian plugins. Provides prefixed console logging with environment-aware filtering and optional file logging.

## Install

```bash
npm install github:tomelliot/obsidian-logger
```

## Usage

```ts
import { createLogger } from "@tomelliot/obsidian-logger";

const log = createLogger("My Plugin");

log.debug("starting sync", { count: 42 });
log.info("sync complete");
log.warn("skipping stale entry");
log.error("failed to fetch", error);
```

## Behavior

| Level | Development | Production |
|-------|------------|------------|
| `debug` | console | suppressed* |
| `info` | console | suppressed* |
| `warn` | console | console |
| `error` | console | console |

\* `debug` and `info` are also shown in production when file logging is enabled.

## File logging

Optionally write logs to a file by providing an `appendLine` callback:

```ts
log.configureFileLogging({
  isDebugEnabled: () => settings.enableDebugLogging,
  appendLine: async (line) => {
    await fs.promises.appendFile(logPath, line, "utf-8");
  },
});
```

File log lines are formatted as `{ISO timestamp} [{LEVEL}] {message}\n`. Errors thrown by `appendLine` are silently swallowed to avoid affecting plugin behavior.

## License

MIT
