const { dirname } = require('path');

function mapData(pipeline, headlessClientConfig) {
  const steps = [];
  const filesArray = {
    files: [],
    baseDirectory: null,
  };

  pipeline.steps.forEach((step) => {
    const inputMap = {};
    const stepMappedData = headlessClientConfig[step.computations[0].id];

    Object.keys(step.inputMap).forEach((inputMapKey) => {
      inputMap[inputMapKey] = { ...step.inputMap[inputMapKey] };

      if (step.inputMap[inputMapKey].fulfilled || !(inputMapKey in stepMappedData.inputMap)) {
        return;
      }

      const inputMapVariables = inputMap[inputMapKey].value.map(field => field.name);
      const mappedData = stepMappedData.inputMap[inputMapKey];

      // has csv column mapping
      if (mappedData.type === 'csv') {
        const value = {};
        const csvData = { ...mappedData.parsedDataFile.data };

        filesArray.baseDirectory = dirname(mappedData.dataFilePath);

        Object.keys(csvData).forEach((subj) => {
          value[subj] = {};
          filesArray.files.push(subj);

          inputMapVariables.forEach((mappedColumnName) => {
            const fieldMap = mappedData.dataMap.find(
              fieldMap => fieldMap.variableName === mappedColumnName
            );

            if (fieldMap) {
              value[subj][mappedColumnName] = csvData[subj][fieldMap.csvColumn];
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
