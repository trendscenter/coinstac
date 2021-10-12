# COINSTAC Security Overview

This guide addresses how COINSTAC does and does not function, answers questions about security concerns when running COINSTAC, and what COINSTAC does to insure data integrity and privacy.

## What is COINSTAC

COINSTAC is a desktop and command-line application that enables federated (decentralized) analysis while preserving data privacy.

#### COINSTAC
* Enables federated analyses and coordinated preprocessing without sharing data
* Preserves data privacy
* Only shares data derivatives, such as models and gradients
* Allows collaboration without direct coordination 
* Constructs a secure environment with end-to-end encryption for all transactions
* Run approved, open-source computations, available for inspection on [GitHub](https://github.com/trendscenter) and [DockerHub](https://hub.docker.com/u/coinstacteam)

#### COINSTAC **does not**
* Allow access to your data outside of a tightly restricted local computation environment
* Allow collaborators to directly access your data or systems
* Alter or allow modifications to your data
* Run arbitrary or malicious code on your computer

## Security summary
Here is a 1000-ft view of COINSTAC security components before a detailed description
* COINSTAC communicates over WSS, MQTTS, and HTTPS using TLS.
* Clients only request data via HTTPS request or pub/sub systems with MQTTS/WSS. No IP routing information is shared between clients, nor do clients communicate directly. All interaction happens via the pub/sub channels facilitated by the backend.
* All requests are authenticated by JWT tokens, and passwords are stored using [pdbkdf2](https://nodejs.org/api/crypto.html#crypto_crypto_pbkdf2_password_salt_iterations_keylen_digest_callback).
* Computations are encapsulated in either a Docker or [Singularity](https://sylabs.io/singularity/) container, with communication allowed only over a local websocket and no local filesystem access. Information on security concerns regarding Docker can be found [here](https://docs.docker.com/engine/security/).
* Files are hard-linked (or soft-linked for network-mounted drives) into a folder, which is then mounted with read-only access by the container.

## COINSTAC components
To better understand COINSTAC's security surface let's take a quick look at a what happens during a typical pipeline run.

### COINSTAC has two main components
* The client side of the pipeline, usually bundled in the Electron runtime or as a command-line tool in [coinstac-headless-client](packages/coinstac-headless-client/)
* The backend API system, which includes an API server and a pipeline server that aggregates client computation responses for each pipeline step

### Pipeline communication
COINSTAC has two bidirectional communications methods: 
* a TLS-secured [websocket](https://en.wikipedia.org/wiki/WebSocket) over port **443**
* a TLS-secured [MQTTS](https://en.wikipedia.org/wiki/MQTT) subscription channel over port **80**
	* Note: MQTT traffic can be flagged by firewall systems as it's a separate protocol from HTTP. However, the subscription channel will fall back to WSS if it's unable to connect via MQTTS.

WSS communication is used for all API requests via the [GraphQL](https://graphql.org/) backend. And finally there is HTTPS communication for login and file transfer requests necessary for a particular computation. A simple communication diagram would look like this:
 ```
    Client                           Remote
  +---+----+     +-----------+ 443 +---+----+
  |        |<----|    WSS    |---->|GQL Req |
  |Electron|     | websocket |     |--------|
  | or     |     +-----------+ 80  |        |
  |Headless|<----|   MQTTS   |---->|Pipeline|
  |        |     +-----------+     | MSG    |
  |        |     |  HTTPS    | 443 |--------|
  |        |-----| Requests  |---->|File Req|
  +---+----+     +-----------+     +---+----+
  ```


## Computation encapsulation
COINSTAC computations are encapsulated in either a Docker or [Singularity](https://sylabs.io/singularity/) container to maintain compatibility and compartmentalization from the host system.

Docker itself requires elevated permissions to run, depending on your operating system, which may make it unsuitable as a choice in your ecosystem. Note these permissions themselves are not given to the running container, only the Docker system that manages containers. More information about Docker and security can be found [here](https://docs.docker.com/engine/security/).

Alternatively, Singularity can be used and does not typically require special permissions. However, Singularity support is experimental at the moment, and not all computations are yet available.

### Precautions to prevent running of malicious or arbitrary code using COINSTAC
Currently, the only computations available to run in COINSTAC were created by our team. Additionally, users are not allowed to publish computations without our cooperation. Thus, no computations available now in COINSTAC contain any malicious code. New computations created by users outside our team will be required to be open source and vetted by our team to before being made publicly available to COINSTAC users. Additionally, the Docker containers run by COINSTAC are only given write access to a single folder on the client machine during a pipeline run. 

### Network setup
COINSTAC needs a way to communicate input and output data from a running computation, which is achieved by a websocket connection sustained over the life of a container. A local open port is chosen in the range `8000-40000`, sequentially to ensure multiple containers do not conflict, which is bound to the `localhost` and routed to port `8881` inside the container.

An example Docker API configuration would look like this:
```
'8881/tcp': [{  HostPort: `${chosenPort}`,  HostIp: '127.0.0.1'  }]
```
This is the only network access permitted to a container run by COINSTAC.

### File system access
COINSTAC containers use local file system access in order to process input data for the initial computation and for transfer of files between COINSTAC clients.

 ```
	     			  Read
  +---+---+   File   +----------+ Only  +-----+-----+
  | Local |--------->|Temporary |------>|Cointainer |
  | Data  |  System  |  Folder  | Mount |File System|
  +---+---+   Link   +----------+       +-----+-----+
```

Containers are given two mounted read-write `output` and `transfer` folders to output final results and send data as files to other Clients.

## Contributions
If there are any questions, errors, or additions to this guide or security concerns please feel free to [create an issue](https://github.com/trendscenter/coinstac/issues).
