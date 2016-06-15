module.exports = {
  name: 'test-fake-distributed-model-2',
  repository: { url: 'https://github.com/fake/group-add' },
  version: 'test-fake-distributed-model-2-version-1',
  local: {
    type: 'function',
    fn: function (prevRslt, agg, next) {},

    seed: function () {},
  },
  remote: {
    type: 'function',
    fn: function (newDoc, allDocs, aggData) {},

    seed: function () {},
  },
};
