const computationFields = {
  computationMetaFields() {
    return `
      repository: String
      description: String
      name: String!
      tags: [String]
      version: String
      dockerImage: String
    `;
  },
  computationFields(type) {
    return `
      meta: ComputationMeta${type}
      local: ComputationLocal${type}
      remote: ComputationRemote${type}
    `;
  },
};

module.exports = computationFields;
