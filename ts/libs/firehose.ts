/**
 * Dispatcher that acts a firehose for log entries to transports.
 */

import { Writable, Transform, TransformCallback } from 'stream';
import { LogEntry, Transport } from '../index.d';
import Level, { type LogLevel } from './levels';

export interface ProcessableLogEntry extends LogEntry {
  level: LogLevel;
  timestamp: number;
}

// Interface for the firehose state
export interface Firehose<T> {
  writable: Writable;
  transform: Transform;
  transports: Transport<T>[];
}

export interface FirehoseConfiguration {
  level: string | LogLevel;
}

// Buffer to hold logs before they are processed
// This is useful for testing or when the firehose is not yet initialized
const buffer: any[] = [];

// configuration of the firehose
const conf: FirehoseConfiguration = {
  level: Level.INFO,
};

// Create a firehose
export function createFirehose<T>(
  userconfig: FirehoseConfiguration,
): Firehose<T> {
  const transports: Transport<T>[] = [];

  // Transform stream to distribute logs to transports
  const transform = new Transform({
    objectMode: true,
    transform(chunk: T, encoding: string, callback: TransformCallback) {
      Promise.all(
        transports.map(async (transport) => {
          try {
            await Promise.resolve(transport(chunk));
          } catch (err) {
            console.error(`Transport error: ${err}`);
          }
        }),
      )
        .then(() => callback(null, chunk))
        .catch((err) => callback(err));
    },
  });

  // Writable stream for actors to push logs
  const writable = new Writable({
    objectMode: true,
    write(
      chunk: T,
      encoding: BufferEncoding,
      callback: (error?: Error | null) => void,
    ) {
      transform.write(chunk, encoding, callback);
    },
  });

  // process configuration object
  if (userconfig) {
    // configure log level
    if (userconfig.level && typeof userconfig.level === 'string') {
      if (Object.keys(Level).indexOf(userconfig.level.toUpperCase()) !== -1) {
        conf.level = Level[userconfig.level.toUpperCase()];
      }
    }
  }

  return { writable, transform, transports };
}

// Register a transport
export function registerTransport<T>(
  firehose: Firehose<T>,
  transport: Transport<T>,
): void {
  firehose.transports.push(transport);
}

// Push a log entry to the firehose
export function pushLog<T>(firehose: Firehose<T>, log: T): void {
  // bufferize
  buffer.push(log);
  // If the firehose is not initialized, we can return early
  if (firehose && firehose.writable) {
    // push the buffered logs
    while (buffer.length > 0) {
      const log = buffer.shift();
      if (log && log.level.priority <= (conf.level as LogLevel).priority) {
        firehose.writable.write(log);
      } else {
        // Discard log entries above the configured level
        void 0;
      }
    }
  }
}

// Get the writable stream for actors
export function getWritable<T>(firehose: Firehose<T>): Writable {
  if (!firehose || !firehose.writable) {
    throw new Error(
      'Firehose is not initialized or writable stream is missing',
    );
  }
  return firehose.writable;
}
