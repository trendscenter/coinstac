import app from 'ampersand-app';
import { applyAsyncLoading } from './loading';

const DO_DELETE_CONSORTIUM = 'DO_DELETE_CONSORTIUM';

function doDeleteConsortium(id) {
  return {
    id,
    type: DO_DELETE_CONSORTIUM,
  };
}

const DO_UPDATE_CONSORTIUM = 'DO_UPDATE_CONSORTIUM';

function doUpdateConsortium(consortium) {
  return {
    consortium,
    type: DO_UPDATE_CONSORTIUM,
  };
}

const SET_CONSORTIA = 'SET_CONSORTIA';

export function setConsortia(consortia) {
  return {
    consortia,
    type: SET_CONSORTIA,
  };
}

/**
 * Delete a consortium.
 *
 * Deleting the consortium causes the change to flow through `setConsortium`,
 * updating the state.
 *
 * @param {string} consortiumId
 * @returns {Function}
 */
export const deleteConsortium = applyAsyncLoading(consortiumId => {
  return () => {
    const { core: { consortia } } = app;

    return consortia.get(consortiumId)
      .then(consortium => consortia.delete(consortium));
  };
});

/**
 * Remove a user from a consortium.
 *
 * Saving the consortium causes the change to flow through `setConsortium`,
 * updating the state.
 *
 * @param {string} consortiumId
 * @param {string} username
 * @returns {Function}
 */
export const joinConsortium = applyAsyncLoading((consortiumId, username) => {
  return () => {
    const { core: { consortia } } = app;

    return consortia.get(consortiumId)
      .then(consortium => {
        if (consortium.users.indexOf(username) > -1) {
          throw new Error(
            `User ${username} already in consortium ${consortiumId}`
          );
        }

        // TODO: Array#push doesn't work.
        // https://github.com/electron/electron/issues/6734
        consortium.users = consortium.users.concat(username);

        return consortia.save(consortium);
      });
  };
});

/**
 * Remove a user from a consortium.
 *
 * Saving the consortium causes the change to flow through `setConsortium`,
 * updating the state.
 *
 * @param {string} consortiumId
 * @param {string} username
 * @returns {Function}
 */
export const leaveConsortium = applyAsyncLoading((consortiumId, username) => {
  return () => {
    const { core: { consortia } } = app;

    return consortia.get(consortiumId)
      .then(consortium => {
        const index = consortium.users.indexOf(username);

        if (index < 0) {
          throw new Error(`User ${username} not in consortium ${consortiumId}`);
        }

        // TODO: Array#splice doesn't work.
        // https://github.com/electron/electron/issues/6734
        consortium.users = consortium.users.filter(u => u !== username);

        return consortia.save(consortium);
      });
  };
});

export const fetchConsortia = applyAsyncLoading(function fetchConsortia() {
  return (dispatch) => {
    return app.core.consortia.all()
    .then((consortia) => {
      dispatch(setConsortia(consortia));
      return consortia;
    })
    .catch((err) => {
      app.notify('error', `Unable to download consortia: ${err}`);
      throw err;
    });
  };
});

/**
 * Update consortia from database change objects.
 *
 * @param {Object|Object[]} toUpdate POJO consortium/tia to patch onto existing state
 * @returns {Function}
 */
export function updateConsortia(toUpdate) {
  return dispatch => {
    const localToUpdate = Array.isArray(toUpdate) ? toUpdate : [toUpdate];

    localToUpdate.forEach(change => {
      if ('_deleted' in change && change._deleted) {
        dispatch(doDeleteConsortium(change._id));
      } else {
        dispatch(doUpdateConsortium(change));
      }
    });
  };
}

function consortiumSorter(a, b) {
  return a.label > b.label;
}

export default function reducer(state = [], action) {
  switch (action.type) {
    case SET_CONSORTIA:
      return [...state, ...action.consortia].sort(consortiumSorter);
    case DO_UPDATE_CONSORTIUM:
      return state.map(consortium => {
        return consortium._id === action.consortium._id ?
          action.consortium :
          consortium;
      }).sort(consortiumSorter);
    case DO_DELETE_CONSORTIUM:
      return state.filter(({ _id }) => _id !== action.id);
    default:
      return state;
  }
}
