# COINSTAC Security Overview

This guide addresses how COINSTAC does and does not function, answers questions about security concerns when running COINSTAC, and what COINSTAC does to insure data integrity and privacy.

## What is COINSTAC

COINSTAC is a desktop and command-line application that enables federated (decentralized) analysis while preserving data privacy.

#### COINSTAC
* Enables federated analyses and coordinated preprocessing without sharing data
* Only shares data derivatives, such as models and gradients and not individual subject files
* Allows collaboration without direct coordination 
* Constructs a secure environment with end-to-end encryption for all transactions
* Run approved, open-source computations, available for inspection on [GitHub](https://github.com/trendscenter) and [DockerHub](https://hub.docker.com/u/coinstacteam)

#### COINSTAC **does not**
* Allow access to your data outside of a tightly restricted local computation environment
* Allow collaborators to directly access your data or systems
* Alter or allow modifications to your data
* Run arbitrary or malicious code on your computer


## Workflow summary

Because the human subject data used in COINSTAC analyses are private, it is important to understand what controls data holders have over analyses that are run on their data and what measures the COINSTAC system can and cannot take with regards to security and privacy. 

Let us suppose that you are a data holder who may be willing to allow your dataset to be used in an analysis run by COINSTAC. You would provide metadata about your dataset that can be searched by researchers who might wish to use your dataset. This metadata should be things that can be shared publicly and data holders can determine what metadata can be shared. For example, the number of subjects or number of cases and controls may be shareable. Some data holders may include certain demographic summaries in this metadata. The data holder can decide what metadata to share.

### Proposing a study

It is helpful to compare the workflow/process in COINSTAC to that used in other collaborative projects such as ENIGMA. Firstly, as with ENIGMA, all analyses run in COINSTAC are opt-in: data holders are able to approve or deny any request to use their data. 

An analysis in COINSTAC contains two components:

* A *local analysis* script which COINSTAC will run at each client. This script will have access to the data specified by the data holder and will compute data derivatives that can be to
* An *aggregate analysis* script which gathers the data derivatives from the 

As an example, a local analysis script may perform a regression analysis on locally held data and transmit the regression coefficients. The aggregate analysis will gather the regression coefficients computed at each client and produce a consensus set of coefficients, perhaps by averaging the coefficients from the different clients.

A researcher ("initiator") wishing to do an analysis in COINSTAC will:

* Search the metadata on available data sets to find those which are relevant to their study.
* Develop local and aggregate analysis scripts.
* Contact data holders with a study proposal, including the scripts they would run as part of the analysis. The proposal will describe what intermediate results are communicated as part of the analysis.

Data holders/clients can then decide whether they wish to participate or not in the proposed computation. At this point, the only information used is the metadata shared by the client.

### Vetting a study

It is important to ensure that data holders can verify that the computations performed on their data are acceptable from a privacy and security perspective. Prior to accepting the computation, data holders can examine the code for the local analysis and run it locally to ensure that what is being computed and communicated are data derivatives (c.f. the regression coefficients in the example above).

In our currrent implementation, we have designed the local analyses and core computations ourselves and we can certify that the functions behave "as advertised." In the current framework any contributed computation would have to be open source and vetted by our team before introducing it into the COINSTAC repository. This helps us ensure that computations handle local data and communicate appropriately.

### Running a study

If a data holderr agrees to the study, they can run the COINSTAC client and specify which local data will be accessible (read only) for the analysis. The COINSTAC client will execute the local analysis script, send the message(s) to the initiator, and then close.

This workflow puts the control of what analyses are run and what data are used in the hands of the data holder. They can verify that the information communicated to the researcher satisfies privacy requirements. In the remainder of this document we describe the specific security measures taken to ensure data and communication are protected. 



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

While compartmentalization helps in preventing the code from accessing data outsde of that which is linked, data holders may worry about arbitrary or malicious code from being introduced within a computation.

To address this, the current implmentation of COINSTAC allows only computations witten by our team and any contributed computations must be open source and vetted by our team. This allows us to ensure that:

1. The computations only compute, store, and transmit aggretate information and data derivatives and not individual subject data.
2. The computations do perform any operations outside of those necessary for the requested analysis.

Finally, the Docker containers run by COINSTAC are only given write access to two folders on the client machine during a pipeline run: one folder to write outputs locally, and a folder to hold outgoing messages.


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

