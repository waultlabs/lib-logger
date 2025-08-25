# lib-logger

Federated TypeScript/Node.js logger, compatible with local and cloud (AWS, Docker, etc.), with smart auto-configuration or manual setup.

## Available log levels

| Level   | Method  | Priority | Description              |
| ------- | ------- | -------- | ------------------------ |
| fatal   | fatal   | 0        | Critical error, shutdown |
| error   | error   | 1        | Application error        |
| warn    | warn    | 2        | Warning                  |
| info    | info    | 3        | General information      |
| http    | http    | 4        | HTTP requests            |
| verbose | verbose | 5        | Verbose details          |
| trace   | trace   | 6        | Execution traces         |

Each level has its own method:

```js
logger.fatal('message');
logger.error('message');
logger.warn('message');
logger.info('message');
logger.http('message');
logger.verbose('message');
logger.trace('message');
```

You can use these methods with a simple string (as shown above), but in most real-world scenarios, you will want to pass an object to provide more context to your logs.

### Log object structure

The log methods accept an object with the following properties:

| Property | Type               | Description                              |
| -------- | ------------------ | ---------------------------------------- |
| message  | string             | The log message (required)               |
| service  | string             | The name of your service (optional)      |
| module   | string             | The module or component name (optional)  |
| userdata | object (key-value) | Any additional data to attach (optional) |

Example:

```js
logger.error({
  message: 'Failed to connect to database',
  service: 'user-service',
  module: 'db-connector',
  userdata: { host: 'db.local', retry: 3 },
});
```

This approach is recommended for structured logging and better traceability in production environments.

## Logger configuration

### "Zeroconf" mode (auto-configuration)

If you do not call `logger.configure()`, the logger will automatically detect the environment (console, AWS, Docker, etc.) and choose the appropriate transport and level. Logs are buffered until auto-configuration completes.

### Manual configuration (recommended)

**Important: manual configuration must be done BEFORE any log method is called.**

```js
import logger from 'lib-logger';

await logger.configure({
  level: 'info', // or 'error', 'trace', ...
  service: 'your-service-name',
  transports: [
    /* custom transports */
  ],
});
```

## Available transports

- **console**: Raw output, no colors (for system logs or CI/CD)
- **pretty**: Enhanced output, colors and readable formatting (for developers)
- **json**: Structured JSON output (for ingestion, cloud, centralized logs)

The transport is chosen automatically based on the environment, but can be forced via configuration.

## Usage example

### ESM

```js
import logger, { prettyTransport } from '@waultlabs/lib-logger';

await logger.configure({
  level: 'info',
  service: 'my-app',
  transports: [prettyTransports()],
});

logger.info('Application started');
logger.error({
  message: 'Critical error',
  module: 'auth',
  userdata: { code: 500 },
});
```

### CommonJS

```js
const logger = require('@waultlabs/lib-logger').default;
const { jsonTransport } = require('@waultlabs/lib-logger');

await logger.configure({
  level: 'info',
  service: 'my-app',
  transports: [jsonTransport()],
});

logger.info('Application started');
logger.error({
  message: 'Critical error',
  module: 'auth',
  userdata: { code: 500 },
});
```

## Notes

- Logs are buffered until configuration is complete.
- The logger is compatible with Node.js, AWS Lambda, Docker, etc.
- To add a custom transport, pass it in the `transports` option during configuration.
