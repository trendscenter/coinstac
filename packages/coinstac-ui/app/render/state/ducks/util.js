import app from 'ampersand-app';

export const notifyAndThrow = (err) => {
  app.logger.error(err);
  app.notify({
    level: 'error',
    message: (err && err.message) || 'Unknown failure. :/',
  });
  throw err;
};
