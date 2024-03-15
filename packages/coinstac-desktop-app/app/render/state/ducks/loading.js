/*
 * @module actions/loading
 */
import omit from 'lodash/omit';

let asyncLoadingCallCount = 0;

const LOADING_START = 'LOADING_START';
export const start = key => ({ type: LOADING_START, key });

const LOADING_FINISH = 'LOADING_FINISH';
export const finish = key => ({ type: LOADING_FINISH, key });

/**
 * Wraps a normal async action and applies the loading actions to it.
 * This makes the loading actions fire before and after the passed action
 * begins and ends, respectively.  Enables easy updating of "loading" UI state
 * without having to manage "loading state" manually in your action creators.
 * @example
 * @param {function} fn async action creator *with* a cb passed at runtime
 * @returns {function}
 */
export const applyAsyncLoading = function applyAsyncLoading(fn) {
  const fnName = fn.name || 'anonymous';

  /**
   * e.g. `login(user, cb)`
   * stores the action creator's inputs in the closure for when redux execs it
   * @private
   */
  return function wrappedActionCreator(...args) {
    return (dispatch, getState) => {
      asyncLoadingCallCount += 1;
      const currCount = asyncLoadingCallCount;
      dispatch(start(`${fnName}-${currCount}`));
      const dispatchComplete = () => dispatch(finish(`${fnName}-${currCount}`));
      return Promise.resolve(fn(...args)(dispatch, getState))
        .then((rslt) => {
          dispatchComplete();
          return rslt;
        })
        .catch((err) => {
          dispatchComplete();
          throw err;
        });
    };
  };
};

export default function reducer(state = { wip: {}, isLoading: false }, action) {
  switch (action.type) {
    case LOADING_START:
      return {
        ...state,
        wip: {
          ...state.wip,
          [action.key]: true,
        },
        isLoading: true,
      };
    case LOADING_FINISH:
      if (!state.wip || !state.wip[action.key]) {
        throw new ReferenceError([
          'attemped to complete loading sequence on key',
          `${action.key}, however no such key was previously loading`,
        ].join(' '));
      }

      // eslint-disable-next-line no-case-declarations
      const wip = omit(state.wip, [action.key]);
      return {
        ...state,
        wip,
        isLoading: !!Object.keys(wip).length,
      };
    default:
      return state;
  }
}
