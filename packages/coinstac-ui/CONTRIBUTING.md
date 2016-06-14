# contributing
we run a series of checks on commit.  make sure those pass (no short circuiting the tests, please :) )

## builds
`export NODE_ENV='production' && npm i && npm run build`

The `dist/` folder should now contain executable binaries for each platform.

## hot tips

- often times coinstac-ui will be paired with updates from coinstac-client-core.  it's helpful to `npm link` -client-core.  however, if -client-core was just freshly installed an linked, the -ui `"postinstall": "ionizer …"` command won't be able to build coinstac-client-core for coinstac-ui. run the following to rebuild coinstac-client-core for the version of electron deployed in -ui.
  - `node ./node_modules/.bin/ionizer -q -e /YOUR_PATH_HERE/coinstac-ui/node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron --modules-dir="/YOUR_PATH_HERE/coinstac-client-core/node_modules" --log-level=debug --limit="leveldown"`
  - on some systems, you may have to dig deep:
    - `node_modules/.bin/ionizer -m ../coinstac-client-core/node_modules/pouchy/node_modules/pouchdb/node_modules/ --log-level=debug -q`
- COINSTAC keeps some data stored on the filesystem. If you want to clear these for testing, do so with:

```shell
rm -rf ~/.coinstac
```
