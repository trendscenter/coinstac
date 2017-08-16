# Computation Registry

In COINSTAC, __Computations__ are self-contained algorithms that provide researchers additional insight into their data. They do this based upon a detailed I/O schema that *computation authors* define prior to exporting them as Docker images. Multiple computations can be aligned with varying I/O mappings to form a __pipeline__.

The __Computation Registry__ acts as a repository for the metadata concerning these computations. It is responsible for downloading a pipeline's computations and for validating those computations prior to their being run.

## Purpose

The COINSTAC Computation Registry will:
* Manage computation metadata
  * Metadata is comprised of information concerning a computation such as its name, I/O schema, associated Docker image and repo
  * This metadata is defined by the computation's author and is used by COINSTAC to facilitate a computation's use in user-generated pipelines
* Ensure Docker computation images are saved locally on server and client machines
  * There is a one-to-one relationship between Docker images and computations
  * Image names should be tagged with computation version to ensure pipelines are using the correct version
* Validate computations during pipeline runs
  * Validating computations ensures that only whitelisted computations, those that have been approved after a source code review, are being used within a pipeline
* Allow computation authors to submit computations for approval
  * Submission can be done via a CLI tool or UI form
  * Submissions are added to database with a flag of unapproved

## Components

* __Computation Database Table__
  * GraphQL API and RethinkDB shared with the rest of COINSTAC
  * Handles computation metadata and related queries/mutations
  * Validates passed-in computations
  * Table acts as whitelist of approved computations, and their metadata, for use by Consortia pipelines
  * Metadata added to table on author submission with flag of unapproved
    * Flag changed to approved after source code approved
* __Computation Registry NodeJS Module__
  * Accept an array of computation images to download from Docker
    * UI adapter displays Docker stdout to user
  * On server initialization:
    * Download all images listed in whitelist table
    * Remove computations no longer included on whitelist table
  * Display currently saved images
    * Note which images are in active use by Consortia user is a member of
  * Provide ability to delete local COINSTAC-related images
* __Computation Submission UI/CLI Component__
  * Allows authors to submit computations for consideration
    
## API

* __Used by Client & Simulator__
  * `getAllComputations()`
    * Returns array of objects containing comp names, ID, Docker image names
  * `getMetadataForName(imageName)`
    * Returns metadata for specified computation image name
* __Used by Server__
  * `addComputation(computation)`
    * Insert computation metadata
  * `removeComputation(id) `
    * Remove existing computation
    * Used by server if computation no longers exists on whitelist
* __Used By Pipeline__
  * `validateComputation(id)`
    * Return boolean indicating whether or not computation is `approved`

## (Mostly) Server-side Workflow

<img src="https://rawgit.com/MRN-Code/coinstac/redesign/comp-reg-docs/img/comp-reg-server.svg" width="100%" height="600">

## Client-side Workflow

<img src="https://rawgit.com/MRN-Code/coinstac/redesign/comp-reg-docs/img/comp-reg-client.svg" width="100%" height="600">