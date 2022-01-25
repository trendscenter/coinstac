import { ipcRenderer } from 'electron';
import {
  get, indexOf, setWith, take, values, keys,
} from 'lodash';

import { v4 as uuidv4 } from 'uuid'; // eslint-disable-line

export function isPipelineOwner(permissions, owningConsortium) {
  return indexOf(permissions.consortia[owningConsortium], 'owner') !== -1;
}

export function pipelineNeedsDataMapping(pipeline) {
  if (!pipeline || !pipeline.steps) {
    return false;
  }

  let needsDataMapping = false;

  pipeline.steps.forEach((step) => {
    const inputMapSchemaKeys = Object.keys(step.inputMap);

    inputMapSchemaKeys.forEach((inputSchemaKey) => {
      if (!step.inputMap[inputSchemaKey].fulfilled) {
        needsDataMapping = true;
      }
    });
  });

  return needsDataMapping;
}

export function reducePipelineInputs(pipeline) {
  if (!pipeline || !pipeline.steps) {
    return [];
  }

  const reducedInputs = pipeline.steps.reduce((inputs, step) => {
    const inputsArray = [...inputs];

    Object.keys(step.inputMap).forEach((inputMapKey) => {
      if (step.inputMap[inputMapKey].fulfilled) {
        return;
      }

      if (Array.isArray(step.inputMap[inputMapKey].value)) {
        inputsArray.push(...step.inputMap[inputMapKey].value);
      } else {
        inputsArray.push(step.inputMap[inputMapKey].value);
      }
    });

    return inputsArray;
  }, []);

  return reducedInputs;
}

export const isAdmin = (user) => {
  return get(user, 'permissions.roles.admin', false);
};

export const isAuthor = (user) => {
  return get(user, 'permissions.roles.author', false);
};

export const isAllowedForComputationChange = (user) => {
  return isAdmin(user) || isAuthor(user);
};

export const isOwnerOfAnyHeadlessClient = (user) => {
  return Object.keys(get(user, 'permissions.headlessClients', {})).length > 0;
};

export const getGraphQLErrorMessage = (error, defaultMessag) => {
  return get(error, 'graphQLErrors.0.message', defaultMessag);
};

export const isUserInGroup = (userId, groupArr) => {
  return Array.isArray(groupArr)
    ? groupArr.findIndex(user => user === userId)
    : userId in groupArr;
};

/**
 * Read the csv with freesurfer data
 * @param {Csv files} files
 */
export function readCsvFreesurferFiles(files) {
  return ipcRenderer.invoke('parseCsv', files);
}

export const buildTree = (nodes) => {
  const trees = {};

  nodes.forEach((node) => {
    const segments = node.split('/');

    for (let segIndex = 0; segIndex < segments.length; segIndex += 1) {
      const parents = take(segments, segIndex);

      const currentSegment = segments[segIndex];

      if (segIndex === 0) {
        if (!trees[currentSegment]) {
          trees[currentSegment] = {
            id: currentSegment,
            name: currentSegment,
            children: {},
          };
        }
      } else {
        const path = `${parents.join('.children.')}.children`;
        const currentPath = [...path.split('.'), currentSegment];

        if (!get(trees, currentPath)) {
          setWith(trees, currentPath, {
            id: currentSegment,
            name: currentSegment,
            children: {},
          }, Object);
        }
      }
    }
  });


  const root = {
    id: 'root',
    name: 'root',
    children: trees,
  };

  const convertObjectToArray = (tree) => {
    if (!tree.children) {
      return {
        id: `${tree.id}-${uuidv4()}`,
        name: tree.name,
        children: [],
      };
    }

    if (Array.isArray(tree.children)) {
      if (keys(tree.children) === 0) {
        return {
          id: `${tree.id}-${uuidv4()}`,
          name: tree.name,
          children: [],
        };
      }
    }

    return {
      id: `${tree.id}-${uuidv4()}`,
      name: tree.name,
      children: values(tree.children).map(elem => convertObjectToArray(elem)),
    };
  };

  const res = convertObjectToArray(root);

  return res;
};

export const generateInitalFileTree = (consortia, runs) => {
  return consortia.map((consortium) => {
    const consortiumRuns = runs.filter(
      run => run.consortiumId === consortium.id && !!run.endDate
    ).map(run => ({
      id: run.id, pipelineName: run.pipelineSnapshot.name, endDate: Number(run.endDate),
    }));

    return {
      id: consortium.id,
      name: consortium.name,
      runs: consortiumRuns,
    };
  });
};
