const GraphQLJSON = require('graphql-type-json');
import {
  GET_ALL_ASSOCIATED_CONSORTIA,
  GET_ALL_COLLECTIONS,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
} from './functions';

const resolvers = {
  JSON: GraphQLJSON,
  Consortium: {
    isMapped: (consortium, _, { cache }) => {
      return !!consortium.isMapped;
    },
    runs: (consortium, _, { cache }) => {
      return consortium.runs ? consortium.runs : 0;
    },
    stepIO: (consortium, _, { cache }) => {
      return consortium.stepIO ? consortium.stepIO : [];
    },
    pipelineSteps: (consortium, _, { cache }) => {
      const { fetchAllPipelines } = cache.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });

      let steps = null;
      if (consortium.activePipelineId && fetchAllPipelines) {
        const activePipeline = fetchAllPipelines.find(p => p.id === consortium.activePipelineId);

        steps = activePipeline ? activePipeline.steps : null;
      }
      
      return steps;
    }
  },
  // Query: {
  //   getCollectionFiles: (_, { consortiumId }, { cache }) => {
  //     const { fetchAllConsortia } = cache.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });

  //     const consortium = fetchAllConsortia.find(c => c.id === consortiumId);

  //     let returnData = { collections: [] };
  //     if (consortium.pipelineSteps) {
  //       returnData = iteratePipelineSteps(consortium);
  //     }

  //     if ('error' in returnData) {
  //       return returnData;
  //     }

  //     if (returnData.collections.length === 0) {
  //       return { allFiles: returnData.collections };
  //     }

  //     const { collections } = cache.readQuery({ query: GET_ALL_COLLECTIONS });

  //     const localCollections = collections.filter(collection => returnData.collections.findIndex(
  //         c => c.collectionId === collection.id
  //       ) > -1);

  //     let allFiles = [];
  //     const filesByGroup = {};
  //     let metaDir;
  //     localCollections.forEach((coll) => {
  //       Object.values(coll.fileGroups).forEach((group) => {
  //         allFiles = allFiles.concat(coll.fileGroups[group.id].files);
  //         if ('metaFile' in group) {
  //           metaDir = dirname(group.metaFilePath);
  //           filesByGroup[group.id] = coll.fileGroups[group.id].metaFile;
  //         } else {
  //           filesByGroup[group.id] = coll.fileGroups[group.id].files;
  //         }
  //       });
  //     });

  //     // TODO: Reconsider how to get updated steps
  //     const { steps } = iteratePipelineSteps(consortium, filesByGroup, metaDir);

  //     return { allFiles, steps };
  //   },
  // },
  Mutation: {
    saveCollection: (_, { name, associatedConsortium, fileGroups }, { cache }) => {
      try {
        const { collections } = cache.readQuery({ query: GET_ALL_COLLECTIONS });

        const collection = {
          __typename: 'Collection',
          name,
          associatedConsortium,
          fileGroups
        };

        const collectionsList = [...collections];
        
        const collectionIndex = collectionsList.findIndex(c => c.associatedConsortium === associatedConsortium);
        if (collectionIndex === -1) {
          collectionsList.push(collection);
        } else {
          collectionsList.splice(collectionIndex, 1, collection);
        }

        cache.writeQuery({
          query: GET_ALL_COLLECTIONS,
          data: {
            collections: collectionsList,
          }
        });
      }
      catch (error) {
        console.error(error);
      }
    },
    saveConsortiumMapping: (_, { consortiumId, stepIO }, { cache }) => {
      try {
        const { fetchAllConsortia } = cache.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
  
        const consortiaList = [...fetchAllConsortia];

        const consortiumIndex = consortiaList.findIndex(c => c.id === consortiumId);
        if (consortiumIndex > -1) {
          const consortium = consortiaList[consortiumIndex];
          consortiaList.splice(consortiumIndex, 1, {
            ...consortium,
            stepIO,
            isMapped: true,
          });
        }

        cache.writeQuery({
          query: FETCH_ALL_CONSORTIA_QUERY,
          data: {
            fetchAllConsortia: consortiaList,
          }
        });
      }
      catch (error) {
        console.error(error);
      }
    },
    updateConsortiumPipelineSteps: (_, { consortiumId, pipelineId }, { cache }) => {
      try {
        const { fetchAllConsortia } = cache.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
        const { fetchAllPipelines } = cache.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });
  
        const consortiaList = [...fetchAllConsortia];

        const consortiumIndex = consortiaList.findIndex(c => c.id === consortiumId);
        if (consortiumIndex > -1) {
          const consortium = consortiaList[consortiumIndex];

          let steps = null;
          if (fetchAllPipelines) {
            const activePipeline = fetchAllPipelines.find(p => p.id === pipelineId);
            steps = activePipeline ? activePipeline.steps : null;
          }

          consortiaList.splice(consortiumIndex, 1, {
            ...consortium,
            pipelineSteps: steps
          });
        }

        cache.writeQuery({
          query: FETCH_ALL_CONSORTIA_QUERY,
          data: {
            fetchAllConsortia: consortiaList,
          }
        });
      }
      catch (error) {
        console.error(error);
      }
    },
  },
};

export default resolvers;
