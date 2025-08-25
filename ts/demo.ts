import logger from './libs/logger';

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
})().catch((error) => {
  console.error('Failed to configure logger:', error);
});
