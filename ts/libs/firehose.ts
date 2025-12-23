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
  level: LogLevel;
}

export interface FirehoseConfiguration {
  level: string | LogLevel;
}

// Buffer to hold logs before they are processed
// This is useful for testing or when the firehose is not yet initialized
const buffer: any[] = [];

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

  // Add error handling to prevent process crashes
  transform.on('error', (err) => {
    console.error('Transform stream error:', err);
    // Don't let stream errors crash the process
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

  // Add error handling to prevent process crashes
  writable.on('error', (err) => {
    console.error('Writable stream error:', err);
    // Don't let stream errors crash the process
  });

  // Default configuration
  let level: LogLevel = Level.INFO;

  // process configuration object
  if (userconfig) {
    // configure log level
    if (userconfig.level && typeof userconfig.level === 'string') {
      if (Object.keys(Level).indexOf(userconfig.level.toUpperCase()) !== -1) {
        level = Level[userconfig.level.toUpperCase()];
      }
    }
  }

  return { writable, transform, transports, level };
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
      if (log && log.level.priority <= firehose.level.priority) {
        // Handle write errors gracefully and respect backpressure
        firehose.writable.write(log, (error) => {
          if (error) {
            console.error('Logger write error:', error);
            // Don't crash the process on write errors
          }
        });
        // If write returns false, we should pause, but for logging we'll continue
        // to prevent blocking the application
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
