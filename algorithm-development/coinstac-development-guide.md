# Coinstac Development Guide
[![Coinstac](https://github.com/MRN-Code/coinstac/raw/master/packages/coinstac-ui/img/icons/png/64x64.png)](https://github.com/MRN-Code/coinstac)

Coinstac is a Electron based application environment for decentralized algorithms, this guide aims to describe developing an alogrithm for Coinstac.


### Requirements
  - An LTS release of [Node and NPM](https://nodejs.org/en/)
  - lastest version of [coinstac-simulator](https://npm.org/packages/coinstac-simulator)
    ```sudo npm i -g coinstac-simulator```
  - latest version of [docker](https://docs.docker.com/install/)

## Getting Started
To successfully run computation in the simulator we need to
- [Create a compsec](#Create-a-compsec)
- [Create a dockerfile](#Create-a-dockerfile)
- [Create a the scripts](#Create-a-the-scripts)
- [Create an inputspec](#Create-an-inputspec)

## Other topics
- [Advanced usage](#Advanced-usage)

#### Create a compsec
Starting a Coinstac computatation begins with making a `compspec.json` a document that allows the Coinstac system to understand how to run and use your computation with others or by itself.

Below is an example from the Coinstac regression algorithm. There is a metadata section containing usefull data, and a computation section for how to use your computation.

The key sections here are
- **type** - docker is the only supported method for running computations at the moment
- **dockerImage** - the name of the docker image to run, the image needs to be pulled locally or available on dockerhub
- **command** - the command to call when your docker image is started, this should be an array of args
- **remote** - if your computation has a decentralized component, the remote section is a mirror of the above, but for the remote. The remote can and usually uses the same docker image but calls a different file.
- **input** - what your computation needs to start running a full overview can be found in the [computation spec api doc](https://github.com/MRN-Code/coinstac/tree/master/algorithm-development/computation-specification-api.md). For now lets take a look at an example:
-
```json      
"lambda": // name of your variable as it will be in your script
      {
        "defaultValue": 0,
        "label": "Lambda", // what the UI will call your variable
        "max": 1,
        "min": 0,
        "step": 0.05, // step by which the UI will increment your variable
        "type": "number", // what type your variable is, more in the comp spec api
        "source": "owner" // optional: only necessary for the UI if the pipeline
                          // creator must supply the value
      },
```

##### Full compspec example
#
```json
{
  "meta": {
    "name": "single shot regression demo",
    "id": "ssr_fsl",
    "version": "v1.0.0",
    "repository": "https:\/\/github.com\/MRN-Code\/coinstac_ssr_fsl",
    "description": "Single shot regresssion on FreeSurfer Data"
  },
  "computation": {
    "type": "docker",
    "dockerImage": "coinstac/ssr",
    "command": [
      "python",
      "\/computation\/local.py"
    ],
    "remote": {
      "type": "docker",
      "dockerImage": "coinstac/ssr",
      "command": [
        "python",
        "\/computation\/remote.py"
      ]
    },
    "input": {
      "lambda":
      {
        "defaultValue": 0,
        "label": "Lambda",
        "max": 1,
        "min": 0,
        "step": 0.05,
        "type": "number",
        "source": "owner"
      },
      "covariates":
      {
        "label": "Covariates",
        "type": "array",
        "items": ["boolean", "number"]
      },
      "data": {
        "label": "Data",
        "type": "array",
        "items": ["FreeSurfer"],
        "extensions": [["csv", "txt"]]
      }
    },
    "output": { // blank for now
    },
    "display": [ // blank for now
    ]
  }
}
```

### Create a Dockerfile
To run your computation in Coinstac you'll need to encapsulate it in a docker image, for now we have one base python 3.6 image that all computations must inherit from. The Docker file use that image as a base, puts your code into `/computation`, and does any install required by your code.

**Note**: please ignore any test or extraneous files using a `.dockerignore`, this keeps image size down
```sh
FROM coinstac/coinstac-base-python-stream
# Set the working directory
WORKDIR /computation
# Copy the current directory contents into the container
COPY requirements.txt /computation
# Install any needed packages specified in requirements.txt
RUN pip install -r requirements.txt
# Copy the current directory contents into the container
COPY . /computation
```
### Create the scripts
Here is a simple example that just sends a number and sums it until it reaches `5`

##### local script
#
```python
#!/usr/bin/python

import sys
import json

doc = json.loads(sys.stdin.read())
if 'start' in doc['input']:
    sums = 1
else:
    sums = doc['input']['sum'] + 1

output = { "output": { "sum": sums } }
sys.stdout.write(json.dumps(output))
```

##### remote script
#
```python
#!/usr/bin/python

import sys
import json

doc = json.loads(sys.stdin.read())
sums = 0
for site, output in doc['input'].items():
    sums = sums + output['sum'];
sums = sums / len(doc['input'])
if sums > 4:
    success = True
else:
    success = False

output = { "output": { "sum": sums }, "success": success }
sys.stdout.write(json.dumps(output))
```

##### And the compspec this uses
#
```json
{
  "meta": {
    "name": "decentralized test",
    "id": "coinstac-decentralized-test",
    "version": "v1.0.0",
    "repository": "github.com\/user\/computation.git",
    "description": "a test that sums the last two numbers together for the next"
  },
  "computation": {
    "type": "docker",
    "dockerImage": "coinstac\/coinstac-decentralized-test",
    "command": [
      "python",
      "\/computation\/local.py"
    ],
    "remote": {
      "type": "docker",
      "dockerImage": "coinstac\/coinstac-decentralized-test",
      "command": [
        "python",
        "\/computation\/remote.py"
      ]
    },
    "input": {
      "start": {
        "type": "number"
      }
    },
    "output": {
      "sum": {
        "type": "number",
        "label": "Decentralized Sum"
      }
    },
    "display": {
      "type": "table"
    }
  }
}
```
##### Creating an inputspec
To run a computation in `coinstac-simulator` we need a document that gives the pipeline the inital input with relation to the `compspec`. This document is smaller chunk of what the UI generates for the pipeline, the rest is done for you in simulator.

The `inputspec.json`'s default location is in a folder called `./test` in your root directory. The `inputspec` is just the variables in your `compspec`'s `input` section with fulfilled values. Here's and example:

```json
{
"start":  // just the variable name we choose for our sum example
  {
    "value": 1 // the inital value given to the pipeline
  }
}
```

If you specify more clients in the simulator with the `-c` flag, the above data will just be cloned amoung them to start with. To start with different data for each client, make the `inputspec` an array:
```json
[
  {
  "start":  // just the variable name we choose for our sum example
    {
      "value": 1 // the inital value given to the pipeline
    }
  },
  {
  "start":  // just the variable name we choose for our sum example
    {
      "value": 1.5 // the inital value given to the pipeline
    }
  }
]
```
##### Running the computation
We have our compspec, local, and remote scripts, now let's try to run it
First we'll want to build our docker box, on some machines (linux and possibly windows) you may have to run these commands as an **administrator**.
```sh
docker build -t coinstac/coinstac-decentralized-test .
```
**Note**: the image name in the `-t` tag **_must_** be the same as your `dockerImage` in your `compspec`
Now in the **root* directory of your project run:
```sh
coinstac-simulator
```
You should see the computation start
![compstart](https://github.com/MRN-Code/coinstac/raw/master/algorithm-development/compstart.png)
End
![compend](https://github.com/MRN-Code/coinstac/raw/master/algorithm-development/compend.png)
And finally the output as JSON
![compoutput](https://github.com/MRN-Code/coinstac/raw/master/algorithm-development/compoutput.png)

##### local vs decentralized
local and decentralized computations are made nearly the same, except for two key differences: Decentralized computations **_always_** are ended by the remote, and decentralized computations have a `"remote"` section in their compspec.

## Advanced usage
In this secion we'll go over some more advanced use cases of simualtor and Coinstac itself
#### Adding test files in simulator
Adding files to simulator is a bit of a manual process at the moment, they must be put into the `./test` folder under a the automatic sitenames the simualtor generates. Sim names each site `local#` where # is 0 to the number of clients the run has. Here's what the directory sturcture looks like for `local0`, or the first client:

```sh
├── test
│   ├── inputspec.json
│   ├── local0
│   │   └── simulatorRun
│   │       ├── subject0_aseg_stats.txt
│   │       ├── subject10_aseg_stats.txt
```
The `simualtorRun` directory is the directory that is shared into docker, put your files in there and they will be accessible by your computation via `["state"]["baseDirectory"] + myfile.txt` for a python example.
#### Transferring files between clients
Files can be transferred client to remote and remote to client by writing to a special directory. The _transfer_ directory can be access while in a computation via the `state->transferDiretory` key, looking like `inputJSON['state']['transferDiretory']` in python.

Any file put into the transfer directory is then moved from that directory to the input directory on the corresponding client when that iteration ends.
From `remote` to `client` would look like this:
Remote:
```
├── ['state']['transferDiretory']
│   ├── move-this-file.txt
```
##### Iteration ends....
Remote:
```
├── ['state']['transferDiretory']
│   ├──
```
All Clients:
```
├── ['state']['baseDiretory']
│   ├── move-this-file.txt
```

From any `client` to `remote` would look like this:
A Client:
```
├── ['state']['transferDiretory']
│   ├── move-this-file.txt
```
##### Iteration ends....
A Client:
```
├── ['state']['transferDiretory']
│   ├──
```
Remote:
```
├── ['state']['baseDiretory']
│   ├── ['state']['baseDiretory']['clientID'] // files moved into folders based on the sending Client's ID so they cannot conflict
│   │   └── move-this-file.txt
```
*NOTE:* All transferred files are deleted at the end of the pipeline, to persist files write them to the output directory.

#### Running pipelines in sim
Simulator can run pipelines, which is multiple computations in series with each other. The computations can be different, or the even the same computation, what's required to do this is a `pipelinespec.json` file and the `-p` or `-pipeline` flag in simulator.
Here's an example:
```
["./compspec.json", "/Users/someUser/coinstac/packages/coinstac-images/coinstac-decentralized-test/compspec.json"]
```
Running this pipeline:
```
coinstac-simulator -p ./pipelinespec.json
```
You can see that the pipeline spec file is a list of `compspecs`, this list can be either absolute paths, or a path _relative to_ the `pipelinespec.json`.

If a computation is the first in the list, the normal `inputspec.json` is used for input. However all subsequent computations must have a `inputspec-pipeline.json`, this is used for any computation that isn't the first, such that you can have multiple specs to make running between pipeline and non-pipeline mode less cumbersome.

The `pipelinespec.json` file need not be in any computations directory, but it may be easier to put it in the first computation's directory for source control.

##### Inputspec-pipeline and using previous step output
Later steps in the pipeline can use variables output from previous steps (note: there is a string size limit of 256mb), using the following paradigm:
```
{"inputVariableName":
  {"fromCache":
    {"step":0, "variable":"outputVariableName"}
  }
}
```
Contrasting a normal inputspec that looks like:
```
{"inputVariableName":
  {
    "value": 0
  }
}
```
The `fromCache` key tells the pipeline you want to access a previous steps data, the `step` key tells it which step zero indexed you would like, and the `variable` key is the name of the previously outputted variable to access.
Here's a full example,
inputspec.json for first step:
```
{"firstVariable":{"value":1}}
```
it's output compspec:
```
"output": {
  "firstOutput": {
    "type": "number",
    "label": "output from first step"
  }
},
```
inputspec-pipeline.json for the next step:
```
{"nextStepInputVar":{"fromCache": {"step":0, "variable":"firstOutput"}}}
```
You can see that the first step outputs `firstOutput` which then is plugged into `nextStepInputVar` for the second step, chaining the pipeline I/O together.
##### Multiple clients in pipeline mode
Pipeline mode can also do multiple clients, each with their own input. The `inputspec.json` is identical to normal multi client mode, however we also need a multi client `inputspec-pipeline.json` for all the subequent pipeline computations in the pipelinespec.
A multi client run for the previous example might look like this,
first step inputspec.json:
```
[{"firstVariable":{"value":0.5}},
{"firstVariable":{"value":23}}]
```
second step inputspec-pipeline.json:
```
[{"nextStepInputVar":{"fromCache": {"step":0, "variable":"firstOutput"}}},
{"nextStepInputVar":{"fromCache": {"step":0, "variable":"firstOutput"}}}]
```
Some notes on this:
* The arrays for the multiple clients between the multiple inputspec and inputspec-pipeline files _must_ be the same length, as the client count has to be the same throughout the pipeline
* The arrays for the multiple clients _must_ also be in the same order, as in array element [5] in the initial input spec should correspond to array element [5] in all other inputspec-pipeline files, otherwise your client input/output chaining will be mismatched.
## A full fledged example
A more real world example can be found [here](https://github.com/MRN-Code/coinstac_ssr_fsl) with our Single Shot Regression Demo that uses freesurfer file test data to run it's simulator example
