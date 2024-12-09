const getDefaultValuesFromComputation = (computation) => {
  if (!computation?.input) {
    return {};
  }

  return Object.keys(computation.input).reduce((acc, key) => {
    const inputField = computation.input[key];

    if ('default' in inputField) {
      acc[key] = {
        fulfilled: inputField.source === 'owner',
        value: inputField.default,
      };
    }

    return acc;
  }, {});
};

const getDefaultValuesFromHeadlessClients = (
  headlessMembers,
  headlessClientsConfig,
  computationId,
) => {
  if (!headlessMembers) {
    return {};
  }

  const inputMap = {};

  Object.keys(headlessMembers).forEach((headlessClientId) => {
    const headlessClientConfig = headlessClientsConfig.find(
      hc => hc.id === headlessClientId,
    );

    if (!headlessClientConfig) {
      return;
    }

    const computationConfig = headlessClientConfig.computationWhitelist[computationId];

    Object.keys(computationConfig.inputMap).forEach((inputKey) => {
      const input = computationConfig.inputMap[inputKey];

      let value;

      if (input.type === 'csv') {
        value = input.dataMap.map(dataMapField => ({
          name: dataMapField.variableName,
          type: dataMapField.type,
          suggested: true,
        }));
      }

      if (value) {
        inputMap[inputKey] = {
          fulfilled: false,
          value,
        };
      }
    });
  });

  return inputMap;
};

export const getInputMaps = (
  headlessMembers,
  headlessClientsConfig,
  computation,
  computationId,
  initialMap = {},
) => ({
  ...initialMap,
  ...getDefaultValuesFromComputation(computation),
  ...getDefaultValuesFromHeadlessClients(
    headlessMembers,
    headlessClientsConfig,
    computationId,
  ),
});
