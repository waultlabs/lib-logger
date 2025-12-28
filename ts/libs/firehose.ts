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
  drainLock?: Promise<void>;
}

export interface FirehoseConfiguration {
  level: string | LogLevel;
}

// Create a firehose
export function createFirehose<T extends ProcessableLogEntry>(
  userconfig: FirehoseConfiguration,
): Firehose<T> {
  const transports: Transport<T>[] = [];

  // Transform stream to distribute logs to transports
  const transform = new Transform({
    objectMode: true,
    transform(chunk: T, encoding: string, callback: TransformCallback) {
      // Fire transports asynchronously without waiting
      transports.forEach((transport) => {
        try {
          Promise.resolve(transport(chunk)).catch((err) =>
            console.error(`Transport error: ${err}`),
          );
        } catch (err) {
          console.error(`Transport error: ${err}`);
        }
      });
      // Call callback immediately to allow the stream to drain
      callback(null, chunk);
    },
  });

  // Add error handling to prevent process crashes
  transform.on('error', (err) => {
    console.error('Transform stream error:', err);
    // Don't let stream errors crash the process
  });

  // Pipe the transform to a dummy writable to consume the readable side
  // This prevents the readable buffer from filling and blocking the writable side
  transform.pipe(
    new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        callback();
      },
    }),
  );

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
export async function pushLog<T extends ProcessableLogEntry>(
  firehose: Firehose<T>,
  log: T,
): Promise<void> {
  if (firehose.drainLock) {
    await firehose.drainLock;
  }

  if (firehose && firehose.writable) {
    if (log.level.priority <= firehose.level.priority) {
      if (!firehose.writable.write(log)) {
        // Create a new drain lock only if one doesn't already exist.
        if (!firehose.drainLock) {
          firehose.drainLock = new Promise<void>((resolve) => {
            firehose.writable.once('drain', () => {
              firehose.drainLock = undefined; // Clear the lock once drained.
              resolve();
            });
          });
        }
        await firehose.drainLock;
      }
    }
  }
}

// Get the writable stream for actors
export function getWritable<T>(firehose: Firehose<T>): Writable {
  return firehose.writable;
}
