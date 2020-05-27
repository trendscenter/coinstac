# Computation Specification API
#
#
### Sections
##### [Meta](#meta)

##### [Computation section](#computation-section)

##### [Input and Output sections](#input-and-output-sections)

##### [I/O Variable Attributes](#io-variable-attributes)

##### [Running in a Pipeline](#running-in-a-pipeline)
#
#
## Overview
The Computation Specification is a JSON document that accompanies all
Computations. The contents of this document allow the COINSTAC Pipeline
and Simulator to control the Computation by providing necessary
metadata, and how to provide input, use the output, and compose the
Computation with other Computations.

To this end there are two types of sections: metadata about the
computation and the computation section detailing I/O as well as how to
use the computation. If the computation is decentralized, there is a
`remote` subsection in the computation section.

Note: This file should be included in the root of your computations
source for the easiest usage of coinstac simulator, and be called
`compspec.json`

An example specification may look like:
```json
{
  "meta": {
    "id": "preprocess-vbm",
    "name": "VBM (Voxel Based Morphometry) on T1W scans",
    "version":  "v1.0",
    "repository": "github.com/MRN-Code/Coinstac_VBM_computation.git",
    "description": "This computation runs Voxel Based Morphometry on structural T1 weighted MRI scans(BIDS format and T1w nifiti) using SPMv12 standalone and MATLAB Runtimev713. Each scan takes approximately 5 mins to run on a system with 2.3 GHz,i5 equivalent processor, 8GB RAM. Each scan output directory takes about 150MB space. Please make sure to have the space and resources.",
    "tags": ["vbm", "preprocess"], 
    "preprocess": true
  },
  "computation": {
    "type": "docker",
   "dockerImage": "coinstacteam/fmri_coinstac",
    "command": [
      "python",
      "\/computation\/run_fmri.py"
    ],


"input":{

"options":{
"type":"number",
"label": "Smoothing FWHM in mm",
"defaultValue": 10,
"min": 0,
"max": 10,
"step": 1,
"description":"Full width half maximum smoothing kernel value in x,y,z directions"
},

"data":{
"type":"array",
"label": "Dataset_description.json of Bids Directory"
}

},
  
    "output": {
      "display":{
      "type": "string",
      "description":"Output wc1 images"
      },
      "message":{
      "type": "string",
      "description":"Output message from VBM step"
      },
	    "download_outputs":{
		    "type":"string",
		    "description":"Download vbm outputs here"
	    }
	}

  }
}
```
Meta
----

The meta section contains useful meta-information that COINSTAC will use
to display to the users about your computation, or use to manage your
Computation, such as version and controller options.

`id: "unique-computation-name"`

A unique alphanumeric identifier for the computation that may use dashes
but contains no spaces.

`name: "Readable computation name"`

Name of the computation, this is the name that will be displayed to
users

`version: "v1.1.1"`

The version of the computation following [semver](http://semver.org/)

`repository: "https://mygiturl.com"`

URL to the repository where the computation code resides

`description: "Adds things up and puts them down"`

A more detailed description for users

`controller: "group-step"`

Optional field to specify a required controller for the computation. By
default decentralized computations will complete one run locally, give
the result to the remote, and then present the result to the next
pipeline step if there is one.

`preprocess: { boolean }`

Denotes if the computation is a preprocessing step

Computation section
-------------------

The computation sections consists of what the computation expects as
inputs, and what it will be outputting when finished.

**Note:** on I/O vs decentralized vs not computations: for
non-decentralized computations inputs and outputs pertain to what that
local computations inputs and outputs. *However* for a decentralized
computations inputs refer to the local input given to the computation,
and outputs refer to *what the remote outputs when it is finished*. This
output will then be given to the next step, if there is one. This is
because the remote computation sets the \'success\' parameter halting
execution, the last output must come from the remote.

`type: "computation-type"`

The type of computation, options are:

-   docker - a docker box to run

`dockerImage: "username/docker-image-name on hub.docker.com"`

`command: "python src/mycomputation.py"`

Command to run to execute the computation

A local function would give the JS file for the entrypoint: `"src/index.js"`

A docker command gives the command to run: `"Rscript mycomp.R"`

`preprocessing: "some-preprocess-computation"`

A required preprocessing computation for this computation.

### Input and Output sections

The input sections specifies what the computation expects as inputs from
other sources; this could be another computation, preprocessing, the
user input from the UI, etc. The output section details what the
computation will output so that other resources can use it.

The I/O sections use the following format:
```json
"input": { // Section Name

"variableName": { // Input Variable

// Variable attributes go here

},

"anotherVariable": {
}

}
```
### I/O Variable Generic Attributes
These attributes can be set on any field type

`label: "UI Label" // Required, the label for this field on the UI`

`description: "what this variable is" //Optional. A one-to-two sentence description`

`type: "variableType" // The type of variable` 

`source: "user" or "owner" // The source of the input data whether from pipeline creator or each individual user/site`

###### there are several different variable types with sub options for each type.

-   `number` - the basic numeric type

    -   `min` - minimum value for the variable

    -   `max` - maximum value for the variable

    -   `step` - the step amount the variable changes in the UI, ie: `step": 0.1`

-   `array` - an array of types, maybe be any dimension unless restricted
    -   `items` - an array of what types are allowed in the array, ie:
        `"items": ["number"]`
    -   `min` - minimum item count for the array
    -   `max` - maximum item count for the array

-   `string` - the basic string type

    -   `values` - an array of values the string can be, ie: `["apple", "banana"]`

-   `boolean` - basic boolean type, allows true or false

-   `files` - requesting file input from local machine

    -   `count` - the exact number of files, ignores `max` and `min`

    -   `max` - the maximum number of files

    -   `min`- the minimum number of files

    -   `extensions` - a list of allowable extensions: `["nii","dcm","txt"]`

-   `users` - allows UI creation of a list of users/sites current in the computation for various purposes.
Output is an array of user/site names.

    -   `source` - a required field set to `"owner"` as the pipeline creator fills in this field

Running in a Pipeline
---------------------

The Computation Specification is a static document used by Coinstac to
define a computation, however once a computation has been instantiated
as a step in the Pipeline, the inputs and outputs passed into it follow
another JSON structure described below. Input for computations is always passed 
in via `STDIN`.

### Input structure
```json
{
"input":{}, // inputs specified by the comp spec and fulfilled by the UI or simulator

"cache": {}, // cache items put there by the computation, empty
initially

"state": {

"iteration": integer, // current iteration count, **note this only
counts local iterations**

"baseDirectory" , // directory to read any input files from

"outputDirectory" , // directory to place any output, output must be
noted in output

// schema

"cacheDirectory" , // directory to save any temporary files between
iterations

} // state of the computation, such as decentralized iteration count,
and other

// controller details

}
```
### Remote Input Structure
```json
{
"input": { siteName:{}, siteName2:{} ....etc}, // the outputs you've
sent to the central node from each site

"cache": {} // cache items put into the cache that are available only
to the remote

"state": {

"iteration": integer, // current iteration count, **note this only
counts local iterations**

"baseDirectory" , // directory to read any input files from

"outputDirectory" , // directory to place any output, output must be
noted in output

// schema

"cacheDirectory" , // directory to save any temporary files between
iterations

} // state of the computation, such as decentralized iteration count,
and other

// controller details

"success": true/false // only set once completed, otherwise this field
is omitted

// for decentralized this is set on the remote only!

}
```

When a computation is first started the input section is a JSON object
of all the computational inputs specified by the Computation Spec and 
then fulfilled by a site using the UI or via inputspec.json in the simulator.
The cache object is initially empty, and the state object contains current
Controller state (clientId, baseDirectory, etc...). For successive iterations,
the input object will be the output from the last step. The cache will be 
whatever that node has put into the cache, the remote and local nodes do not share
cache.

### Output Structure
```json
{
"output": {}, // the outputs you'd like to send to the central node

"cache": {} // cache items put into the cache that are available only
to that node

"success": true/false // only set once completed, otherwise this field
is omitted

// for decentralized this is set on the remote only!

}
```

### Remote Output Structure
```json
{
"output": {}, // the outputs you'd like to send to the central node

"cache": {} // cache items put into the cache that are available only
to the remote

"success": true/false // only set once completed, otherwise this field
is omitted

// for decentralized this is set on the remote only!

}
```
The output structure is what a computation should write out to its
`STDOUT` once finished. For the computation's last run, the output object
should contain the fulfilled variables that were listed in the
Computation Spec output and set the `success` flag, on intermediate iterations 
they will be the output variables for your next step, either locally or to be
aggregated on the remote. **Note:** On decentralized computations, the remote 
and only the remote sets the success field to terminate computations. The final
output must also then come from the remote.

