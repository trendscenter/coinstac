function parsePipelineInput(pipeline, dataMappings) {
  const steps = [];

  let filesArray = [];

  pipeline.steps.forEach((step, stepIndex) => {
    const consortiumMappedStepData = dataMappings ? dataMappings.map[stepIndex] : null;

    if (!consortiumMappedStepData) {
      steps.push({ ...step });
      return;
    }

    if (consortiumMappedStepData.files && consortiumMappedStepData.files.length > 0) {
      filesArray = filesArray.concat(consortiumMappedStepData.files);
    }

    const inputMapSchema = { ...step.inputMap };

    Object.keys(consortiumMappedStepData).forEach((mappedStepDataKey) => {
      inputMapSchema[mappedStepDataKey] = {
        ...consortiumMappedStepData[mappedStepDataKey],
      };
    });

    steps.push({
      ...step,
      inputMap: inputMapSchema,
    });
  });

  return {
    filesArray, // files for core to simlink
    steps,
  };
}

module.exports = {
  parsePipelineInput,
};
