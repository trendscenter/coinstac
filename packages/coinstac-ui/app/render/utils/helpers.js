import { indexOf } from 'lodash';

// eslint-disable-next-line
export const isPipelineOwner = (permissions, owningConsortium) => {
  return indexOf(permissions.consortia[owningConsortium], 'owner') !== -1
}
