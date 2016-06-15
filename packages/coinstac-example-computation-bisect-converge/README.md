# coinstac-example-computation-bisect-converge

[ ![Codeship Status for MRN-Code/coinstac-example-computation-bisect-converge](https://codeship.com/projects/a584c7c0-f9f6-0133-2f5f-124ad23604b3/status?branch=master)](https://codeship.com/projects/151444) [![Coverage Status](https://coveralls.io/repos/github/MRN-Code/coinstac-example-computation-bisect-converge/badge.svg?branch=master)](https://coveralls.io/github/MRN-Code/coinstac-example-computation-bisect-converge?branch=master)

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac-common/master/img/coinstac.png" height="75px" />

# install

`npm install coinstac-example-computation-bisect-converge`

# what

this is an example coinstac decentralized computation.  this package also bundles the coinstac-simulator, allowing users to run, fiddle, & play with the system for learning purposes.

this example does not perform a meaningful analysis.  instead, it emulates the coinstac system behavior and network utilities whilst running a simple algorithm.

this particular algorithm performs the following:

- a series of users guess a random integers between 0 and 100
- after the first user makes his/her guess, the coinstac central computation server selects a random number from the same range
- on every response from the server, each client selects a value exactly halfway between his/her last guess and the value the central server selected
- once a user's value is within 10% of the server's selected value, the server considers that user to be "converged."
  - interestingly, each user will continue to get closer and closer to the server's value (asymptotically) while his/her peers still progress to conversion.

# why

it's a good starting point for new coinstac developers to see how coinstac operates.

# when

now.

# who

you, your computer, and your pal, the internet.

# how

see #install and #run

# run

- navigate into the project directory
- install dependencies, `npm install`
- `npm test`

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac-simulator/master/media/demo-capture.gif" />
