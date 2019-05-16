import { GET_ALL_ASSOCIATED_CONSORTIA } from './functions';

const resolvers = {
  Query: {
    associatedConsortia: (_, args, { cache }) => {
      const { associatedConsortia } = cache.readQuery({ query: GET_ALL_ASSOCIATED_CONSORTIA });
      return associatedConsortia;
    },
  },
  Mutation: {
    saveAssociatedConsortium: (_, { consortiumId, activePipelineId = null }, { cache }) => {
      const { associatedConsortia } = cache.readQuery({ query: GET_ALL_ASSOCIATED_CONSORTIA });

      const associatedConsortium = {
        __typename: 'AssociatedConsortium',
        id: consortiumId,
        activePipelineId,
      };

      const consortiaList = [...associatedConsortia];

      const consortiumIndex = consortiaList.findIndex(c => c.id === consortiumId);
      if (consortiumIndex === -1) {
        consortiaList.push(associatedConsortium);
      } else {
        consortiaList.splice(consortiumIndex, 1, associatedConsortium);
      }

      cache.writeQuery({
        query: GET_ALL_ASSOCIATED_CONSORTIA,
        data: {
          associatedConsortia: consortiaList,
        },
      });

      return null;
    },
    deleteAssociatedConsortium: (_, { consortiumId }, { cache }) => {
      const { associatedConsortia } = cache.readQuery({ query: GET_ALL_ASSOCIATED_CONSORTIA });

      // const consortium = associatedConsortia.find(c => c.id === consortiumId);

      cache.writeQuery({
        query: GET_ALL_ASSOCIATED_CONSORTIA,
        data: {
          associatedConsortia: associatedConsortia.filter(c => c.id !== consortiumId),
        },
      });

      return null;
    },
  },
};

export default resolvers;
