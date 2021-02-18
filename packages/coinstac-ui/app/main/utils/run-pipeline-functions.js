function parsePipelineInput(pipeline, dataMappings) {
  const steps = [];

  const filesArray = {
    files: [],
    baseDirectory: null,
  };

  pipeline.steps.forEach((step, stepIndex) => {
    const consortiumMappedStepData = dataMappings ? dataMappings.map[stepIndex] : null;

    if (!consortiumMappedStepData) {
      steps.push({ ...step });
      return;
    }

    if (consortiumMappedStepData.filesArray && consortiumMappedStepData.filesArray.length > 0) {
      filesArray.files = filesArray.files.concat(consortiumMappedStepData.filesArray);
      filesArray.baseDirectory = consortiumMappedStepData.baseDirectory;
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
