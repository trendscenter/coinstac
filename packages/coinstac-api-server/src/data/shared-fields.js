const computationFields = {
  computationFields: `
    input: JSON
    output: JSON
  `,
  computationMetaFields: `
    repository: String
    description: String
    name: String!
    tags: [String]
    version: String
    controller: String
  `,
  computationRemoteFields: `
    type: String
    dockerImage: String
    command: [String]
  `,
};

module.exports = computationFields;
