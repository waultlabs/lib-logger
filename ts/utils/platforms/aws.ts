import fs from 'fs';

/**
 * Check if the current environment is running in AWS Lambda
 */
const awslambda = async (): Promise<RunningHardware> => {
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return {
      provider: 'aws',
      subsystem: 'lambda',
      transport: 'json',
      weight: 20,
    };
  }
  return Promise.reject(new Error('Not running in AWS Lambda'));
};

/**
 * Check if the current environment is running in a Docker container or Fargate
 */
const awsecs = async (): Promise<RunningHardware> => {
  // Check Docker
  try {
    fs.statSync('/.dockerenv');
    return {
      provider: 'aws',
      subsystem: 'ecs',
      transport: 'json',
      weight: 20,
    };
  } catch {
    void 0;
  }
  try {
    const cgroupInfo = fs.readFileSync('/proc/1/cgroup', 'utf8');
    if (cgroupInfo.includes('docker')) {
      return {
        provider: 'aws',
        subsystem: 'ecs',
        transport: 'json',
        weight: 20,
      };
    }
  } catch {
    void 0;
  }
  if (process.env.DOCKER || process.env.DOCKER_CONTAINER) {
    return {
      provider: 'aws',
      subsystem: 'ecs',
      transport: 'json',
      weight: 20,
    };
  }

  // Check Fargate
  try {
    if (process.env.AWS_EXECUTION_ENV === 'AWS_ECS_FARGATE') {
      return {
        provider: 'aws',
        subsystem: 'ecs',
        transport: 'json',
        weight: 20,
      };
    }
    const metadataUri = process.env.ECS_CONTAINER_METADATA_URI_V4;
    if (metadataUri) {
      return {
        provider: 'aws',
        subsystem: 'ecs',
        transport: 'json',
        weight: 20,
      };
    }
    try {
      const cgroupInfo = fs.readFileSync('/proc/1/cgroup', 'utf8');
      if (cgroupInfo.includes('ecs')) {
        return {
          provider: 'aws',
          subsystem: 'ecs',
          transport: 'json',
          weight: 20,
        };
      }
    } catch {
      void 0;
    }
  } catch {
    void 0;
  }

  return Promise.reject(new Error('Not running in ECS or Fargate'));
};

/**
 * Check if the current environment is running on AWS EC2
 */
const awsec2 = async (): Promise<RunningHardware> => {
  // Check for AWS-specific environment variables
  if (process.env.AWS_EXECUTION_ENV || process.env.EC2_INSTANCE_ID) {
    return {
      provider: 'aws',
      subsystem: 'ec2',
      transport: 'cloudwatch',
      weight: 20,
    };
  }

  // Check for EC2 instance metadata service
  try {
    const response = await fetch(
      'http://169.254.169.254/latest/meta-data/instance-id',
      {
        method: 'GET',
        signal: AbortSignal.timeout(1000), // 1 second timeout
      },
    );
    if (response.ok) {
      return {
        provider: 'aws',
        subsystem: 'ec2',
        transport: 'cloudwatch',
        weight: 20,
      };
    }
  } catch {
    void 0;
  }

  // Check for EC2-specific files
  try {
    const xenInfo = fs.readFileSync('/sys/hypervisor/uuid', 'utf8');
    if (xenInfo && xenInfo.startsWith('ec2')) {
      return {
        provider: 'aws',
        subsystem: 'ec2',
        transport: 'cloudwatch',
        weight: 20,
      };
    }
  } catch {
    void 0;
  }

  try {
    const awsInfo = fs.readFileSync(
      '/sys/devices/virtual/dmi/id/product_name',
      'utf8',
    );
    if (awsInfo && awsInfo.toLowerCase().includes('amazon')) {
      return {
        provider: 'aws',
        subsystem: 'ec2',
        transport: 'cloudwatch',
        weight: 20,
      };
    }
  } catch {
    void 0;
  }

  return Promise.reject(new Error('Not running on EC2'));
};

export { awslambda, awsecs, awsec2 };
