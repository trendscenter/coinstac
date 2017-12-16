const fs = require('fs');
const path = require('path');

const parseFileGroup = (group) => {
  let pathsArray = [];
  let extension = null;

  // Empty subdirectory
  if (group.paths.length === 0) {
    return null;
  }

  // Return error
  if (group.error) {
    return group;
  }

  // Iterate through all paths
  for (let i = 0; i < group.paths.length; i += 1) {
    let p = group.paths[i];

    // Combine path with parent dir to get absolute path
    if (group.parentDir) {
      p = group.parentDir.concat(`/${p}`);
    }

    const stats = fs.statSync(p);

    if (stats.isDirectory()) {
      // Recursively retrieve path contents of directory
      const subGroup = parseFileGroup({
        paths: [...fs.readdirSync(p).filter(item => !(/(^|\/)\.[^\/\.]/g).test(item))], // eslint-disable-line no-useless-escape
        extension: group.extension,
        parentDir: p,
      });

      if (subGroup) {
        if (subGroup.error) {
          return subGroup;
        }

        if (extension && subGroup.extension && extension !== subGroup.extension) {
          return { error: `Group contains multiple extensions - ${extension} & ${subGroup.extension}.` };
        }

        extension = subGroup.extension;
        pathsArray = pathsArray.concat(subGroup.paths);
      }
    } else {
      const thisExtension = path.extname(p);

      if ((group.extension && thisExtension !== group.extension) ||
          (extension && extension !== thisExtension)) {
        return { error: `Group contains multiple extensions - ${thisExtension} & ${group.extension ? group.extension : extension}.` };
      }

      extension = thisExtension;
      pathsArray.push(p);
    }
  }

  return { paths: pathsArray, extension };
};

module.exports = {
  fileALaCarte(filePaths) {
    return parseFileGroup({ paths: filePaths, extension: null });
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
      .then(([metaFilePath, metaFile, files]) => ({ metaFilePath, metaFile, files }));
  },
  returnFileAsJSON(filePath, core) {
    return core.constructor.getJSONSchema(filePath[0]);
  },
};
