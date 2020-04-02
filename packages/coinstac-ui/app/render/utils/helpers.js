import { indexOf } from 'lodash';

// eslint-disable-next-line import/prefer-default-export
export const isPipelineOwner = (permissions, owningConsortium) => {
  return indexOf(permissions.consortia[owningConsortium], 'owner') !== -1;
};

export const isUserInGroup = (userId, groupArr) => {
  let res = false;
  if(typeof groupArr === 'object'){
    groupArr = Object.values(groupArr);
  }
  groupArr.map((item) => {
    if(Object.keys(item).indexOf(userId) !== -1){
      res = true;
      return;
    }
  });
  return res;
};
