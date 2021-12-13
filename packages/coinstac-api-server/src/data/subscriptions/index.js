const {
  eventEmitter,
  COMPUTATION_CHANGED,
  COMPUTATION_DELETED,
  CONSORTIUM_CHANGED,
  CONSORTIUM_DELETED,
  CONSORTIUM_PIPELINE_CHANGED,
  PIPELINE_CHANGED,
  PIPELINE_DELETED,
  RUN_CHANGED,
  RUN_DELETED,
  RUN_WITH_HEADLESS_CLIENT_STARTED,
  THREAD_CHANGED,
  USER_CHANGED,
  USER_SESSION_STARTED,
  USER_SESSION_FINISHED,
  HEADLESS_CLIENT_CHANGED,
  HEADLESS_CLIENT_DELETED,
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

function consortiumPipelineChanged(consortium) {
  const cons = transformToClient(consortium);

  pubSub.publish('consortiumPipelineChanged', {
    consortiumPipelineChanged: cons,
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

function headlessClientChanged(headlessClient) {
  const hc = transformToClient(headlessClient);

  pubSub.publish('headlessClientChanged', {
    headlessClientChanged: hc,
    headlessClientId: hc.id,
  });
}

function headlessClientDeleted(headlessClient) {
  const hc = transformToClient(headlessClient);
  hc.delete = true;

  pubSub.publish('headlessClientChanged', {
    headlessClientChanged: hc,
    headlessClientId: hc.id,
  });
}

function publishRunDeleted(run) {
  const r = transformToClient(run);
  r.delete = true;

  pubSub.publish('userRunChanged', {
    userRunChanged: r,
    runId: r.id,
  });
}

function runDeleted(run) {
  if (Array.isArray(run)) {
    run.forEach(r => publishRunDeleted(r));
  } else {
    publishRunDeleted(run);
  }
}

function runChanged(run) {
  const r = transformToClient(run);

  pubSub.publish('userRunChanged', {
    userRunChanged: r,
    runId: r.id,
  });
}

function runWithHeadlessClientStarted(run) {
  const r = transformToClient(run);

  pubSub.publish('runWithHeadlessClientStarted', {
    runWithHeadlessClientStarted: r,
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

function usersOnlineStatusChanged(usersOnlineStatus) {
  pubSub.publish('usersOnlineStatusChanged', {
    usersOnlineStatusChanged: usersOnlineStatus,
  });
}

function initSubscriptions(ps) {
  pubSub = ps;

  eventEmitter.on(COMPUTATION_CHANGED, computationChanged);
  eventEmitter.on(COMPUTATION_DELETED, computationDeleted);

  eventEmitter.on(CONSORTIUM_CHANGED, consortiumChanged);
  eventEmitter.on(CONSORTIUM_DELETED, consortiumDeleted);
  eventEmitter.on(CONSORTIUM_PIPELINE_CHANGED, consortiumPipelineChanged);

  eventEmitter.on(PIPELINE_CHANGED, pipelineChanged);
  eventEmitter.on(PIPELINE_DELETED, pipelineDeleted);

  eventEmitter.on(HEADLESS_CLIENT_CHANGED, headlessClientChanged);
  eventEmitter.on(HEADLESS_CLIENT_DELETED, headlessClientDeleted);

  eventEmitter.on(RUN_CHANGED, runChanged);
  eventEmitter.on(RUN_DELETED, runDeleted);

  eventEmitter.on(RUN_WITH_HEADLESS_CLIENT_STARTED, runWithHeadlessClientStarted);

  eventEmitter.on(THREAD_CHANGED, threadChanged);

  eventEmitter.on(USER_CHANGED, userChanged);

  eventEmitter.on(USER_SESSION_STARTED, usersOnlineStatusChanged);
  eventEmitter.on(USER_SESSION_FINISHED, usersOnlineStatusChanged);
}

module.exports = initSubscriptions;
