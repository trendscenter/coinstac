# coinstac-api-server

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

COINSTAC experiment using [GraphQL](http://graphql.org/), [Hapi](https://hapijs.com/), [RethinkDB](https://www.rethinkdb.com/).

## Installing/Running

  * Install RethinkDB: `brew update && brew install rethinkdb`
  * Start RethinkDB: `rethinkdb`
  * Create `coinstac` database: http://localhost:8080/#tables
    * Add `Computations` table
  * Add computations to table: http://localhost:8080/#dataexplorer
    * `r.db('coinstac').table('Computations').insert([{ _Your Computation Here_ }])`
    * Two example Computation inserts can be found in `computations-queries.txt`
    * Preferrably, you can add computations in the UI through the `Submit Computations ` navigation item.
      * There are two json files in this directory, Multi-Shot and Single-Shot, that can be uploaded.
  * Navigate into `packages/coinstac-api-server` and `npm i`
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
