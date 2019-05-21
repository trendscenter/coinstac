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

export const getDocumentByParam = (param, prop, query) => ({
  props: ({ data }) => ({
    [prop]: data[query],
  }),
  options: ({ params }) => ({ variables: { [param]: params[param] } }),
});

export const consortiaMembershipProp = (name) => {
  if (name) {
    return {
      props: ({ mutate }) => ({
        [name]: (consortiumId, userId) => mutate({
          variables: { consortiumId, userId },
          update: (store, { data }) => {
            const consQuery = store.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
            const index = consQuery.fetchAllConsortia.findIndex((cons) => {
              if (cons && data[name]) {
                return cons.id === data[name].id;
              }
              return false;
            });
            if (index > -1) {
              consQuery.fetchAllConsortia[index].members = data[name].members;
            }
            store.writeQuery({ query: FETCH_ALL_CONSORTIA_QUERY, data: consQuery });
          },
        }),
      }),
    };
  }
};

export const getAllAndSubProp = (queryDocument, document, listProp, query, subProp, subscription, filter) => ({
  options: (props) => {
    const opts = { fetchPolicy: 'cache-and-network' };

    if (filter && filter === 'userId' && props.auth.user.id) {
      opts.variables = { [filter]: props.auth.user.id };
    }

    return opts;
  },
  props: props => ({
    [listProp]: props.data[query],
    [subProp]: () => {
      const variables = {};
      if (filter && filter === 'userId' && props.ownProps.auth.user.id) {
        variables.userId = props.ownProps.auth.user.id;
      }
      
      return props.data.subscribeToMore({
        document,
        variables,
        updateQuery: (prevResult, { subscriptionData: { data } }) => {
          const dataToUpdate = data[subscription];
          let previousQuery = prevResult;

          if (!previousQuery && props.ownProps.client) {
            previousQuery = props.ownProps.client.readQuery({ query: queryDocument });
          }

          const index = previousQuery[query].findIndex(c => c.id === dataToUpdate.id);

          if (query === 'fetchAllConsortia') {
            if (index !== -1) {
              const consortium = previousQuery[query][index];
              dataToUpdate.isMapped = consortium.isMapped;
              dataToUpdate.runs = consortium.runs;
              dataToUpdate.stepIO = consortium.stepIO;
              dataToUpdate.pipelineSteps = consortium.pipelineSteps;
            }

            if (!dataToUpdate.isMapped) dataToUpdate.isMapped = false;
            if (!dataToUpdate.runs) dataToUpdate.runs = 0;
            if (!dataToUpdate.stepIO) dataToUpdate.stepIO = [];
            if (!dataToUpdate.pipelineSteps) dataToUpdate.pipelineSteps = [];
          }

          if (dataToUpdate.delete) {
            return {
              [query]: previousQuery[query].filter(obj => obj.id !== dataToUpdate.id),
            };
          } if (index !== -1) {
            return {
              [query]: update(previousQuery[query], {
                $splice: [
                  [index, 1, dataToUpdate],
                ],
              }),
            };
          }

          return {
            [query]: [...previousQuery[query], dataToUpdate],
          };
        },
      });
    },
  }),
});

export const getSelectAndSubProp = (activeProp, document, objId, subProp, subscription, query) => ({
  options: (props) => {
    let theId = null;

    if (props[objId]) {
      theId = props[objId];
    } else if (props.params[objId]) {
      theId = props.params[objId];
    } else if (objId === 'userId') {
      theId = props.auth.user.id;
    }

    return {
      fetchPolicy: 'cache-and-network',
      variables: { [objId]: theId },
    };
  },
  props: props => ({
    [activeProp]: props.data[query],
    [subProp]: theId => props.data.subscribeToMore({
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

export const resultsProp = {
  props: ({ data: { fetchAllResults } }) => ({
    results: fetchAllResults,
  }),
};

export const removeDocFromTableProp = (docId, mutation, query, dataQuery) => {
  return {
    props: ({ mutate }) => ({
      [mutation]: theId => mutate({
        variables: { [docId]: theId },
        update: (store, { data }) => {
          const d = store.readQuery({ query });
          const index = d[dataQuery].findIndex(con => con.id === data[mutation].id);
          if (index > -1) {
            d[dataQuery].splice(index, 1);
          }
          store.writeQuery({ query, data: d });
        },
      }),
    }),
  };
};

export const saveDocumentProp = (funcName, objVar) => {
  return {
    props: ({ mutate }) => ({
      [funcName]: obj => mutate({
        variables: { [objVar]: obj },
      }),
    }),
  };
};

export const userRolesProp = (name) => {
  return {
    props: ({ ownProps, mutate }) => ({
      [name]: (userId, table, doc, role) => mutate({
        variables: {
          userId, table, doc, role,
        },
      }),
    }),
  };
};
