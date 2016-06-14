'use strict';

const path = require('path');
const sim = require('coinstac-simulator');
const noop = require('lodash/noop');

const declaration = path.resolve(__dirname, './declaration');
sim.setup(declaration)
.then(() => sim.teardown(noop));
