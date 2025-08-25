import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import logger from '../libs/logger';

/**
 * Unit test the logger at a specific level using direct or object call
 */

let logSpy: any;

describe('Logging utilities', () => {
  const logUnitTest = (level: string, withComponent: boolean) =>
    test(`log: ${level.padEnd(7, ' ')} ${withComponent ? '(object)' : '(direct)'}`, async () => {
      if (withComponent) {
        await logger[level]({
          component: 'testComponent',
          message: 'test',
        });
      } else {
        await logger[level]('test');
      }
      expect(logSpy).toHaveBeenLastCalledWith(expect.stringContaining(level));
      expect(logSpy).toHaveBeenLastCalledWith(expect.stringContaining('test'));
    });

  /**
   * Before all tests: make sure to clear any previous mocks
   */

  beforeAll(async () => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await logger.configure({ level: 'trace' });
  });

  /**
   * Test the logger
   */

  describe('Test direct output to console', () => {
    test(`log: out`, () => {
      logger.out('test');
      expect(logSpy).toHaveBeenLastCalledWith('test');
    });
  });

  describe('Test the logging facility', () => {
    const levels = ['fatal', 'error', 'warn', 'info', 'http', 'verbose'];
    for (const mode of [false, true])
      for (const l of levels) logUnitTest(l, mode);
  });

  /**
   * After all tests: make sure to clear all mocks
   */

  afterAll(async () => {
    vi.clearAllMocks();
  });
});
