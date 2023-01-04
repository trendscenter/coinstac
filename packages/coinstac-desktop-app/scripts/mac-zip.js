/* eslint-disable no-console */
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');
const { appBuilderPath } = require('app-builder-bin');
const packageInfo = require('../package.json');

const APP_NAME = 'COINSTAC';
const APP_VERSION = packageInfo.version;
const APP_DIST_PATH = path.resolve(process.cwd(), 'dist');

console.log('Zipping Started');
console.log(APP_DIST_PATH);

execSync(
  `ditto -c -k --sequesterRsrc --keepParent --zlibCompressionLevel 9 "${APP_DIST_PATH}/mac/${APP_NAME}.app" "${APP_DIST_PATH}/${APP_NAME}-${APP_VERSION}-mac.zip"`
);

console.log('Zipping Completed');

const APP_GENERATED_BINARY_PATH = path.join(APP_DIST_PATH, `${APP_NAME}-${APP_VERSION}-mac.zip`);

(function wrap() {
  try {
    const output = execSync(
      `${appBuilderPath} blockmap --input="${APP_GENERATED_BINARY_PATH}" --output="${APP_DIST_PATH}/${APP_NAME}-${APP_VERSION}-mac.zip.blockmap" --compression=gzip`
    );
    const { sha512, size } = JSON.parse(output);

    const ymlPath = path.join(APP_DIST_PATH, 'latest-mac.yml');
    const ymlData = yaml.load(fs.readFileSync(ymlPath, 'utf8'));
    console.log(ymlData);
    ymlData.sha512 = sha512;
    ymlData.files[0].sha512 = sha512;
    ymlData.files[0].size = size;
    const yamlStr = yaml.dump(ymlData);
    console.log(yamlStr);
    fs.writeFileSync(ymlPath, yamlStr, 'utf8');
    console.log('Successfully updated YAML file and configurations with blockmap.');
  } catch (e) {
    console.log('Error in updating YAML file and configurations with blockmap.', e);
  }
}());
