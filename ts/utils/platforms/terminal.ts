import { hasColors } from '../terminal';

const term = async (): Promise<RunningHardware> => {
  if (process.stdout.isTTY) {
    return {
      provider: 'onprem',
      subsystem: 'terminal',
      transport: 'console',
      weight: 0,
    };
  } else {
    return Promise.reject('not a TTY');
  }
};

const prettyterm = async (): Promise<RunningHardware> => {
  if (hasColors()) {
    return {
      provider: 'onprem',
      subsystem: 'terminal',
      transport: 'pretty',
      weight: 1,
    };
  } else {
    return Promise.reject('TTY does not support ANSI colors');
  }
};

export { term, prettyterm };
