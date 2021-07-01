const fs = require('fs');
const CsvReadableStream = require('csv-reader');

function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    try {
      const inputStream = fs.createReadStream(file, 'utf8');

      const data = {};
      let header = [];

      inputStream
        .pipe(new CsvReadableStream({
          parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true,
        }))
        .on('header', (headerRow) => {
          header = headerRow;
        })
        .on('data', (row) => {
          const rowData = {};

          row.forEach((cell, i) => {
            if (i === 0) {
              return;
            }

            rowData[header[i]] = cell;
          });

          // First column of each row serves as the row id
          data[row[0]] = rowData;
        })
        .on('end', () => {
          // Remove the first column from the header as it's just an id and does not need to
          // be shown to the user
          header = header.filter((col, i) => i !== 0);

          resolve({ header, data });
        });
    } catch (error) {
      reject(error);
    }
  });
}

async function parseFiles(headlessClientConfig) {
  const parsedConfig = { ...headlessClientConfig };

  const fileParsePromises = Object.keys(headlessClientConfig.computationWhitelist).map(
    (computationId) => {
      const { inputMap } = headlessClientConfig.computationWhitelist[computationId];

      const inputMapFieldPromises = Object.keys(inputMap).map(async (inputMapFieldKey) => {
        const inputMapField = inputMap[inputMapFieldKey];

        if (inputMapField.type === 'csv') {
          const parsedData = await parseCsvFile(inputMapField.dataFilePath);

          parsedConfig.computationWhitelist = {
            ...parsedConfig.computationWhitelist,
            [computationId]: {
              ...parsedConfig.computationWhitelist[computationId],
              inputMap: {
                ...parsedConfig.computationWhitelist[computationId].inputMap,
                [inputMapFieldKey]: {
                  ...parsedConfig.computationWhitelist[computationId].inputMap[inputMapFieldKey],
                  parsedDataFile: parsedData,
                },
              },
            },
          };
        }
      });

      return Promise.all(inputMapFieldPromises);
    }
  );

  await Promise.all(fileParsePromises);

  return parsedConfig;
}

module.exports = parseFiles;
