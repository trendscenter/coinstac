import app from 'ampersand-app';

export const notifyAndThrow = (err) => {
  app.notify('error', (err && err.message) || 'Unknown failure. :/');
  throw err;
};
