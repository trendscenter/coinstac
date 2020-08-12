import { get, indexOf } from 'lodash';

export const isPipelineOwner = (permissions, owningConsortium) => {
  return indexOf(permissions.consortia[owningConsortium], 'owner') !== -1;
};

export const isAdmin = (user) => {
  return get(user, 'permissions.roles.admin', false);
};

export const isAuthor = (user) => {
  return get(user, 'permissions.roles.author', false);
};

export const isAllowedForComputationChange = (user) => {
  return isAdmin(user) || isAuthor(user);
};

export const getGraphQLErrorMessage = (error, defaultMessag) => {
  return get(error, 'graphQLErrors.0.message', defaultMessag);
};

export const isUserInGroup = (userId, groupArr) => {
  return Array.isArray(groupArr)
    ? groupArr.findIndex(user => user === userId)
    : userId in groupArr;
};
