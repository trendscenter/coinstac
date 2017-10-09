# Architecture Requirements

These requirements listed below are must haves for a COINSTAC architecture.

## System Entities

COINSTAC contains these top-level entities, under which system attributes and features may be grouped.

### Computations

Computations are self-contained chunks of code that perform a specific job within COINSTAC. These are written by users (“computation authors”) and used within COINSTAC clients and servers.

1. Must allow for decentralized use: a computation may contain code that runs on client machines and a central server.
2. Must support multiple programming languages: a computation written in another language (Python, R, etc.) should work with COINSTAC, which is written primarily in JavaScript. Multiple languages should be supported on both COINSTAC clients and the central server.
3. Should be composable: runs should be able to configure computations in varying orders.
4. Should be reproducible: users should be able to re-run a computation, or series of computations, with varying parameters easily. Should be easy for algorithm authors to develop:
    1. Debugging tools (Example: coinstac-simulator) should exist to allow authors to easily test their algorithms and simulate their use within a COINSTAC-like system
    2. COINSTAC should perform automated checks against authors’ code to ensure it works within the system, and alert them to errors or potential problems.
5. Should have an input and output specifications (see [MRN-Code/coinstac#12](https://github.com/MRN-Code/coinstac/issues/12)) to aid in composability and reproducibility:
    1. Should be able to specify inputs: the computation dictates what it needs to run. This could be a collection of FreeSurfer files, a range of DICOM files, a CSV full of metadata, etc. This may also include inputs from previous computations in the pipeline (Example: second computation needs the original files for meta-analysis).
    2. Should be able to specify outputs: the computation declares its results. In some cases this may be raw JSON, or a table, a graph, an image, a file path, or a 3D visualization.
    3. Should have provisions for remote and local specifications. (Example: separate “remote” and “local” properties in a JSON schema.)
6. Should exist within a package manager ecosystem:
    1. Computations should have (unique) names, descriptions, author(s), tags, and other metadata appropriate for a package.
    2. Authors should be able to publish, update versions, deprecate and transfer ownership of computations.
    3. Authors need to specify the dependencies of their computations
        1. Environment dependencies (e.g., Python 3.5+, numpy==1.12, etc.)
        2. Dependencies on other computations
7. Support for local computation (e.g. preprocessing) as well as decentralized computations.

### Pipeline

A pipeline assembles single computations into a series. Owners of a consortium configure the parameters of the pipeline and those of its computations; configured pipelines run on clients, often in a synchronized manner.

1. Must compose computations: a pipeline combines computations into a series of steps for clients to execute. It facilitates computation-to-computation flow by passing data via the computation input/output specification.
    1. Should be composed via a user interface: an interface requiring no coding should assemble computations.
    2. Pipelines should be savable for reuse, possibly shareable.
2. Must accept input from users. (Example: A FreeSurfer computation requires a collection of scan files from several participants.)
    1. Must provide users a means to specify file paths of data on their local machines for input into pipeline
3. Must work regardless of network conditions:
    1. The run must operate with intermittent Internet connections
    2. A client must continue to operate even if it goes offline
4. Must be configurable:
    1. Must accept input from consortium owners for specific computation steps and pass this input to the computations as they need it.
    2. Should be configured via a user interface.
    3. Should expose control flow at a granular level (per computation) such that it’s configurable. Examples:
        * Synchronized group stepping on iterative computations
        * Allow for clients to drop out of a computation after a heartbeat timeout
        * Allow pipelines to conditionally branch on future steps based on the output of a computation
    4. Should allow for flexible run initiation. Examples:
        1. Every client should be ready prior to start
        2. Clients can join when ready, then the pipeline starts
        3. Run the pipeline immediately
        4. Set a future date for the run to begin
        5. Set the pipeline to run when a predefined number of users have joined
    5. Should allow user to elect a site for special participation (Example: specify a “hold-out” site that doesn’t participate in iterative analysis. This site’s data is used at the end of iteration to validate – quality check – the model computed through iteration over the other sites.)
5. Should be easy for consortium owners to develop and debug.
6. Should be inspectable: users should be able to examine the current state and existing steps of a pipeline.
7. Should cache intermediate and final results of a computation run (Example: FreeSurfer preprocessing) for reuse. Don’t make the client do the same job twice.
8. A running pipeline:
    1. Should not use all of a client’s resources: runs should enter a queue system and run in a rate-limited parallel manner (Example: “four runs at a time, in order of run initiation issue”)
    2. Should surface metrics about its progress. This should involve collecting information about raw computation time, network travel time, iteration count, estimated finish time, etc. A user interface should be able to display this information.
    3. Should operate in the background. Ideally, pipelines run when a user is away from their computer.
    4. Should be pausable, resumable, and cancel-able. (Functional interpretation: pipelines should maintain minimal internal state, ideally they're lambdas.)
9. Should provide records for posterity and citations such that users and sites can receive credit for participating in runs.
10. Pipeline should be fault-tolerant and have excellent error handling.
    1. Errors and crashes on local sites should not propagate to the run on the entire consortium, causing it to crash
    2. Crashes in individual computations should not crash the entire pipeline.
    3. In the event of a computation crash, the pipeline should notify the user, relaying any error messages.
    4. The pipeline should send automatically generated crash reports to the author of the computation.
    5. Should generate crash report.
    6. Crashes in individual nodes should not crash the entire pipeline

### Consortia

A consortium is an entity that organizes users to collectively run pipelines against their data and builds models that are stronger than what could be created by individual users acting alone

1. Must support multiple user roles:
    1. Owners: configure pipelines, initiate pipeline runs.
        1. Should allow multiple owners
        2. Should be able to transfer ownership
    2. Members: contribute data, view run results
2. Users should be able to join and leave consortia
3. Must contain metadata: tags, description, a name, etc.
    1. Should keep track of editing history (user, time, date)
4. Must support visibility permissions:
    1. Public: users should be able to see basic information (name, description, enrollment) of consortium, should be able to search/filter consortia
    2. Private: hidden from public search, membership is invite-only
5. Should only allow users access to documents, results, and consortia according to an ACL (Access Control List) structure
6. Define parameters and hyperparameters required for pipeline runs.
7. Must be able to run pipelines.
    1. Consortium owners configure and initiate runs
    2. Multiple runs happen simultaneously
8. Should be able to set up both local and decentralized computations

### User Management

1. There must be a means to Create, Edit, and Delete a user
2. Each user has a profile page containing public information. Other users should be able to navigate to this page, and the user should be able to edit it.
    1. Profile information: avatar, email, full name, bio, etc.
    2. Activity on COINSTAC
        1. Consortia participated in (current and past)
        2. Runs participated in (current and past)
3. User information should be stored remotely, outside of the client.
4. User information should be accessible from multiple clients, excluding local data.

### Data Mappings

A data mapping is a scheme by which local data is mapped to the variables in a computation as defined in a consortium.

1. Users should be able to add files to application
    1. Should be able to select files and metadata from hard drive
    2. Should be able to choose how files are contributed to computation runs: fine-grained control over how files are used, which computations can run against it, etc.
2. Should be able to edit/remove files from application
3. To avoid repetitive interactions with the software, data mappings should be reusable among different pipelines and consortia

### Clients

A client is the local application that users interact with to use COINSTAC.

1. Must run the client (or “local”) pieces of computations
2. Must be able to run a pipeline
3. Must communicate with remote system that manages consortia
4. Must communicate with remote system that orchestrates pipeline run
5. Must communicate with remote system that handles user management
6. Should download and consume computations as-needed
    1. Client computation downloads should be packaged to minimize size.
    2. Save downloaded computations for future use.
7. Should allow use  by one or more users
8. Should have a means to Create, Edit, and Delete users
9. Must be able to run multiple pipelines in parallel
    1. User configuration of max pipeline resources
10. User interface should:
    1. Regarding consortia:
        1. Allow users to view, join, and leave consortia
        2. Allow users to see list of joined consortia
            1. Should show consortia currently running pipelines
    2. During a pipeline run
        1. Reveal local client’s pipelines’ states
        2. Reveal pipeline states of other users
        3. Reveal progress of pipeline run
    3. After a run
        1. View pipeline run results
        2. Should allow exporting of results of computation runs (in CSV, JSON, email, etc.)
11. Should afford users a reasonable measure of security
    1. User information, consortium information, PHI data should be handled correctly
    2. E.g., Someone creates a computation that sends everyone’s data to another server
12. Error handling: a crash in one step might be related to errors in a previous step. The user should be able to manually send free-form text feedback and automated crash reports to the author of any computation.

### System Characteristics

* The connection is inconsistent: clients may go offline suddenly, networks may become slow, etc. Favor eventual consistency over performance. Plan accordingly.
* COINSTAC should support "offline" mode: users' machines should perform computations when they're not online (especially important for preprocessing)
* Security: maintains privacy for users and their data.

### Soft Requirements

Requirements of the system or the development process:

* Ensure rapid development is possible in the system. We should be able to respond to feature requests and stakeholder feedback without hacking the system or contributing to technical debt.
* Ensure algorithm developers can begin ASAP such that re-architecture, feature development and algorithm authorship happen in parallel.
* Define processes for developing features, ensure architecture documentation updates are included.
* Make it easier for external or new developers to contribute. Adopting a composable microservices approach with good integration testing is key for this.
* Continuous feature delivery: ensure we can continually roll out re-architecture features to the current demo. Don’t let it stagnate!
* Create phases of re-architecture: we might not need social features for another 2 years, we might not need a robust computation registry for another 3 years, etc.
* Define a project management workflow. Stick to it!
* Define a process for adding high-level features and documenting them. See [Rust’s RFC repo](https://github.com/rust-lang/rfcs) and [Ember’s RFC repo](https://github.com/emberjs/rfcs) for excellent examples. Perhaps design documents can exist in a top-level rfcs or design directory. Ensure design documents are followed with issues to track active development. Ensure special GitHub labels exist for the design pull requests and issues. (Also: [Swift Evolution](https://github.com/apple/swift-evolution))
* Don’t attempt to create a schema that encompasses data: this is likely a black hole. Sites store data differently; normalizing data via scripts has been a years-long effort. Adopt [an existing](http://bids.neuroimaging.io/) spec or leave that responsibility in the hands of computation authors.
* Build systems such that they’re extensible. This should assist the “rapid development” requirement in that changing from, say, Docker to [Singularity](http://singularity.lbl.gov/) is as easy as building a Singularity adapter.

