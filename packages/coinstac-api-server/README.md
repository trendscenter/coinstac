# coinstac-api-server

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

The API Server hosts the GraphQL endpoints called by the UI and other services.

## Installing/Running

  * Start MongoDB: `docker-compose up -d`
  * Navigate into `packages/coinstac-api-server` and `npm i`
  * Setup database with test data: `npm run test-setup`
  * Start server: `npm run start`

## License

MIT. See [LICENSE](./LICENSE) for details.
