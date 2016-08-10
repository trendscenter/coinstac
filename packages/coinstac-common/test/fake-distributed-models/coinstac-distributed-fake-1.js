module.exports = {
  name: 'test-fake-distributed-model-1',
  repository: { url: 'https://github.com/fake/group-add' },
  version: 'test-fake-distributed-model-1-version-1',
  local: {
    type: 'function',
    fn(prevRslt, agg, next) {}, // eslint-disable-line no-unused-vars
  },
  remote: {
    type: 'function',
    fn(newDoc, allDocs, aggData) {}, // eslint-disable-line no-unused-vars
  },
};
