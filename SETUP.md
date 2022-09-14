# Setup

These instructions explain how to get COINSTAC up and running on your machine for development or to run your own COINSTAC system:

## Install required software
1. **NodeJS** COINSTAC only supports the latest LTS version of Node, if you require multiple versions of Node for other projects, a version manager is strongly recommended
* See detailed instructions here: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
2. **Lerna,** a manager for the packages in the COINSTAC repository.
  * With npm installed, run `npm install --global lerna`

3. **An MQTT client** MQTT client will work listening on localhost and the standard mqtt port (1883). We prefer [mosquitto](https://mosquitto.org/). Mosquitto is available on `brew` and `apt`.

4. **Docker** To run computations you'll need [Docker](https://docs.docker.com/get-docker/). Docker memory requirements differ per computation, but 4gb is recommended as a minimum and 12gb will allow most any computation to run.
5. **Git** https://git-scm.com/download

### Configuring NPM on Windows
If you are developing on a Windows operating system you will need to configure NPM to use `Git-Bash` to execute npm scripts.
You can do this with the following command:
`npm config set script-shell "C:\\Program Files\\Git\\git-bash.exe"` (or another path if your install location differs)


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

## Setting environment variables
1. Find or create the `.*rc` file on your system
   * Mac uses zshell and the respective file is `.zshrc`.
   * Windows Git Bash uses `.bashrc`.
   * The directory of files can usually be found by running `echo ~` in your respective shell.
2. Copy the contents of `config/.env-example.sh` into your `.*rc` file.
3. relaunch your terminal/shell.
4. `echo $env` to see if the environment variables are set.

## Setting configuration files
* Create a new file at `coinstac/packages/coinstac-ui/config/local.json` and copy into it the contents of `coinstac/packages/coinstac-ui/config/local-example.json`
* Create a new file at `/coinstac-server/config/local.json` and copy into it the contents of `/coinstac-server/config/default.json`

## Priming the database
In the top level `coinstac` directory run `npm run devdata` to start and prime the database

## Running the UI

The user interface is an [Electron application](http://electron.atom.io/). To run it:

1. Make sure your mqtt service (mosquitto or otherwise) is running, a daemon is fine
2. In the top level directory run `npm run start` to run webpack, and the api services
3. Either in a new cli window or tmux/screen/etc session make go to the _coinstac/packages/coinstac-ui/_ directory.
4. Run `npm start` to start the UI

**Test data for collections mapping can be found in `coinstac/algorithm-development/test-data/`**

## Steps to Setup Pipeline

A YouTube video showing the basic steps for creating a Consortia, adding Collection files, and running a Pipeline.

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/QL95M74usAA/0.jpg)](https://www.youtube.com/watch?v=QL95M74usAA)
