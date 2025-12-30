import { describe, test, expect, beforeAll, vi } from 'vitest';
import logger from '../libs/logger';

describe('logger', () => {
  let logSpy: any;

  beforeAll(async () => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await logger.configure({ service: 'test', level: 'trace' });
  });

  test('log: out', () => {
    logger.out('test');
    expect(logSpy).toHaveBeenLastCalledWith('test');
  });

  test('log: trace level', () => {
    logger.trace('test');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('trace') && expect.stringContaining('test'),
    );
  });

  const levels = ['fatal', 'error', 'warn', 'info', 'http', 'verbose', 'trace'];
  for (const mode of [false, true])
    for (const l of levels) {
      test(`log: ${l.padEnd(7, ' ')} ${mode ? '(object)' : '(direct)'}`, async () => {
        if (mode) {
          logger[l]({
            module: 'testModule',
            message: 'test',
          });
        } else {
          logger[l]('test');
        }
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining(l) && expect.stringContaining('test'),
        );
      });
    }
});
