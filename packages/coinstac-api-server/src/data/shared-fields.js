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
  userFields: `
    email: String!
    institution: String
    passwordHash: String!
    permissions: JSON
  `,
};

module.exports = computationFields;
