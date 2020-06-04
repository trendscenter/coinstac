import { indexOf } from 'lodash';

// eslint-disable-next-line import/prefer-default-export
export const isPipelineOwner = (permissions, owningConsortium) => {
  return indexOf(permissions.consortia[owningConsortium], 'owner') !== -1;
};

export function pipelineNeedsDataMapping(pipeline) {
  if (!pipeline || !pipeline.steps) {
    return false;
  }

  let needsDataMapping = false;

  pipeline.steps.forEach((step) => {
    const inputMapSchemaKeys = Object.keys(step.inputMap);

    inputMapSchemaKeys.forEach((inputSchemaKey) => {
      const inputSchema = step.inputMap[inputSchemaKey];

      if (!inputSchema.fulfilled) {
        needsDataMapping = true;
      }
    });
  });

  return needsDataMapping;
}
