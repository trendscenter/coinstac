module.exports = {
  name: 'test-fake-distributed-model-1',
  repository: { url: 'https://github.com/fake/group-add' },
  version: 'test-fake-distributed-model-1-version-1',
  local: {
    type: 'function',
    fn: function (prevRslt, agg, next) {},
  },
  remote: {
    type: 'function',
    fn: function (newDoc, allDocs, aggData) {},
  },
};
