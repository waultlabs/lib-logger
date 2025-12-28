import logger from './libs/logger';

let number = 0;

(async () => {
  logger.out('direct out message');

  logger.fatal('This is a fatal error');
  logger.error('This is an error message');
  logger.warn('This is a warning');
  logger.info('This is an informational message');
  logger.http('This is an HTTP log');
  logger.verbose('This is a verbose log');
  logger.trace('This is a trace log');

  setTimeout(() => {
    logger.info({
      message: 'later on...',
      service: 'my-component',
      module: 'my-mmodule',
      userdata: { some: 'payload' },
    });
  }, 3000);

  logger.trace({
    message: 'very long module name that should be truncated',
    module: 'app/controller/service/user',
    userdata: { some: 'payload' },
  });

  setInterval(() => {
    logger.trace({ message: `periodic log #${++number}` });
    logger.info({ message: `periodic log #${++number}` });
  }, 2000);
})().catch((error) => {
  console.error('Failed to configure logger:', error);
});
