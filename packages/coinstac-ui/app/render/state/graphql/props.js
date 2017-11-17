import update from 'immutability-helper';
import {
  FETCH_ALL_CONSORTIA_QUERY,
} from './functions';

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

export const deleteConsortiumProp = {
  props: ({ mutate }) => ({
    deleteConsortium: consortiumId => mutate({
      variables: { consortiumId },
      update: (store, { data: { deleteConsortiumById } }) => {
        const data = store.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
        const index = data.fetchAllConsortia.findIndex(con => con.id === deleteConsortiumById.id);
        if (index > -1) {
          data.fetchAllConsortia.splice(index, 1);
        }
        store.writeQuery({ query: FETCH_ALL_CONSORTIA_QUERY, data });
      },
    }),
  }),
};

export const getAllAndSubProp = (document, listProp, query, subProp, subscription) => ({
  options: {
    fetchPolicy: 'cache-and-network',
  },
  props: props => ({
    [listProp]: props.data[query],
    [subProp]: () =>
      props.data.subscribeToMore({
        document,
        updateQuery: (prevResult, { subscriptionData: { data } }) => {
          const index =
            prevResult[query].findIndex(c => c.id === data[subscription].id);

          if (data[subscription].delete) {
            return {
              [query]: prevResult[query].filter(obj => obj.id !== data[subscription].id),
            };
          } else if (index !== -1) {
            return {
              [query]: update(prevResult[query], {
                $splice: [
                  [index, 1, data[subscription]],
                ],
              }),
            };
          }

          return {
            [query]: [...prevResult[query], data[subscription]],
          };
        },
      }),
  }),
});

export const getSelectAndSubProp = (activeProp, document, objId, subProp, subscription, query) => ({
  options: (props) => {
    let theId = null;

    if (props[objId]) {
      theId = props[objId];
    } else if (props.params[objId]) {
      theId = props.params[objId];
    }

    return {
      fetchPolicy: 'cache-and-network',
      variables: { [objId]: theId },
    };
  },
  props: props => ({
    [activeProp]: props.data[query],
    [subProp]: theId =>
      props.data.subscribeToMore({
        document,
        variables: { [objId]: theId },
        updateQuery: (prevResult, { subscriptionData: { data } }) => {
          if (data[subscription].delete) {
            return { [query]: null };
          }

          return { [query]: data[subscription] };
        },
      }),
  }),
});

export const pipelinesProp = {
  props: ({ data: { fetchAllPipelines } }) => ({
    pipelines: fetchAllPipelines,
  }),
};

export const saveConsortiumProp = {
  props: ({ mutate }) => ({
    saveConsortium: consortium => mutate({
      variables: { consortium },
    }),
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
