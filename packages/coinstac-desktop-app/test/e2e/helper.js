module.exports = {
  logFilter: (log) => {
    if (!log) {
      return false;
    }

    try {
      const { level } = JSON.parse(log);
      if (level === 'verbose' || level === 'info') {
        return false;
      }
    } catch {} // eslint-disable-line no-empty

    const filters = [/deprecated/i, /chromedriver/i, /devtools/i];

    for (const param of filters) { // eslint-disable-line no-restricted-syntax
      if (log.search(param) !== -1) {
        return false;
      }
    }

    return true;
  },
};
