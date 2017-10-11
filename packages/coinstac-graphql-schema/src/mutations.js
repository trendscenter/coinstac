const sharedFields = require('./shared-fields');

const mutations = {
  addComputation: `
    {
      addComputation(computationSchema: $computationSchema) {
        ${sharedFields.computationMetadata}
      }
    }
  `,
  saveConsortium: `
    {
      saveConsortium(consortium: $consortium) {
        ${sharedFields.consortiaInBrief}
      }
    }
  `,
};

module.exports = mutations;
