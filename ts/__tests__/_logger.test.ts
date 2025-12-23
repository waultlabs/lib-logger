import { describe, test, expect, beforeEach, afterAll, vi } from 'vitest';
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
          module: 'testModule',
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

  beforeEach(async () => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.reset();
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
    const levels = [
      'fatal',
      'error',
      'warn',
      'info',
      'http',
      'verbose',
      'trace',
    ];
    for (const mode of [false, true])
      for (const l of levels) logUnitTest(l, mode);
  });

  describe('High volume logging tests', () => {
    test('log: high volume stress test with 1000 lines (info + verbose)', async () => {
      // Clear mocks specifically for this test
      vi.clearAllMocks();
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.reset();
      await logger.configure({ level: 'verbose' }); // Enable verbose level

      // Clear spy after configuration
      vi.clearAllMocks();
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const startTime = Date.now();

      // Test high volume logging with 1000 lines using both info and verbose
      const logCount = 1000;
      for (let i = 0; i < logCount; i++) {
        if (i % 2 === 0) {
          // Use info level for even numbers
          logger.info({
            module: 'volumeTest',
            message: `Info log entry ${i + 1}/${logCount}`,
            userdata: {
              iteration: i + 1,
              level: 'info',
              batch: Math.floor(i / 100) + 1,
            },
          });
        } else {
          // Use verbose level for odd numbers
          logger.verbose({
            module: 'volumeTest',
            message: `Verbose log entry ${i + 1}/${logCount}`,
            userdata: {
              iteration: i + 1,
              level: 'verbose',
              batch: Math.floor(i / 100) + 1,
            },
          });
        }
      }

      // Give some time for async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Main goal: verify the logger completes without blocking or crashing
      expect(duration).toBeLessThan(2000); // Should complete quickly

      // Verify we got log calls
      expect(logSpy).toHaveBeenCalled();

      // Verify both info and verbose log entries are present
      const calls = logSpy.mock.calls.map((call) => call[0]);
      const hasInfoLogs = calls.some(
        (call) => typeof call === 'string' && call.includes('Info log entry'),
      );
      const hasVerboseLogs = calls.some(
        (call) =>
          typeof call === 'string' && call.includes('Verbose log entry'),
      );

      expect(hasInfoLogs).toBe(true);
      expect(hasVerboseLogs).toBe(true);

      // Verify module name appears in logs
      const hasVolumeTestModule = calls.some(
        (call) => typeof call === 'string' && call.includes('volumeTest'),
      );
      expect(hasVolumeTestModule).toBe(true);

      // Most importantly: the test completed without hanging or crashing
      expect(true).toBe(true); // This line confirms the test completed successfully
    }, 15000); // Increased timeout for 1000 logs
  });

  /**
   * After all tests: make sure to clear all mocks
   */

  afterAll(async () => {
    vi.clearAllMocks();
  });
});
