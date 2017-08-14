# Computation Registry

The following lists the general purpose of, and requirements for, the COINSTAC Computation Registry. This is subject to change.

## Purpose

The COINSTAC Computation Registry will:
  * Manage computation metadata
  * Ensure Docker computation images are saved locally on server and client machines
  * Validate computations during pipeline runs

## Components

  * __Computation database service__
    * Run as a separate service from the rest of COINSTAC
    * May share GraphQL API
    * Handles computation metadata and related queries/mutations
    * Validate passed-in computations
  * __Computation whitelist__
    * Used by server to maintain an up-to-date database table of approved computations, and their metadata, for use by Consortia pipelines
    * Manually updated after a computation gains approval
  * __Computation Registry Package__
    * Accept an array of computation images to download from Docker
      * UI adapter displays Docker stdout to user
    * On server initialization:
      * Download all images listed in whitelist
      * Remove computations no longer included on whitelist
      * Copy metadata from image `coinstac.json` to DB
    * Display currently saved images
      * Note which images are in active use by Consortia user is a member of
    * Provide ability to delete local images 
  * __UI: Computation Submission__
    * Tentative
    * Allows authors to submit computations for consideration
    
## Database API

  * __Used by Client__
    * `getAllComputations()`
      * Returns array of objects containing comp names, ID, Docker image names
    * `getMetadatForId(id)`
      * Returns metadata for specified computation ID
  * __Used by Server__
    * `addComputation(computation)`
      * Insert computation metadata
    * `removeComputation(id) `
      * Remove existing computation
      * Used by server if computation no longers exists on whitelist

## (Mostly) Server-side Workflow

<img src="https://rawgit.com/MRN-Code/coinstac/redesign/comp-reg-docs/img/comp-reg-server.svg" width="100%" height="600">

## Client-side Workflow

<img src="https://rawgit.com/MRN-Code/coinstac/redesign/comp-reg-docs/img/comp-reg-client.svg" width="100%" height="600">