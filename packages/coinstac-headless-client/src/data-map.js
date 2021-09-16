const { dirname } = require('path');

function mapData(pipeline, headlessClientConfig) {
  const steps = [];
  const filesArray = {
    files: [],
    baseDirectory: null,
  };

  pipeline.steps.forEach((step) => {
    const inputMap = {};
    const stepMappedData = headlessClientConfig.computationWhitelist[step.computations[0].id];

    Object.keys(step.inputMap).forEach((inputMapKey) => {
      if (step.inputMap[inputMapKey].fulfilled || !(inputMapKey in stepMappedData.inputMap)) {
        return;
      }

      inputMap[inputMapKey] = { ...step.inputMap[inputMapKey] };

      const inputMapVariables = inputMap[inputMapKey].value.map(field => field.name);
      const mappedData = stepMappedData.inputMap[inputMapKey];

      // has csv column mapping
      if (mappedData.type === 'csv') {
        const value = { ...mappedData.parsedDataFile.data };

        filesArray.baseDirectory = dirname(mappedData.dataFilePath);

        Object.keys(value).forEach((valueKey) => {
          filesArray.files.push(valueKey);

          inputMapVariables.forEach((variable) => {
            const fieldMap = mappedData.dataMap.find(
              fieldMap => fieldMap.variableName === variable
            );

            if (fieldMap) {
              value[valueKey][variable] = value[valueKey][fieldMap.csvColumn];

              if (fieldMap.csvColumn !== variable) {
                delete value[valueKey][fieldMap.csvColumn];
              }
            }
          });
        });

        inputMap[inputMapKey].value = value;
      }
    });

    steps.push({
      ...step,
      inputMap,
    });
  });

  return {
    steps,
    filesArray,
  };
}

module.exports = mapData;
