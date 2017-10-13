# coinstac-api-server

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

COINSTAC experiment using [GraphQL](http://graphql.org/), [Hapi](https://hapijs.com/), [RethinkDB](https://www.rethinkdb.com/).

## Installing/Running

  * Install RethinkDB: `brew update && brew install rethinkdb`
  * Start RethinkDB: `rethinkdb`
  * Navigate into `packages/coinstac-api-server` and `npm i`
  * Setup Rethink with test data: `npm run test-setup`
  * Start server: `npm run start`
  * View GraphiQL: http://localhost:3100/graphiql
  * Query Computations via GraphiQL:
  ```graphql
    {
      fetchAllComputations {
        id
        meta {
          description
          version
          dockerImage
        }
      }
    }
  ```

## Todo
  * RethinkDB Changefeeds & Apollo Subscriptions
