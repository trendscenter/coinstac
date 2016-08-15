import app from 'ampersand-app';
import { applyAsyncLoading } from './loading';
import { clone, map } from 'lodash';

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
 * Set inputs on a consortium's selected computation.
 *
 * This expects computations to look something like:
 *
 *   {
 *     "inputs": [
 *       [{
 *         "label": "Question 1",
 *         "type": "select",
 *         "values": ["Answer 1", "Answer 2", "Answer 3"]
 *       }, {
 *         "label": "Question 2",
 *         "multiple": true,
 *         "type": "select",
 *         "values": ["Answer 4", "Answer 5", "Answer 6"]
 *       }]
 *       // ...
 *     ],
 *     "local": [
 *       // ...
 *     ],
 *     "name": "my-comp",
 *     "plugins": ["group-step", "inputs"],
 *     "remote": [
 *       // ...
 *     ],
 *     "repository": "https://github.com/MRN-Code/my-comp",
 *     "version": "1.0.0"
 *   }
 *
 * …where the `inputs` is a collection of question arrays (questions). A
 * questions' index should coorespond with the `local` or `remote` pipeline
 * index for which the computation designer needs the input. Each question
 * object should directly represents a form control UI that's exposed to the
 * user before or during a run.
 *
 * For the time being, inputs' user responses are stored on the consortium to
 * facilitate runs.
 *
 *   {
 *     "activeComputationId": "123abc",
 *     "activeComputationInputs": [
 *       [
 *         ["Answer 2"],
 *         ["Answer 4", "Answer 6"]
 *       ],
 *       // ...
 *     ],
 *     "description": "My great consortium!",
 *     "label": "my-consortium",
 *     "owners": ["demo1"],
 *     "users": ["demo1", "demo2", "demo3"]
 *   }
 *
 * `activeComputationInputs`'s structure mirrors the computation's `inputs`
 * structure, except that the consortium's `activeComputationInputs` array's
 * array's contents match values found in the question object's `values` array.
 * These are the full value text instead of question values' indices to reduce
 * lookup queries and retain data in the case that computations' questions
 * change.
 *
 * @todo Refactor for extensibility along with other 'inputs' code.
 *
 * @param {string} consortiumId
 * @param {Number} fieldIndex
 * @param {Array} inputs
 * @returns {Function}
 */
export const setComputationInputs = applyAsyncLoading(
  (consortiumId, fieldIndex, values) => {
    return () => {
      const { core: { computations, consortia } } = app;

      return consortia.get(consortiumId)
        .then(consortium => {
          if (!consortium.activeComputationId) {
            throw new Error(
              `Can't set computation inputs without active computation on
              consortium ${consortiumId}`
            );
          }

          return Promise.all([
            consortium,
            computations.get(consortium.activeComputationId),
          ]);
        })
        .then(([consortium, computation]) => {
          // TODO: Add model prop accessor method to avoid ridiculous checks
          if (
            !computation ||
            !('inputs' in computation) ||
            !Array.isArray(computation.inputs) ||
            !computation.inputs.length
          ) {
            throw new Error(
              `Couldn't find inputs for computation ${computation._id}`
            );
          }

          let activeCompInputs = consortium.activeComputationInputs;

          // TODO: Figure out better `activeComputationInputs` initializiation.
          // Place on the model?
          if (!Array.isArray(activeCompInputs) || !activeCompInputs.lenght) {
            activeCompInputs = [[]];
          }

          // TODO: Don't lock to first index!
          if (activeCompInputs[0].length < fieldIndex) {
            // Fill with empty arrays:
            [].push.apply(
              activeCompInputs[0],
              map(Array(fieldIndex - activeCompInputs[0].length), () => [])
            );
          }

          activeCompInputs[0][fieldIndex] = values;

          consortium.activeComputationInputs = activeCompInputs;

          return consortia.save(consortium);
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
