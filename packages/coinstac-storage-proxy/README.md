# coinstac-storage-proxy

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

COINSTAC hapi plugin for securing CouchDB. [Documentation](http://mrn-code.github.io/coinstac/).

A [hapi](http://hapijs.com) plugin that registers HTTP endpoints to perform authentication and
authorization of requests to the COINSTAC storage service (CouchDB).

## Installation

```
# install from git
npm i --save coinstac-storage-proxy
```

## Use:

See API [documentation here](http://mrn-code.github.io/coinstac-storage-proxy/).
### Dependencies
* h2o2 (hapi plugin)
* authentication: This plugin assumes that you have set up authentiation on
your hapi server already, and expects to find the user's username at
`request.auth.config.username` to perform authorization.

```
const hapi = require('hapi');
const storageProxy = require('coinstac-storage-proxy');
const h2o2 = require('h2o2'); //proxy utility for hapi

const server = new hapi.Server();
server.connection(); //set up default hapi connection

server.register(
    [
        {
            register: storageProxy,
            options: { targetBaseUrl: 'http://localhost:5984'}
        },
        h2o2
    ],
    (err) => {
        if (err) {
            //something went wrong
        }
    }
);

server.start();
```

## Configuration Options:

* targetBaseUrl **required** sets the baseUrl for redirection.

  * Must include:
      * protocol (e.g. 'http')
      * hostname (e.g. 'example.com')
  * May include:
      * port (e.g. ':5984')
      * path-prefix (e.g. '/myCouchInstance') (request path will be appended)
      * querystring (e.g. '?authToken=...') (request querystring will be appended)

## Authentication enforcement

See `src/index.js` for a list of supported endpoints and how authorization is
enforced.

## License

MIT. See [LICENSE](./LICENSE) for details.
