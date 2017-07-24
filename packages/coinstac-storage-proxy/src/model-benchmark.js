'use strict';

/**
 * The results of running this file indicate that there is a *relatively*
 * large penalty for instantiating coinstac-common models compared to operating
 * on plain objects. Note that this is *relatively* large, but *absolutely*
 * small: less than 1ms per operation...
 */

/* eslint-disable no-console */
const Consortium = require('coinstac-common').models.Consortium;

const config = {
  _id: 'thisisonlyatest',
  users: ['adumbledor', 'hpotter'],
  owners: ['adumbledor'],
  description: 'foo',
  label: 'foo',
  tags: ['foo'],
};

const compareUsernames = (uname1, uname2) => {
  return uname1.toLowerCase().trim() === uname2.toLowerCase().trim();
};

const hasMember = (consortium, username) => {
  return consortium.users.some(compareUsernames.bind(null, username));
};

let i = 0;

console.log('Running 10,000 iterations of `hasMember`');

console.time('Model');
while (i < 10000) {
  i += 1;
  const myConsortium = new Consortium(config);
  myConsortium.hasMember('adumbledor');
}

console.timeEnd('Model');

i = 0;
console.time('Call Method');
while (i < 10000) {
  i += 1;
  Consortium.prototype.hasMember.call(config, 'adumbledor');
}

console.timeEnd('Call Method');

i = 0;
console.time('Pure Function');
while (i < 10000) {
  i += 1;
  hasMember(config, 'adumledor');
}

console.timeEnd('Pure Function');
/* eslint-enable no-console */
