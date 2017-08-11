# coinstac-computation-registry-new

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

Revisiting coinstac-computation-registry using Docker and a new pipeline.

## Installing/Running

  * Adding "Metadata" to CouchDB will work best if using the `tmuxinator` setup

  * Install [Docker](https://www.docker.com/community-edition)
  * Clone
  * Add `coinstac-computation-registry-new` as a dependency in `coinstac-server-core` and `coinstac-client-core`
    * From `coinstac` directory:
      * `cd packages/coinstac-client-core && npm install --save ../coinstac-computation-registry-new/`
      * `cd packages/coinstac-server-core && npm install --save ../coinstac-computation-registry-new/`
  