module.exports = {
  manualFileSelection(filePaths, core) {
    return core.constructor.getSubPathsAndGroupExtension({ paths: filePaths, extension: null });
  },
  parseCSVMetafile(metaFilePath, core) {
    return Promise.all([
      metaFilePath[0],
      core.constructor.getCSV(metaFilePath[0]),
    ])
      .then(([metaFilePath, rawMetaFile]) => {
        const metaFile = JSON.parse(rawMetaFile);
        return Promise.all([
          metaFilePath,
          metaFile,
          core.constructor.getFilesFromMetadata(
            metaFilePath,
            metaFile
          ),
        ]);
      })
      .then(([metaFilePath, metaFile, files]) => ({ metaFilePath, metaFile, files, extension: '.csv' }));
  },
  returnFileAsJSON(filePath, core) {
    return core.constructor.getJSONSchema(filePath[0]);
  },
};
