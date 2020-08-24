import { indexOf } from 'lodash';

// eslint-disable-next-line import/prefer-default-export
export const isPipelineOwner = (permissions, owningConsortium) => {
  return indexOf(permissions.consortia[owningConsortium], 'owner') !== -1;
};

export const isUserInGroup = (userId, groupArr) => {
  return Array.isArray(groupArr)
    ? groupArr.findIndex(user => user === userId)
    : userId in groupArr;
};
