'use strict';

import * as ld from '../../../app/render/state/ducks/loading.js';
import test from 'tape';

test('applyAsyncLoading properly wraps and dispathes', (t) => {
  t.plan(2);
  let dispatchCount = 0;
  const _dispatch = () => (++dispatchCount && 42);
  const dummyAsyncAction = function testActionCreator() {
    return (dispatch) => {
      t.equal(dispatch(), 42, 'dispatch injected');
      return Promise.resolve();
    };
  };
  const wrappedAsyncActionCreator = ld.applyAsyncLoading(dummyAsyncAction);

  // loading-start-action, staged-action, then loading-finish-action should
  // be deployed, in that sequence
  // simulate redux calling th action w/ dispatch
  wrappedAsyncActionCreator()(_dispatch)
  .then(() => t.equal(dispatchCount, 3, 'loading start, loading finish dispatched'))
  .catch(t.fail);
});
