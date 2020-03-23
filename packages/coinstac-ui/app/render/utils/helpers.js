import { indexOf } from 'lodash';

// eslint-disable-next-line import/prefer-default-export
export const isPipelineOwner = (permissions, owningConsortium) => {
  return indexOf(permissions.consortia[owningConsortium], 'owner') !== -1;
};
