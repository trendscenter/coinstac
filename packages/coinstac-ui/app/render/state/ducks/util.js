import app from 'ampersand-app';

export const logUI = (level, msg) => {
  app.renderLogger[level](msg);
};

export const notifyAndThrow = (err) => {
  logUI('error', err);
  app.notify({
    level: 'error',
    message: (err && err.message) || 'Unknown failure. :/',
  });
  throw err;
};
