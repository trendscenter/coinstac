import { FETCH_ALL_CONSORTIA_QUERY } from './functions';

export const compIOProp = {
  props: ({ data: { fetchComputation } }) => ({
    compIO: fetchComputation ? fetchComputation[0] : null,
  }),
  options: ({ computationId }) => ({ variables: { computationIds: [computationId] } }),
};

export const computationsProp = {
  props: ({ data: { loading, fetchAllComputations } }) => ({
    loading,
    computations: fetchAllComputations,
  }),
};

export const consortiaMembershipProp = (name) => {
  return {
    props: ({ mutate }) => ({
      [name]: consortiumId => mutate({
        variables: { consortiumId },
        update: (store, { data }) => {
          const consQuery = store.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
          const index = consQuery.fetchAllConsortia
            .findIndex(con => con.id === data[name].id);
          if (index > -1) {
            consQuery.fetchAllConsortia[index].members = data[name].members;
          }
          store.writeQuery({ query: FETCH_ALL_CONSORTIA_QUERY, data: consQuery });
        },
      }),
    }),
  };
};

export const consortiaProp = {
  props: ({ data: { fetchAllConsortia } }) => ({
    consortia: fetchAllConsortia,
  }),
};

export const pipelinesProp = {
  props: ({ data: { fetchAllPipelines } }) => ({
    pipelines: fetchAllPipelines,
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
