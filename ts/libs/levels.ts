export interface LogLevel {
  label: string;
  priority: number;
  color: string;
}

/**
 * Define the log levels with their respective labels, priorities, and colors.
 */
const Level: { [key: string]: LogLevel } = {
  FATAL: {
    label: 'fatal',
    priority: 0,
    color: '\x1b[97;101;1m',
  },
  ERROR: {
    label: 'error',
    priority: 1,
    color: '\x1b[91m',
  },
  WARN: {
    label: 'warn',
    priority: 2,
    color: '\x1b[33m',
  },
  INFO: {
    label: 'info',
    priority: 3,
    color: '\x1b[32m',
  },
  HTTP: {
    label: 'http',
    priority: 4,
    color: '\x1b[94m',
  },
  VERBOSE: {
    label: 'verbose',
    priority: 5,
    color: '\x1b[37m',
  },
  TRACE: {
    label: 'trace',
    priority: 6,
    color: '\x1b[35m',
  },
};

export default Level;
