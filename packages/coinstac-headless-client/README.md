The headless client can participate in pipeline runs. To do that the pipeline owner needs to add the client to the run.

To run the client you'll need to set the following environment variables
```
API_KEY - API key associated with the headless client
HEADLESS_CLIENT_NAME - Name of the headless client as configured on the COINSTAC API database
API_URL - URL address of the COINSTAC API
SUB_API_URL - URL address of the subscription COINSTAC API

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
export API_KEY=testApiKey
export HEADLESS_CLIENT_NAME="Headless 1"
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
