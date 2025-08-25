export type {
  LoggerOptions,
  LogEntry,
  Transport,
  ProcessableLogEntry,
} from './index.d';

export { default } from './libs/logger';
export { consoleTransport, prettyTransport } from './transports/terminal';
export { jsonTransport } from './transports/json';
