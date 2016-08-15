import app from 'ampersand-app';
import { applyAsyncLoading } from './loading';
import { clone } from 'lodash';

export const DO_DELETE_CONSORTIA = 'DO_DELETE_CONSORTIA';

function doDeleteConsortia(consortia) {
  if (!Array.isArray(consortia)) {
    throw new Error('Expected consortia to be an array');
  }

  return {
    consortia,
    type: DO_DELETE_CONSORTIA,
  };
}

export const DO_UPDATE_CONSORTIA = 'DO_UPDATE_CONSORTIA';

function doUpdateConsortia(consortia) {
  if (!Array.isArray(consortia)) {
    throw new Error('Expected consortia to be an array');
  }

  return {
    consortia,
    type: DO_UPDATE_CONSORTIA,
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
 * Set active computation on a consortium.
 *
 * @param {string} consortiumId
 * @param {string} computationId Computation's ID to set as
 * `activeComputationId` on the consortium model
 * @returns {Function}
 */
export const setActiveComputation = applyAsyncLoading(
  (consortiumId, computationId) => {
    return () => {
      const { core: { consortia } } = app;

      if (!computationId) {
        return Promise.reject('No computation ID specified');
      }

      return consortia.get(consortiumId)
        .then(consortium => {
          const myConsortium = clone(consortium);
          myConsortium.activeComputationId = computationId;

          return consortia.save(myConsortium);
        });
    };
  }
);

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

/**
 * Update consortia from database change objects.
 *
 * @param {Object|Object[]} toUpdate POJO consortium/tia to patch onto existing state
 * @returns {Function}
 */
export function updateConsortia(consortia) {
  return dispatch => {
    const localToUpdate = Array.isArray(consortia) ? consortia : [consortia];
    const toDelete = [];
    const toUpdate = [];

    localToUpdate.forEach(change => {
      if ('_deleted' in change && change._deleted) {
        toDelete.push(change);
      } else {
        toUpdate.push(change);
      }
    });

    if (toDelete.length) {
      dispatch(doDeleteConsortia(toDelete));
    }

    if (toUpdate.length) {
      dispatch(doUpdateConsortia(toUpdate));
    }
  };
}

/**
 * Save a consortium.
 *
 * @param {Object} consortium
 * @returns {Function}
 */
export const saveConsortium = applyAsyncLoading(consortium => {
  return dispatch => {
    return app.core.consortia.save(consortium)
    .then((newTium) => {
      dispatch(updateConsortia(newTium));
      return newTium;
    });
  };
});

export function consortiaSorter(a, b) {
  return a.label > b.label;
}

export default function reducer(state = [], action) {
  switch (action.type) {
    /**
     * There's no distinction between 'new' and 'changed' consortia in PouchDB
     * change events. Treat both cases as 'updates':
     */
    case DO_UPDATE_CONSORTIA: {
      const newConsortia = [];
      const changed = [];
      const unchanged = [...state];

      action.consortia.forEach(consortium => {
        const index = unchanged.findIndex(c => c._id === consortium._id);

        if (index > -1) {
          unchanged.splice(index, 1);
          changed.push(consortium);
        } else {
          newConsortia.push(consortium);
        }
      });

      return [...unchanged, ...changed, ...newConsortia].sort(consortiaSorter);
    }
    case DO_DELETE_CONSORTIA: {
      const ids = action.consortia.map(({ _id }) => _id);

      return state.filter(({ _id }) => ids.indexOf(_id) < 0);
    }
    default:
      return state;
  }
}
