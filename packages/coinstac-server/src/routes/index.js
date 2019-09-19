const auth = require('./auth');
const pipeline = require('./pipeline');

// Add additional route files below
module.exports = pipeline.then(pipeline => [].concat(auth, pipeline));
