function parsePipelineInput(pipeline, dataMappings) {
  const steps = [];

  pipeline.steps.forEach((step, stepIndex) => {
    const consortiumMappedStepData = dataMappings ? dataMappings.dataMappings[stepIndex] : null;

    if (!consortiumMappedStepData) {
      steps.push({ ...step });
      return;
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
    filesArray: dataMappings ? dataMappings.dataFiles : [], // files for core to simlink
    steps,
  };
}

module.exports = {
  parsePipelineInput,
};
