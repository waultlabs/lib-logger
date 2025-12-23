/**
 * A federated logger for both local development and AWS.
 */

import { LoggerOptions, Transport, type LogEntry } from '../index.d';
import {
  createFirehose,
  Firehose,
  ProcessableLogEntry,
  pushLog,
} from './firehose';
import { consoleTransport, prettyTransport } from '../transports/terminal';
import { jsonTransport } from '../transports/json';
import Levels, { type LogLevel } from './levels';
import { detectRunningHardware } from '../utils/detect';

/**
 * Logger configuration
 */

let firehose: Firehose<ProcessableLogEntry> | undefined;
let service: string = 'lib-logger';

// Lock to avoid race condition between user configuration call and zero-configuration
let configPromise: Promise<void> | null = null;

// Queue to store log entries until configuration is complete
let pendingLogs: ProcessableLogEntry[] = [];
let isConfigured = false;

const configure = async (options: LoggerOptions = {}): Promise<void> => {
  // Deal with lock
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    if (options.service) service = options.service;

    const runningHardware: RunningHardware = await detectRunningHardware();
    let transport: Transport<ProcessableLogEntry>;
    switch (runningHardware.transport) {
      case 'console':
        transport = consoleTransport();
        break;
      case 'pretty':
        transport = prettyTransport();
        break;
      case 'json':
        transport = jsonTransport();
        break;
      default:
        transport = jsonTransport();
        break;
    }

    if (!firehose) {
      firehose = createFirehose<ProcessableLogEntry>({
        level: options.level || process.env.LOG_LEVEL || 'info',
      });
    } else {
      // Update level if firehose already exists
      const level = options.level || process.env.LOG_LEVEL || 'info';
      if (typeof level === 'string') {
        if (Object.keys(Levels).indexOf(level.toUpperCase()) !== -1) {
          firehose.level = Levels[level.toUpperCase()];
        }
      }
    }
    // Register transports
    if (options.transports && options.transports.length > 0) {
      firehose.transports.length = 0;
      firehose.transports.push(...options.transports);
    } else {
      firehose.transports.push(transport);
    }

    // Mark configuration as complete
    isConfigured = true;

    // Say hello after transports are set up but before processing pending logs
    pushLog(firehose!, {
      level: Levels.VERBOSE,
      timestamp: Date.now(),
      message: 'firehose initialized, flushing buffered logs',
      service: 'lib-logger',
      module: 'lib-logger',
    });

    // Process any pending logs in order
    for (const entry of pendingLogs) {
      pushLog(firehose!, entry);
    }
    pendingLogs = []; // Clear the queue

    pushLog(firehose!, {
      level: Levels.VERBOSE,
      timestamp: Date.now(),
      message: 'buffered logs flushed',
      service: 'lib-logger',
      module: 'lib-logger',
    });
  })();

  return configPromise;
};

/**
 * Internal logging methods
 */

const log = async (level: LogLevel, record: LogEntry) => {
  // prepare the statement
  let entry: ProcessableLogEntry = {
    level: level,
    timestamp: Date.now(),
    message: record.message,
    service: record.service || service,
    module: record.module || 'default',
  };
  if (record.userdata) {
    entry = {
      ...entry,
      userdata: record.userdata,
    };
  }
  // If not configured, queue the log; otherwise, push immediately
  if (!isConfigured || !firehose) {
    pendingLogs.push(entry);
    await configure({}); // Trigger zeroconf autoconf if not configured yet
  } else {
    await configPromise; // Wait for configuration to complete
    pushLog(firehose, entry);
  }
};

/**
 * Public logging methods
 */

const createLogLevelMethod = (level: LogLevel) => {
  return async (record: LogEntry | string): Promise<void> => {
    if (typeof record === 'string') {
      await log(level, { message: record });
    } else {
      await log(level, record);
    }
  };
};

const fatal = createLogLevelMethod(Levels.FATAL);
const error = createLogLevelMethod(Levels.ERROR);
const warn = createLogLevelMethod(Levels.WARN);
const info = createLogLevelMethod(Levels.INFO);
const http = createLogLevelMethod(Levels.HTTP);
const verbose = createLogLevelMethod(Levels.VERBOSE);
const trace = createLogLevelMethod(Levels.TRACE);

const out = (message: string) => {
  console.log(message);
};

/**
 * Reset function for testing - clears all state
 */
const reset = () => {
  firehose = undefined;
  configPromise = null;
  pendingLogs = [];
  isConfigured = false;
};

/**
 * Export the logger object
 */

export default {
  configure,
  fatal,
  error,
  warn,
  info,
  http,
  verbose,
  trace,
  out,
  reset,
};
