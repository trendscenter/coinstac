function parsePipelineInput(pipeline, dataMappings) {
  const steps = [];

  let filesArray = [];

  pipeline.steps.forEach((step, stepIndex) => {
    const consortiumMappedStepData = dataMappings ? dataMappings.map[stepIndex] : null;

    if (!consortiumMappedStepData) {
      steps.push({ ...step });
      return;
    }

    if (consortiumMappedStepData.filesArray && consortiumMappedStepData.filesArray.length > 0) {
      filesArray = filesArray.concat(consortiumMappedStepData.filesArray);
    }

    steps.push({
      ...step,
      inputMap: consortiumMappedStepData.inputMap,
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
