import { indexOf } from 'lodash';

const COMP_INPUT_NEED_USER_DATA = [
  'csv',
  'freesurfer',
  'files',
];

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
      const compInputField = step.computations[0].computation.input[inputSchemaKey];
      const compInputFieldType = compInputField.type.toLowerCase();

      if (COMP_INPUT_NEED_USER_DATA.includes(compInputFieldType)) {
        needsDataMapping = true;
      }
    });
  });

  return needsDataMapping;
}
