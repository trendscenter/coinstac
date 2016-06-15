# Pipeline Workflow

1. PipelineRunnerPool instantiated w/ consortiumID
2. Configures internal listeners on remote/local dbs based on consortiumID
3. When listener detects db change:
4. Looks at `runId` of changed doc
    1. Checks if remote doc exists w/ `runId` _and_ an existing PipelineRunner. If the remote doc is marked “complete” something is wrong: throw an Error.
    2. Attempts to find an existing PipelineRunner w/ `runId`
        * If **found**: PipelineRunner.run(changeDoc)
        * If **not found:**
            1. creates a new PipelineRunner
            2. PipelineRunner.run(changeDoc)

## PipelineRunner.run(changeDoc):

1. Interprets the changeDoc (checks at changeDoc.pipeline.inProgress)
    * If `inProgress` is `true` just stop
2. Get necessary remote and local docs from dbs
3. Run the pipeline (`Pipeline.run(cb)`)

    A document (example):
    
    ```js
    {
        data: {/*...*/}, // computation author's area
        pipeline: {  // our area for pipeline meta, etc.
            inProgress: {boolean},
            step: {number}
            //...
        }
    }
    ```
    
    1. Pipeline will call current step’s `next()` function
        * **true:** bump `myPipeline.step++`
        * **false:** do nothing, stay in this step
    2. Pipeline calls current step’s `fn` function (in `type: 'function'` computation)
    3. Pipeline calls current step’s `next()` function
        * **true:** bump `myPipeline.step++` _and_ `myPipeline.inProgress = true`
        * **false:** set `myPipeline.inProgress = false`
    4. Call `Pipeline.run`’s passed callback with the current doc
    5. If post-fn-call `next()` is `true` then re-run `fn()` (see #2). Repeat until `next()` returns `false`.
4. Pipeline passes doc to PipelineRunner
5. PipelineRunner writes to db
6. PipelineRunner listens to Pipeline (or callback) for 'complete' event

PipelineRunner.emits('complete') => PipelineRunnerPool kills PipelineRunner

Keep a list of complete pipelines w/ their corresponding runIds. Don't want to keep on instantiating pipelines.
