/**
 * Console transport for logging to the console.
 */

import { Transport } from '../index.d';
import { ProcessableLogEntry } from '../libs/firehose';

export function jsonTransport(): Transport<ProcessableLogEntry> {
  return (log: ProcessableLogEntry) => {
    const entry = {
      ...log,
      level: log.level.label,
    };
    console.log(JSON.stringify(entry));
  };
}
