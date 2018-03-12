# coinstac-decentralized-algorithm-integration

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

**This package is unused as of COINSTAC v3**

COINSTAC distributed analysis synchronization and testing. [Documentation](http://mrn-code.github.io/coinstac/).

## what

this package serves the following purposes:

- provide templates for how to easily design and publish a DecentralizedComputation
- provide a common place to run various integration tests through the coinstac-* infrastructure

## how

this package runs various DecentralizedComputation simulations using _coinstac-simulator_.  simulation declarations are defined in `test/declarations`.

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
