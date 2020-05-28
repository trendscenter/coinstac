const {
  eventEmitter,
  COMPUTATION_CHANGED,
  COMPUTATION_DELETED,
  CONSORTIUM_CHANGED,
  CONSORTIUM_DELETED,
  PIPELINE_CHANGED,
  PIPELINE_DELETED,
  RUN_CHANGED,
  THREAD_CHANGED,
  USER_CHANGED,
} = require('../events');
const { transformToClient } = require('../../utils');

let pubSub = null;

function computationChanged(computation) {
  const comp = transformToClient(computation);

  pubSub.publish('computationChanged', {
    computationChanged: comp,
    computationId: comp.id,
  });
}

function computationDeleted(computation) {
  const comp = transformToClient(computation);
  comp.delete = true;

  pubSub.publish('computationChanged', {
    computationChanged: comp,
    computationId: comp.id,
  });
}

function publishConsortium(consortium) {
  const cons = transformToClient(consortium);

  pubSub.publish('consortiumChanged', {
    consortiumChanged: cons,
    consortiumId: cons.id,
  });
}

function consortiumChanged(consortium) {
  if (Array.isArray(consortium)) {
    consortium.forEach(c => publishConsortium(c));
  } else {
    publishConsortium(consortium);
  }
}

function consortiumDeleted(consortium) {
  const cons = transformToClient(consortium);
  cons.delete = true;

  pubSub.publish('consortiumChanged', {
    consortiumChanged: cons,
    consortiumId: cons.id,
  });
}

function publishPipelineDeleted(pipeline) {
  const pipe = transformToClient(pipeline);
  pipe.delete = true;

  pubSub.publish('pipelineChanged', {
    pipelineChanged: pipe,
    pipelineId: pipe.id,
  });
}

function pipelineDeleted(pipeline) {
  if (Array.isArray(pipeline)) {
    pipeline.forEach(p => publishPipelineDeleted(p));
  } else {
    publishPipelineDeleted(pipeline);
  }
}

function pipelineChanged(pipeline) {
  const pipe = transformToClient(pipeline);

  pubSub.publish('pipelineChanged', {
    pipelineChanged: pipe,
    pipelineId: pipe.id,
  });
}

function runChanged(run) {
  const r = transformToClient(run);

  pubSub.publish('userRunChanged', {
    userRunChanged: r,
    runId: r.id,
  });
}

function threadChanged(thread) {
  const t = transformToClient(thread);

  pubSub.publish('threadChanged', {
    threadChanged: t,
    threadId: t.id,
  });
}

function publishUser(user) {
  const usr = transformToClient(user);

  pubSub.publish('userChanged', {
    userChanged: usr,
    userId: usr.id,
  });
}

function userChanged(user) {
  if (Array.isArray(user)) {
    user.forEach(u => publishUser(u));
  } else {
    publishUser(user);
  }
}


function initSubscriptions(ps) {
  pubSub = ps;

  eventEmitter.on(COMPUTATION_CHANGED, computationChanged);
  eventEmitter.on(COMPUTATION_DELETED, computationDeleted);

  eventEmitter.on(CONSORTIUM_CHANGED, consortiumChanged);
  eventEmitter.on(CONSORTIUM_DELETED, consortiumDeleted);

  eventEmitter.on(PIPELINE_CHANGED, pipelineChanged);
  eventEmitter.on(PIPELINE_DELETED, pipelineDeleted);

  eventEmitter.on(RUN_CHANGED, runChanged);

  eventEmitter.on(THREAD_CHANGED, threadChanged);

  eventEmitter.on(USER_CHANGED, userChanged);
}

module.exports = initSubscriptions;
