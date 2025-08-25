/**
 * Console transport for logging to the console.
 */

import { Transport } from '../index.d';
import { ProcessableLogEntry } from '../libs/firehose';

const formatter = (entry: ProcessableLogEntry): string => {
  const module =
    (entry.module &&
      (entry.module.length <= 20
        ? entry.module
        : '…' + entry.module.slice(-19))) ||
    'default';
  let formattedString = '';
  formattedString += `\x1b[90m${new Date(entry.timestamp).toISOString()}\x1b[0m ${entry.level.color}${entry.level.label.padEnd(7)}\x1b[0m \x1b[96m${module}:\x1b[0m ${entry.message}`;
  if (entry.userdata) {
    formattedString += `\n\x1b[37m${JSON.stringify(entry.userdata, null, 2)}\x1b[0m`;
  }
  return formattedString;
};

const prettyTransport = (): Transport<ProcessableLogEntry> => {
  return (log: ProcessableLogEntry) => {
    const formattedEntry = formatter(log);
    console.log(formattedEntry);
  };
};

const consoleTransport = (): Transport<ProcessableLogEntry> => {
  return (log: ProcessableLogEntry) => {
    const formattedEntry = formatter(log);
    // eslint-disable-next-line no-control-regex
    console.log(formattedEntry.replaceAll(/\x1b\[\d+m/g, ''));
  };
};

export { consoleTransport, prettyTransport };
