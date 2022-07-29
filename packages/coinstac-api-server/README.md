# coinstac-api-server

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

The API Server hosts the GraphQL endpoints called by the UI and other services.

## Installing/Running

  * Start MongoDB: `docker-compose up -d`
  * Navigate into `packages/coinstac-api-server` and `npm i`
  * Setup database with test data: `npm run test-setup`
  * Start server: `npm run start`

## AWS keys for vault-only runs
The following environment variables are needed for uploading and downloading run assets from s3
AWS_S3_RUN_ASSETS_BUCKET_NAME=
AWS_S3_ACCESS_KEY_ID=
AWS_S3_SECRET_ACCESS_KEY=
## License

MIT. See [LICENSE](./LICENSE) for details.
