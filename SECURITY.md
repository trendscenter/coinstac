# Coinstac Security Overview

This guide aims to address how Coinstac does and does not function, what sort of security concerns there are in running Coinstac, and what Coinstac does to insure data integrity and privacy.
## What is Coinstac
Coinstac is a desktop and cli based application that enables decentralized analysis while preserving data privacy, often called Federated Analysis.
####Coinstac
* Enables collaborative analyses without sharing data
* Preserves data privacy
* Only shares data derivatives, such as models and gradients
* Allows collaboration without direct coordination 
* Constructs a secure environment with end to end encryption for all transactions
####Coinstac **does not**
* Allow access to your data outside of tightly restricted local computation environment
* Allow collaborators to directly access your data or systems
* Alter or allow modifications to your data

## Security summary
Here is 1000ft view of Coinstac security components before a detailed description
* Coinstac communicates over WSS, MQTTS, and HTTPS using TLS
* Clients only request data via HTTPS request or pub/sub systems with MQTTS/WSS. No IP routing information is shared between clients, nor do clients communicate directly, all interaction happens via the pub/sub channels facilitated by the backend
* All requests are authenticated by JWT tokens, passwords are stored using [pdbkdf2](https://nodejs.org/api/crypto.html#crypto_crypto_pbkdf2_password_salt_iterations_keylen_digest_callback)
* Computations are encapsulated in either a Docker or [Singularity](https://sylabs.io/singularity/) container, with communication allowed only over a local websocket and no local filesystem access. Information on Docker's security concerns can be found [here](https://docs.docker.com/engine/security/)
* Files are hard linked (or soft linked for network mounted drives) into a folder, which is then mounted with read-only access into the container's system
## Coinstac components
To better understand Coinstac's security surface let's take a quick look at a what happens during typical algorithm run.

Coinstac has two main components
* The client side of the pipeline, usually bundled in the Electron runtime or as a command line tool in [coinstac-headless-client](packages/coinstac-headless-client/)
* The backend api system, which includes an api server and a pipeline server that aggregates client computation responses for each pipeline step

### Pipeline communication
Coinstac has two by-directional communications methods: 
* a TLS secured [websocket](https://en.wikipedia.org/wiki/WebSocket) over port **443**
* a TLS secured [MQTTS](https://en.wikipedia.org/wiki/MQTT) subscription channel over port **80**
	* Note: MQTT traffic can be flagged by firewall systems as it's a separate protocol from HTTP. However the subscription channel will fallback to WSS if it's unable to connect via MQTTS.

WSS communication is used for all API requests via the [GraphQL]() backend. And finally there is HTTPS communication for login and file transfer requests necessary for a particular computation. A simple diagram of communication would look like this:
 ```
    Client                         Remote
  +---+----+    +-----------+443 +---+----+
  |        |<---|    WSS    |--->|GQL Req |
  |Electron|    | websocket |    | ------ |
  | or     |    +-----------+ 80 |        |
  |Headless|<---|   MQTTS   |--->|Pipeline|
  |        |    +-----------+    | MSG    |
  |        |    |  HTTPS    |443 |--------|
  |        |----| Requests  |--->|File Req|
  +---+----+    +-----------+    +---+----+
  ```


## Computation encapsulation
Coinstac computations are encapsulated in either a Docker or [Singularity](https://sylabs.io/singularity/) container to maintain compatibility and compartmentalization from the host system.

Docker itself requires elevated permissions to run, depending on your operating system, which may make it unsuitable as a choice in your ecosystem. Note these permissions themselves are not given to the running container, only the docker system that manages containers, more information about Docker and security can be found [here](https://docs.docker.com/engine/security/).

Alternatively Singularity can be used and does not typically require special permissions, however Singularity support is experimental at the moment and not all computations are available.
### Network setup
Coinstac needs a way to communicate input and output data from a running computation, this is achieved by a websocket connection sustained over the life of a container. A local open port is chosen between `8000-40000`, sequentially to ensure multiple containers don't conflict, which is bound to the `localhost` and routed to `8881` internally inside the container.

An example Docker API config would look like this:
```
'8881/tcp': [{  HostPort: `${chosenPort}`,  HostIp: '127.0.0.1'  }]
```
This access is the only network access permitted to a container

### File system access
Coinstac containers use local file system access in order to process input data for initial computation and for transfer of files between Coinstac clients.

 ```
  +---+---+   File   +----------+  RO   +-----+-----+
  | local |--------->|Temporary |------>|Cointainer |
  | data  |  System  | Folder   | Mount |File System|
  +---+---+   Link   +----------+       +-----+-----+
```

Containers are given two mounted read-write `output` and `transfer` folders to output final results and send data as files to other Clients.

## Contributions
If there are any questions, errors, or additions to this guide please feel free to file an issue on the repo [here](https://github.com/trendscenter/coinstac/issues).
