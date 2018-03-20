# coinstac-api-server

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

The API Server hosts the GraphQL endpoints called by the UI and other services accessing RethinkDB. 

## Installing/Running

  * Install RethinkDB: `brew update && brew install rethinkdb`
  * Start RethinkDB: `rethinkdb`
  * Navigate into `packages/coinstac-api-server` and `npm i`
  * Setup Rethink with test data: `npm run test-setup`
  * Start server: `npm run start`

## License

MIT. See [LICENSE](./LICENSE) for details.