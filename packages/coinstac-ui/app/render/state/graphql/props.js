export const computationsProp = {
  props: ({ data: { loading, fetchAllComputations } }) => ({
    loading,
    computations: fetchAllComputations,
  }),
};

export const consortiaProp = {
  props: ({ data: { fetchAllConsortia } }) => ({
    consortia: fetchAllConsortia,
  }),
};

export const userRolesProp = (name) => {
  return {
    props: ({ ownProps, mutate }) => ({
      [name]: (userId, table, doc, role) => mutate({
        variables: { userId, table, doc, role },
      })
      .then(({ data: { [name]: { permissions } } }) => {
        return ownProps.updateUserPerms(permissions);
      }),
    }),
  };
};
