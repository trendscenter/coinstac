# Coinstac Algorithm Development Onboarding
[![Coinstac](https://github.com/MRN-Code/coinstac/raw/master/packages/coinstac-ui/img/icons/png/64x64.png)](https://github.com/MRN-Code/coinstac)

In this guide we'll go through several examples that aim to teach the basics of computation creation in Coinstac


### Requirements
  - An LTS release of [Node and NPM](https://nodejs.org/en/)
  - lastest version of [coinstac-simulator](https://npm.org/packages/coinstac-simulator)
    ```
    sudo npm i -g coinstac-simulator
    ```
  - latest version of [docker](https://docs.docker.com/install/)

## Getting Started
To successfully run computation in the simulator we need to
- [Create a compspec](#Create-a-compsec)
- [Create a dockerfile](#Create-a-dockerfile)
- [Create a the scripts](#Create-a-the-scripts)
- [Create an inputspec](#Create-an-inputspec)

Many of these topics are also covered in greater detail in the [computation development guide](https://github.com/trendscenter/coinstac/blob/master/algorithm-development/coinstac-development-guide.md)

#### Create a `compspec.json`
Starting a Coinstac computatation begins with making a `compspec.json` a document that allows the Coinstac system to understand how to interact with your computation. This includes how the UI is generated, how computations can chain together, and input and output handling. A more in depth overview can be found [here](https://github.com/trendscenter/coinstac/blob/master/algorithm-development/computation-specification-api.md)

We're going to create a simple compspec, with two key sections: `meta` for computation metadata and `computation` for the computation details

The important sections here are
- **type** - docker is the only supported method for running computations at the moment
- **dockerImage** - the name of the docker image to run, the image needs to be pulled locally and available on dockerhub for Coinstac
- **command** - the command to call when your docker image is started, this should be an array including arguments to pass
- **remote** - if your computation has a decentralized component, the remote section is a mirror of the above, but for the remote. The remote can and usually uses the same docker image but often calls a different starting script
- **input** - what your computation needs to start running a full overview can be found in the [computation spec api doc](https://github.com/MRN-Code/coinstac/tree/master/algorithm-development/computation-specification-api.md). For now lets take a look at an example:

```      
"lambda": // name of your variable as it will be in your script
      {
        // these extra settings are for the UI
        "defaultValue": 0, // the default value for the UI
        "label": "Lambda", // what the UI will call your variable
        "max": 1,
        "min": 0,
        "step": 0.05, // step by which the UI will increment your variable
        "type": "number", // what type your variable is, more in the comp spec api
        "source": "owner" // optional: only necessary for the UI if the consortia
                          // owner must supply the value
      },
```

##### Full compspec example
```
{
  "meta": {
    "name": "Onboarding example", // this name is displayed in the UI
    "id": "ssr_fsl", // needs to be unique for any Coinstac computation
    "version": "v1.0.0", // semver version
    "repository": "https:\/\/github.com\/trendscenter\/coinstac\/coinstac-onboarding\/",
    "description": "A simple example" // a short description for the UI
  },
  "computation": {
    "type": "docker",
    "dockerImage": "onboarding",
    "command": [
      "python",
      "\/computation\/local.py"
    ],
    "remote": {
      "type": "docker",
      "dockerImage": "onboarding",
      "command": [
        "python",
        "\/computation\/remote.py"
      ]
    },
    "input": {
      "startingValue":
      {
        "default": 0,
        "label": "Starting input",
        "min": 0,
        "step": 1,
        "type": "number",
        "source": "owner"
      }
    },
    "output": {
      "outputNumber" : {
        "type": "number"
      }
    },
    "display": [ // blank for now
    ]
  }
}
```

### Create a Dockerfile
To run your computation in Coinstac you'll need to encapsulate it in a docker image, for now we have one base python 3.7 image that all computations must inherit from. This Dockerfile below uses that image as a base, puts your code into `/computation`, and can install any perquisites required by your code

**Note**: please ignore any test or extraneous files using a `.dockerignore`, this keeps image size down
```sh
FROM coinstacteam/coinstac-base-python-stream
# Set the working directory
WORKDIR /computation
# Copy the current directory contents into the container
COPY . /computation
```

### Create the scripts
Here are two templates for the local and remote scripts. These templates show how to load data in and out of a computation

##### local script
```python
#!/usr/bin/python

import sys
import json

input = json.loads(sys.stdin.read()) # input data is read in from stdin and parsed from JSON
output = { "output": {} }
sys.stdout.write(json.dumps(output)) # output data is serialized into JSON then put onto stdout
```

##### remote script

```python
#!/usr/bin/python

import sys
import json

input = json.loads(sys.stdin.read()) # input data is read in from stdin and parsed from JSON
output = { "output": {} }
sys.stdout.write(json.dumps(output)) # output data is serialized into JSON then put onto stdout
```
####### Quick note on local vs decentralized
local and decentralized computations are made nearly the same, except for two key differences: Decentralized computations **_always_** are ended by the remote, and decentralized computations have a `"remote"` section in their compspec.

##### Creating an inputspec
To run a computation in `coinstac-simulator` we need a document that gives the pipeline the initial input with relation to the `compspec`. This document is a smaller chunk of what the UI generates for the pipeline, the rest is done for you in simulator.

The `inputspec.json`'s default location is in a folder called `./test` in your root directory. The `inputspec` is just the variables in your `compspec`'s `input` section with fulfilled values. Here's and example:

```
{
"startingValue":  // just the variable name we choose for our sum example
  {
    "value": 1 // the initial value given to the pipeline
  }
}
```
The key `value` is used as pipeline variables can also be fulfilled from other steps, however that is out of scope of this guide

If you specify more clients in the simulator with the `-c` flag, the above data will just be cloned amoung them to start with. To start with different data for each client, make the `inputspec` an array:
```
[
  {
  "startingValue":  // just the variable name we chose for our sum example
    {
      "value": 1 // the initial value given to the pipeline local0
    }
  },
  {
  "startingValue":  // just the variable name we chose for our sum example
    {
      "value": 1.5 // the initial value given to the pipeline client local1
    }
  }
]
```

##### Exercise one
For now, let's just use one client and a starting value of `1`. With this starting value lets simply send that value to the remote, then finish the computation

To access input variables in either the `local` or `remote` sides of the computation, we use the parsed JSON input:
```python
input = json.loads(sys.stdin.read())
ourInputVariable = input["input"]["startingValue"]
```
To send this to the remote we simply put it into the output object that is sent to stdout:
```python
ourInputVariable = input["input"]["startingValue"];

output = { "output": { keyForRemote: ourInputVariable } }
sys.stdout.write(json.dumps(output))
```
Now on the remote side of things we read things in similarly, but with the twist of the `input` document being nested for each site by the site name. We'll get how to grab the site name programmatically, but for now we know it will be `local0` as that is how site names are structured for simulator
```python
inputFromLocal = json.loads(sys.stdin.read())
inputFromLocal0 = input["input"]["local0"]["startingValue"]
```
Since all we're doing in this example is just echoing the starting value out, we finish with:

```python
inputFromLocal0 = input["input"]["local0"]["startingValue"]

output = { "output": { "outputNumber": inputFromLocal0 }, "success": True }
sys.stdout.write(json.dumps(output))
```
Note the `success: true`, this tells Coinstac that the computation has finished and the results are ready. The last output from the remote is the final output for the computation

####### Running the computation
Now that we have our compspec, local, and remote scripts, now let's try to run it
First we'll want to build our docker box, on some machines (typically windows) you may have to run these commands as an **administrator**. On linux you can get around this by adding your user to the `docker` group

```sh
docker build -t onboarding .
```
**Note**: the image name in the `-t` tag **_must_** be the same as your `dockerImage` in your `compspec`
Now in the **root** directory of your project run:
```sh
coinstac-simulator
```
You should see the computation start
![compstart](https://github.com/MRN-Code/coinstac/raw/master/algorithm-development/compstart.png)
End
![compend](https://github.com/MRN-Code/coinstac/raw/master/algorithm-development/compend.png)
And finally the output as JSON
![compoutput](https://github.com/MRN-Code/coinstac/raw/master/algorithm-development/compoutput.png)

###### Debugging
A quick note about debugging before we get to the next exercise. Coinstac captures and parses `stdout` for results, so simply printing will not work inside computations. The easiest way to dump variables or print statements to debug, is to throw and exception which will halt and display the error. For example, to debug out previous script to see what we had received from the local sites we could:

```python
raise Exception(input["input"])
```

##### Exercise two
 For this exercise we're going to change the `inputspec.json` to have 2 sites and add another variable

 ```
 [
   {
   "startingValue":  // just the variable name we chose for our sum example
     {
       "value": 5 // the initial value given to the pipeline local0
     }
   },
   {
   "startingValue":  // just the variable name we chose for our sum example
     {
       "value": 3 // the initial value given to the pipeline client local1
     }
   }
 ]
 ```
The local code doesn't change but we're going to do something a bit different on the remote. On the remote we will compute the average for the site values, a here's a hint on how to loop through the sites on the remote
```python
for site, siteVariables in inputFromLocal["input"].items():
```
The output from the remote will just be the average from the site

##### Exercise three
Let's add another variable to our `inputspec.json` for each site
```
[
  {
  "startingValue":  // just the variable name we chose for our sum example
    {
      "value": 5 // the initial value given to the pipeline local0
    },
  "effect":  // just the variable name we chose for our sum example
    {
      "value": 0.83 // the initial value given to the pipeline client local1
    }
  },
  {
  "startingValue":  // just the variable name we chose for our sum example
    {
      "value": 3 // the initial value given to the pipeline client local1
    },
  "effect":  // just the variable name we chose for our sum example
    {
      "value": 0.77 // the initial value given to the pipeline client local1
    }
  }
]
```

On the locals, instead of sending the raw value, let's take the `startingValue` and multiply it by the `effect`, sending this resulting value to the remote

What if we want to iterate multiple times? On remote instead of setting `success` to true, we'll just not include it in the output, setting it to false would also achieve the same thing. This will send the averaging results back to the local sites. From here, the local's will need to somehow know that the computation has moved on to a second step. There are many ways to do this, and Coinstac leaves it up to computation authors to decide, we'll cover a couple examples here
```python
# checking the input dict for step 2 only variables
if "siteAverage" in input["input"]:
```
```python
# checking the state dict for the iteration count
# state data is provided by coinstac on every iteration
# and includes useful information such as directories and site names
if input["state"]["iteration"] == 3:
```
```python
# setting a specific step variable from the remote
# allows a switch structure vs option 1
if input["input"]["step"] == "two":
```

Different options work better for different computational structures, let's use the 3rd option for now and set a "step" variable on the remote. From here on the local we'll have to check if this variable exists, and if it does what step we've set it to, though there is only one step for now

In this second step the local will take the average from the remote, and calculate the percentage difference from its own raw value (before we applied the effect). Right now you might realize there is no way to access the previous step data, to do this we need to save data we want to access later to the `cache`

To save any step data (though data saved both to output and cache should be kept under 100mb, we'll talk about how to use files for large data in a later exercise) we write it out to the `cache`, much like how `output` is written out. Cache data is available only to the node the wrote the data out, so every local site and the remote have separate caches

```python
output = { "output": { "withEffect": withEffect }, "cache": { "startingValue": startingValue} }
sys.stdout.write(json.dumps(output))
```
On any iteration there after you can access the cache in the input data
```python
input["cache"]["startingValue"]
```

After doing this and calculating the percentage difference, send this value back to the remote. We'll need a step variable for the remote as well since we're iterating more than once. At the remote aggregate the site percentages in one object and set the computation to finish with the `success` flag set to true. Your output should look something like this

```python
output = { "output": { "local0": ....site data, "local1": ...site data }, "success": True }
sys.stdout.write(json.dumps(output))
```

##### Exercise four
We're going to much of the same as exercise three but use files to do the job of the input variables.

Coinstac makes a trade off between messaging reliability and data transfer by using the MQTT protocol, and as such there is a limit to how much data a message can contain. This limit is 256mb per message, but in practice you should try to keep your messages as small as possible as the limits can be node cumulative as the remote needs the aggregate of all the local node messages. A good rule of thumb is under 10mb, for larger messages Coinstac has a file transfer method that isn't limited by size.

First lets put some files in the simulator test directories

####### Adding test files in simulator
Adding files to simulator is a bit of a manual process at the moment, they must be put into the `test` folder under the automatic site name and run name the simulator generates. Sim names each site `local#` where # is 0 to the number of clients the run has. Here's what the directory structure looks like for `local0`, or the first client

Let's create a file called `startingValue.txt` and `effect.txt` and place it in this directory the contents of the files will just be the variables from the `inputspec` respectively for each site, for local0 for example:

startingValue.txt
```
5
```

effect.txt
```
0.83
```

```sh
├── test
│   ├── inputspec.json
│   ├── local0 # local site name
│   │   └── simulatorRun # the run name in all simulator pipelines, in the UI this would be a database ID
│   │       ├── startingValue.txt
            ├── effect.txt
```


The `simulatorRun` directory is the directory that is mounted into your docker environment, put your files in there and they will be accessible in your computation

Before we read the files in, we need to know there names. For file names that are static, as in things that are build into your computation image, you can hard code the names. However files provided by the end user will be passed into your computation by the UI, and must be listed in your compspec. For now, just to test in sim, we can provide an `inputspec` that will mimic how the UI will pass in files

```
[
  {
  "startingValueFile":  // just the variable name we chose for our sum example
    {
      "value": "startingValue.txt" // the initial value given to the pipeline local0
    },
  "effectFile":  // just the variable name we chose for our sum example
    {
      "value": "effect.txt" // the initial value given to the pipeline client local1
    }
  },
  {
  "startingValueFile":  // just the variable name we chose for our sum example
    {
      "value": "startingValue.txt" // the initial value given to the pipeline client local1
    },
  "effectFile":  // just the variable name we chose for our sum example
    {
      "value": "effect.txt" // the initial value given to the pipeline client local1
    }
  }
]
```

Now we can use this information to read files in

```python
import os

input = json.loads(sys.stdin.read())

effectFile = open(os.path.join(input["state"]["baseDirectory"], input["input"]["effectFile"]))
effect = effectFile.read()
```

##### Transferring files between clients
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
