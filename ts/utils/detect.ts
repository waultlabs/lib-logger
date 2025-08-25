/**
 * Detects the current environment and provides the right configuration to the logger.
 * Transports are configured based on the environment.
 */

import { term, prettyterm } from './platforms/terminal';
import { awsec2, awsecs, awslambda } from './platforms/aws';
import { docker } from './platforms/docker';

const detectRunningHardware = async (): Promise<RunningHardware> => {
  const results = await Promise.allSettled([
    term(),
    prettyterm(),
    awsec2(),
    awsecs(),
    awslambda(),
    docker(),
  ]);

  // Filter fulfilled promises and extract their values
  const filteredResults = results
    .filter(
      (result): result is PromiseFulfilledResult<RunningHardware> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value)
    .sort((a, b) => b.weight - a.weight);
  if (filteredResults && filteredResults.length > 0) {
    return filteredResults[0];
  } else {
    return {
      provider: 'unknown',
      subsystem: 'unknown',
      transport: 'json',
      weight: 0,
    };
  }
};

export { detectRunningHardware };
