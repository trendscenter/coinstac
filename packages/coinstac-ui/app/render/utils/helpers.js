import { get, indexOf } from 'lodash';

export const isPipelineOwner = (permissions, owningConsortium) => {
  return indexOf(permissions.consortia[owningConsortium], 'owner') !== -1;
};

export const isAdmin = (user) => {
  return get(user, 'permissions.roles.admin', false);
};
