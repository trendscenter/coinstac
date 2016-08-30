# coinstac-decentralized-algorithm-integration

<img src="https://github.com/MRN-Code/coinstac-common/blob/master/img/coinstac.png" height="75px" />

[ ![Codeship Status for MRN-Code/coinstac-decentralized-algorithm-integration](https://codeship.com/projects/52e2c720-b1b4-0133-6b78-66cd7c0bebc3/status?branch=master)](https://codeship.com/projects/133147)

## what

this package serves the following purposes:

- provide templates for how to easily design and publish a DecentralizedComputation
- provide a common place to run various integration tests through the coinstac-* infrastructure

## how

this package runs various DecentralizedComputation simulations using [coinstac-simulator](coinstac-simulator).  simulation declarations are defined in `test/declarations`.

to run the integration tests:

- install [nodejs](https://nodejs.org/)
- clone this repository, and change into the directory on the command line
- run the command `npm install` to install just a few basic algorithms used in our examples
- run `npm test` to run `coinstac-simulator` against our integration test algorithms

## why

to ensure that the coinstac infrastructure is always properly running DecentralizedComputations.

## when

now.

## where

right there at your desk.

## it's not working

file an issue!  we will try and be prompt, and even try to help you with your algorithms if necessary.

# License

MIT. See [LICENSE](./LICENSE) for details.
