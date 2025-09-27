export interface LogLevel {
  label: string;
  priority: number;
  color: string;
}

export type Transport<T> = (data: T) => void | Promise<void>;

export interface LoggerOptions {
  level?: string;
  service?: string;
  transports?: Transport<ProcessableLogEntry>[];
}

export interface LogEntry {
  service?: string;
  module?: string;
  message: string;
  userdata?: { [key: string]: any };
}

export interface ProcessableLogEntry extends LogEntry {
  level: LogLevel;
  timestamp: number;
}

export const consoleTransport: () => Transport<ProcessableLogEntry>;
export const jsonTransport: () => Transport<ProcessableLogEntry>;
export const prettyTransport: () => Transport<ProcessableLogEntry>;

declare const logger: {
  configure: (options?: LoggerOptions) => Promise<void>;
  fatal: (record: LogEntry | string) => Promise<void>;
  error: (record: LogEntry | string) => Promise<void>;
  warn: (record: LogEntry | string) => Promise<void>;
  info: (record: LogEntry | string) => Promise<void>;
  http: (record: LogEntry | string) => Promise<void>;
  verbose: (record: LogEntry | string) => Promise<void>;
  trace: (record: LogEntry | string) => Promise<void>;
  out: (message: string) => void;
};

export default logger;
