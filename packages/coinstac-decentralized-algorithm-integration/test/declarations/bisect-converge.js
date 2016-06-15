'use strict';

console.log(require.resolve('coinstac-example-computation-bisect-converge'));

module.exports = {
  users: [
    { username: 'jamin', userData: null },
    { username: 'sergey', userData: null },
    { username: 'drew', userData: null },
    { username: 'ross', userData: null },
  ],
  computationPath: require.resolve('coinstac-example-computation-bisect-converge'),
  verbose: true,
};
