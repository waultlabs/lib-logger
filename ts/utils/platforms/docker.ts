import { promises as fs } from 'fs';

const docker = async (): Promise<RunningHardware> => {
  // check for typical docker file
  try {
    await fs.access('/.dockerenv');
    return {
      provider: 'docker',
      subsystem: 'terminal',
      transport: 'json',
      weight: 10,
    };
  } catch {
    void 0;
  }
  // analyze cgroup
  try {
    const cgroupInfo = await fs.readFile('/proc/1/cgroup', 'utf8');
    if (cgroupInfo.includes('docker')) {
      return {
        provider: 'docker',
        subsystem: 'terminal',
        transport: 'json',
        weight: 10,
      };
    }
  } catch {
    void 0;
  }
  // Optional: Check for environment variables
  if (process.env.DOCKER || process.env.DOCKER_CONTAINER) {
    return {
      provider: 'docker',
      subsystem: 'terminal',
      transport: 'json',
      weight: 10,
    };
  }
  return Promise.reject(new Error('Not running in Docker'));
};

export { docker };
