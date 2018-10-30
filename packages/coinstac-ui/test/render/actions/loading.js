'use strict';

import test from 'tape';
import * as ld from '../../../app/render/state/ducks/loading';

test('applyAsyncLoading properly wraps and dispatches', (t) => {
  t.plan(2);
  let dispatchCount = 0;
  const _dispatch = () => (++dispatchCount && 42); // eslint-disable-line no-plusplus
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
