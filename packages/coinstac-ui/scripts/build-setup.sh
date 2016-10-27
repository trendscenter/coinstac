#!/bin/bash

rm -rf node_modules/coinstac-{common,client-core}
mkdir -p node_modules/coinstac-{common,client-core}

cp -r ../coinstac-common/{package.json,src} ./node_modules/coinstac-common/
cp -r ../coinstac-client-core/{bin,config.js,package.json,src} ./node_modules/coinstac-client-core/

npm install

