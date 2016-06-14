/**
 * Test to make sure that the decentralized computations registry is properly
 * formatted. This ensures that anyone opening a pull request to add their
 * decentralized computation to the repo does it in the right format.
 *
 * Each entry should look like:
 *
 *     {
 *       "name": "the-ravens",
 *       "tags": ["1.0.0", "2.0.0", "3.0.0"],
 *       "url": "https://github.com/MRN-Code/the-ravens"
 *     }
 */
'use strict';

// `require`-ing ensures it's in the right place
const decentralizedComputations =
    require('../../src/decentralized-computations.json');
const joi = require('joi');
const semver = require('semver');
const tape = require('tape');

const scheme = joi.array().items(joi.object().keys({
  name: joi.string().min(4).required(),
  tags: joi.array().items(joi.string().min(5).required()).required(),
  url: joi.string().uri().regex(/github.com/).required(),
}));

tape('every entry is valid', t => {
    /**
     * Joi's `validate` API is a little confusing:
     * {@link https://github.com/hapijs/joi/blob/v7.2.3/API.md#joi}
     */
  const result = joi.validate(decentralizedComputations, scheme);

  if (result.error) {
    return t.end(result.error);
  }

  t.pass();
  t.end();
});

tape('all tags are semver', t => {
  decentralizedComputations.forEach(computation => {
    computation.tags.forEach(tag => {
      if (!semver.valid(tag)) {
        t.end(`“${computation.name}” has invalid tag: “${tag}”`);
      }
    });
  });

  t.pass();
  t.end();
});
