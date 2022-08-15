# COINSTAC Headless Client

The headless client allows a static dataset(s) to be made available to the larger COINSTAC ecosystem, giving the ability for others to run pipelines using your data without it ever leaving your system

## Setup
### System Requirements
 * [a Nodejs LTS installation](https://nodejs.org/en/)
 * [Docker](https://docs.docker.com/engine/install/)

### Installation
 * to install `npm i -g coinstac-vault-client`
 * to run `coinstac-vault-client`

### Application Requirements
 * The headless client will need access to docker, best done by adding the user running the client to the `docker` group
 * read access to the filesystem where the data is kept
 * outgoing traffic on port `80` via the `MQTT` protocol, though the client will fallback to WS HTTP if unavailable
 * outgoing traffic for HTTPS on port `443`


How the headless client is run will be system dependent, we recommend Upstart for systems that have that
available

To run the client you'll need to set the following environment variables. These will either reference a self managed COINSTAC system, or the TReNDs system found [here](../coinstac-ui/config/local-production.json).

If running in the TReNDs system, contact the TReNDs team for an application username, api key, and to setup computation specific whitelists and compspec locations.

```
HEADLESS_CLIENT_CONFIG - config file containing vaults id's and api keys
API_URL - URL address of the COINSTAC API
SUB_API_URL - URL address of the subscription COINSTAC API
COINSTAC_WORKING_DIRECTORY - working directory for pipeline operation

FILE_SERVER_HOSTNAME
FILE_SERVER_PATHNAME
FILE_SERVER_PORT
FILE_SERVER_PROTOCOL

MQTT_SERVER_HOSTNAME
MQTT_SERVER_PATHNAME
MQTT_SERVER_PORT
MQTT_SERVER_PROTOCOL

MQTT_WS_SERVER_HOSTNAME
MQTT_WS_SERVER_PATHNAME
MQTT_WS_SERVER_PORT
MQTT_WS_SERVER_PROTOCOL
```

Example for running locally
```
export HEADLESS_CLIENT_CONFIG="./test-conf.json"
export API_URL="http://localhost:3100"
export SUB_API_URL="ws://localhost:3100"

export FILE_SERVER_HOSTNAME=localhost
export FILE_SERVER_PATHNAME="/transfer"
export FILE_SERVER_PORT=3300
export FILE_SERVER_PROTOCOL="http:"

export MQTT_SERVER_HOSTNAME=localhost
export MQTT_SERVER_PATHNAME=""
export MQTT_SERVER_PORT=1883
export MQTT_SERVER_PROTOCOL="mqtt:"

export MQTT_WS_SERVER_HOSTNAME=localhost
export MQTT_WS_SERVER_PATHNAME=""
export MQTT_WS_SERVER_PORT=9001
export MQTT_WS_SERVER_PROTOCOL="ws:"
```
