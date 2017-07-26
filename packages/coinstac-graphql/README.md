# coinstac-graphql

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

COINSTAC experiment in [GraphQL](http://graphql.org/), [Hapi](https://hapijs.com/), [RethinkDB](https://www.rethinkdb.com/) and [Socket.io](https://socket.io/).

## Installing/Running

  * Install RethinkDB: `brew update && brew install rethinkdb`
  * Start RethinkDB: `rethinkdb`
  * Create `coinstac` database: http://localhost:8080/#tables
    * Add `Computations` table
  * Add computations to table: http://localhost:8080/#dataexplorer
    * `r.db('coinstac').table('Computations').insert([{ _Your Computation Here_ }])`
  * Clone repo: `git clone URL`
  * Navigate into repo and `npm i`
  * Start server: `npm run start`
  * View GraphiQL: http://localhost:3100/graphiql
  * Query Computations via GraphiQL:
  ```json {
      fetchAllComputations {
        url
        name
      }
    } 
  ```


## License

MIT. See [LICENSE](./LICENSE) for details.
