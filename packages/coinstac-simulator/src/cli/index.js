#!/usr/bin/env node
'use strict';

const sim = require('../');
const program = require('./parse-cli');
const path = require('path');

const declPath = path.resolve(process.cwd(), program.declaration);
sim.run(declPath);
