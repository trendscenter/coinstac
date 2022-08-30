# Setup

These instructions explain how to get COINSTAC up and running on your machine for development or to run your own COINSTAC system:

## Required Software

You’ll need some software installed:

1. **Build tools,** namely g++/gcc.
  * OS X: The easiest way to install Xcode through Apple’s App Store. (You can try [installing the command line tools](https://www.maketecheasier.com/install-command-line-tools-without-xcode/))
  * Linux: `apt-get install build-essential` for Ubuntu-flavored versions. Check your distro for details.
  * Windows: requires npm to be installed first (go to step 3) `npm install --global windows-build-tools`
2. **Install git.** See https://git-scm.com/download. You may also try [GitHub’s desktop client](https://desktop.github.com/): see [their post for CLI instructions](https://github.com/blog/1510-installing-git-from-github-for-mac).
3. **Install Node.js**. Coinstac only supports the latest LTS version of Nodejs. You can enter `node -v` to find out which version you have.
   * Consider using a Node.js version manager if you already have a version of Node.js installed.
     * Mac/Linux: [n](https://www.npmjs.com/package/n)
     * Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows)
   * Download the latest LTS build from [nodejs.org](https://nodejs.org/)
   * Windows: configure npm to use Git Bash for executing scripts 
     * `npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`

4. Install a MQTT client, any will work listening on localhost and the standard mqtt port (1883). We prefer [mosquitto](https://mosquitto.org/) but any client should work. Mosquitto is available on `brew` and `apt`.
5. To run computations and have the UI not complain, you'll need [Docker](https://docs.docker.com/get-docker/). Docker memory requirements differ per computation, but 4gb is recommended as a minimum and 12gb will allow most any computation to run.



## Downloading Source Code

Open a shell and navigate to the directory where you want to install COINSTAC. This can be anywhere, but if you're following the development instructions below, having it in your HOME directory is recommended. Then, use git to download the repository:

```shell
git clone https://github.com/trendscenter/coinstac.git
```

This will place COINSTAC into a new folder named “coinstac” and check out the “master” branch.

## Installing Dependencies

From the `coinstac` directory run the following commands:

```shell
#  needed only for initial top level setup
npm install
# runs npm i in the sub packages, and links the packages together via lerna
npm run build
```

This will install all dependencies including all `package.json` contents of each sub package

## Updating Source Code
Any time you pull in new code, you'll need to rebuild the application.
1. `git pull` to get the latest source code
2. `npm run build` from the root _coinstac_ directory to install dependencies and link packages

*If the above leaves you with errors, try first cleaning the repo (`npm run clean` in root directory) and also reinstalling the root directory's dependencies (`npm i`).*

## Running the UI

The user interface is an [Electron application](http://electron.atom.io/). To run it:

1. use `config/.env-example.sh` to set the environment variables.
   *  Windows Git Bash: copy the contents of `config/.env-example.sh` into your `.bashrc` file an relaunch your terminal/shell. The location of `.bashrc` can be found using `echo ~` in your bash terminal. If there is no `.bashrc` file there, create one.  
2. In the top level `coinstac` directory run `npm run devdata` to start and prime the database
3. Make sure your mqtt service (mosquitto or otherwise) is running, a daemon is fine
4. Still in the top level directory run `npm run start` to run webpack, and the api services
5. Either in a new cli window or tmux/screen/etc session make go to the _coinstac/packages/coinstac-ui/_ directory.
6. Run `npm start` to start the UI

**Test data for collections mapping can be found in `coinstac/algorithm-development/test-data/`**

## Steps to Setup Pipeline

A YouTube video showing the basic steps for creating a Consortia, adding Collection files, and running a Pipeline.

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/QL95M74usAA/0.jpg)](https://www.youtube.com/watch?v=QL95M74usAA)

## Troubleshooting

* If `npm run build` fails repeatedly, there’s likely a problem with [lerna’s](https://lernajs.io/) persisted state. Remove the _node_modules_ by running `npm run clean` in the top level directory.
* If you notice repeated `TypeError`s related to COINSTAC internal methods, the COINSTAC internals maybe be unlinked. Run `npm run build` to re-link them.
* If you're trying to test simulator code, the mqtt service must be shut down, as simulator packages its own.

## Configuration

* Create a new file at `coinstac/packages/coinstac-ui/config/local.json` and copy into it the contents of `coinstac/packages/coinstac-ui/config/local-example.json`
* Create a new file at `/coinstac-server/config/local.json` and copy into it the contents of `/coinstac-server/config/default.json`

## Additional Suggested Software

1. **VSCode** There are no shortage of options when it comes to an editor, but [VSCode](https://code.visualstudio.com/) offers some great [debugging functionality](https://code.visualstudio.com/Docs/editor/debugging). The root directory has a `launch.json` as outlined [here](https://code.visualstudio.com/Docs/editor/debugging#_launch-configurations), with the following contents:

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

## Development Environment Breakdown

Five services need to be run in the following order to start COINSTAC in development mode, `npm run start` in root takes care of webpack, api, and pipeline servers:

1. **Docker**
2. **Mongodb**:
  ```shell
  # from coinstac root, will wipe any coinstac mongo instance
  npm run devdata
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
6. **mosquitto**:
  ```shell
  # default config is fine
  mosquitto -c /path/to/your/config
  ```
7. Next, you'll need to start the application. You can do this from the command line or via VSCode.

* **Command Line**:
  ```shell
  cd ~/coinstac/packages/coinstac-ui && npm run start
  ```
* **VSCode**:
Open the COINSTAC repo in VSCode and click on the debugging icon, which is the fourth icon down on the left-hand side of the screen. At the top of the left-hand side panel should be a *DEBUG* dropdown. Select `Debug` in the dropdown and hit the play button to begin debugging.
