const helperFunctions = require('../../auth-helpers');

function preprocessUserMetadataChangedSubs(user) {
  if (user.delete) {
    return Promise.resolve(user);
  }

  return helperFunctions.getUserDetailsByID({ id: user.id });
}

module.exports = preprocessUserMetadataChangedSubs;
