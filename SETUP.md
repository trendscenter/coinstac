# Setup

These instructions explain how to get COINSTAC up and running on your machine:

## Required Software

You’ll need some software installed:

1. **Build tools,** namely g++/gcc.
  * OS X: The easiest way to install Xcode through Apple’s App Store. (You can try [installing the command line tools](https://www.maketecheasier.com/install-command-line-tools-without-xcode/))
  * Linux: `apt-get install build-essential` for Ubuntu-flavored versions. Check your distro for details.
2. **Install git.** See https://git-scm.com/download. You may also try [GitHub’s desktop client](https://desktop.github.com/): see [their post for CLI instructions](https://github.com/blog/1510-installing-git-from-github-for-mac).
3. **Install Node.js**, specifically version 8.2.1. You can enter `node -v` to find out which version you have.
   * Consider [using n](https://www.npmjs.com/package/n) for easy Node.js version management if you already have a version of Node.js installed.
   * Linux: See the [official installation instructions](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
   * OS X: Download the [package](https://nodejs.org/download/release/v8.2.1/node-v8.2.1.pkg) and run the installer

## Downloading Source Code

Open a shell and navigate (using `cd`) to the directory where you want to install COINSTAC. This can be anywhere, but if you're following the development instructions below, having it in your HOME directory is recommended. Then, use git to download the repository:

```shell
git clone https://github.com/MRN-Code/coinstac.git
```

This will place COINSTAC into a new folder named “coinstac” and check out the “demo” branch.

## Installing Dependencies

Move into the _coinstac_ directory (`cd coinstac`) and run the following commands:

```shell
npm install // needed only for initial top level setup
npm run build
```

These [dependencies](https://github.com/trendscenter/coinstac/blob/master/package-lock.json) will be installed.

## Updating Source Code
Any time you pull in new code, you'll need to rebuild the application.
1. `git pull` to get the latest source code
2. `npm run build` from the root _coinstac_ directory to install dependencies and link packages

*If the above leaves you with errors, try first cleaning the repo (`npm run clean` in root directory) and also reinstalling the root directory's dependencies (`npm i`).*

## Running the UI

The user interface is an [Electron application](http://electron.atom.io/). To run it:

1. Make sure you’re in the _coinstac/packages/coinstac-ui/_ directory.
2. If running for the first time: Run `npm install` to make sure all the necessary packages are installed.
3. Run `npm start` to start the UI

## Troubleshooting

* Ensure machines have at least 2 GB of memory. If you don’t have that much memory, run `npm install` in each directory in _coinstac/packages/_.
* If `npm run build` fails repeatedly, there’s likely a problem with [lerna’s](https://lernajs.io/) persisted state. Remove the _node_modules_ directory from each of the _coinstac/packages/<package name>_ directories.
* If you notice repeated `TypeError`s related to COINSTAC internal methods, the COINSTAC internals maybe be unlinked. Run `npm run build` to re-link them.

# Development Setup

Follow the general steps above before continuing.

## Additional Required Software

1. **RethinkDB** On OSX, using [Homebrew](https://brew.sh/), use: `brew update && brew install rethinkdb`. Other options [here](https://rethinkdb.com/docs/install/).
2. **VSCode** There are no shortage of options when it comes to an editor, but [VSCode](https://code.visualstudio.com/) offers some great [debugging functionality](https://code.visualstudio.com/Docs/editor/debugging). The root directory has a `launch.json` as outlined [here](https://code.visualstudio.com/Docs/editor/debugging#_launch-configurations), with the following contents:

   ```json
   {
      "version": "0.1.1",
      "configurations": [
          {
              "type": "node",
              "request": "attach",
              "name": "Attach to Port",
              "port": 9229
          },
          {
              "name": "Debug",
              "type": "node",
              "request": "launch",
              "cwd": "${workspaceRoot}",
              "runtimeExecutable": "${workspaceRoot}/packages/coinstac-ui/node_modules/.bin/electron",
              "program": "${workspaceRoot}/packages/coinstac-ui/app/main/index.js",
              "env": {
                  "COINS_ENV": "development",
                  "NODE_ENV": "development"
              },
              "runtimeArgs": []
          },
          {
              "name": "Attach",
              "type": "node",
              "address": "localhost",
              "port": 5858,
              "sourceMaps": false
          }
      ]
   }
   ```
3. **Docker** Download [here](https://www.docker.com/get-docker)
4. **mosquitto** `brew install mosquitto`

## Additional Source Code

1. **CSTAC DB** Next, create a new directory and file at `/etc/coinstac/cstacDBMap.json` with the following contents:

   ```json
    {
      "rethinkdbAdmin": {
        "user": "admin",
        "password": ""
      },
      "rethinkdbServer": {
        "username": "server",
        "password": "password"
      },
      "cstacJWTSecret": "friends"
    }


## Configuration

Create a new file at `coinstac/packages/coinstac-ui/config/local.json` and copy into it the following, conversely there is a `local-example.json` that cointains the local defualts that work for local development work. Just copy that file to `local.json` in the `config` directory.

   ```json
   {
     "apiServer": {
       "hostname": "localhost",
       "pathname": "",
       "port": "3100",
       "protocol": "http:"
     },
     "subApiServer": {
       "hostname": "localhost",
       "pathname": "",
       "port": "3100",
       "protocol": "ws:"
     },
     "pipelineWSServer": {
       "hostname": "localhost",
       "pathname": "",
       "port": "3300",
       "protocol": "http:"
     },
     "mqttServer": {
       "hostname": "localhost",
       "pathname": "",
       "port": "1883",
       "protocol": "mqtt:"
     }
   }
   ```

As well as the above config, the `coinstac-server` needs to be pointed to your local mosquitto instance.
Place the following in `/coinstac-server/config/local.json`
   ```json
   {
     "mqttServer": {
       "hostname": "localhost",
       "pathname": "",
       "port": "1883",
       "protocol": "mqtt:"
     }
   }
   ```

## Run Development Environment

Five services need to be run in the following order to start COINSTAC in development mode:

1. **Docker**
2. **RethinkDB**:
  ```shell
  rethinkdb --daemon
  ```
3. **COINSTAC-API-SERVER**:
  If it's the first time the app has been started, or you want to clear back to base data run:
  ```shell
  cd ~/coinstac/packages/coinstac-api-server && npm run test-setup
  ```
  The GraphQL and DB server.
  ```shell
  cd ~/coinstac/packages/coinstac-api-server && npm run start
  ```
  * If it's your first time running, you'll need to seed your DB: `npm run test-setup` before starting in the `coinstac-api-server` directory.
4. **COINSTAC-SERVER**:
  The "pipeline" server. Runs remote pipelines and sends result to the api-server.
  ```shell
  cd ~/coinstac/packages/coinstac-server && npm run start
  ```
5. **WEBPACK SERVER**:
  ```shell
  NODE_ENV=development && cd ~/coinstac/packages/coinstac-ui && npm run watch
  ```
2. **mosquitto**:
  ```shell
  mosquitto -c /path/to/your/config
  ```
Next, you'll need to start the application. You can do this from the command line or via VSCode.

* **Command Line**:
  ```shell
  cd ~/coinstac/packages/coinstac-ui && npm run start
  ```
* **VSCode**:
Open the COINSTAC repo in VSCode and click on the debugging icon, which is the fourth icon down on the left-hand side of the screen. At the top of the left-hand side panel should be a *DEBUG* dropdown. Select `Debug` in the dropdown and hit the play button to begin debugging.

**Test data for collections mapping can be found in `coinstac/algorithm-development/test-data/`**

## Steps to Setup Pipeline

A YouTube video showing the basic steps for creating a Consortia, adding Collection files, and running a Pipeline.

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/QL95M74usAA/0.jpg)](https://www.youtube.com/watch?v=QL95M74usAA)
