# Setup

These instructions explain how to get COINSTAC up and running on your machine:

## Required Software

You’ll need some software installed:

1. **Build tools,** namely g++/gcc.
  * OS X: The easiest way to install Xcode through Apple’s App Store. (You can try [installing the command line tools](https://www.maketecheasier.com/install-command-line-tools-without-xcode/))
  * Linux: `apt-get install build-essential` for Ubuntu-flavored versions. Check your distro for details.
2. **Install git.** See https://git-scm.com/download. You may also try [GitHub’s desktop client](https://desktop.github.com/): see [their post for CLI instructions](https://github.com/blog/1510-installing-git-from-github-for-mac).
3. **Install Node.js**, specifically version 6.1.0. You can enter `node -v` to find out which version you have.
  * Consider [using n](https://www.npmjs.com/package/n) for easy Node.js version management if you already have a version of Node.js installed.
  * Linux: See the [official installation instructions](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
  * OS X: Download https://nodejs.org/dist/v6.1.0/node-v6.1.0.pkg and run the installer

## Downloading Source Code

Open a shell and navigate (using `cd`) to the directory where you want to install COINSTAC. This can be anywhere, but if you're following the development instructions below, having it in your HOME directory is recommended. Then, use git to download the repository:

```shell
git clone https://github.com/MRN-Code/coinstac.git
```

This will place COINSTAC into a new folder named “coinstac” and check out the “demo” branch.

## Installing Dependencies

Move into the _coinstac_ directory (`cd coinstac`) and run the following commands:

```shell
npm install
npm run build
```

## Updating Source Code

1. `git pull` to get the latest source code
2. `npm run build` from the root _coinstac_ directory to install dependencies and link packages

## Running the UI

The user interface is an [Electron application](http://electron.atom.io/). To run it:

1. Make sure you’re in the _coinstac/packages/coinstac-ui/_ directory.
2. Run `npm start` to start the UI

## Troubleshooting

* Ensure machines have at least 2 GB of memory. If you don’t have that much memory, run `npm install` in each directory in _coinstac/packages/_.
* If `npm run build` fails repeatedly, there’s likely a problem with [lerna’s](https://lernajs.io/) persisted state. Remove the _node_modules_ directory from each of the _coinstac/packages/<package name>_ directories.
* If you notice repeated `TypeError`s related to COINSTAC internal methods, the COINSTAC internals maybe be unlinked. Run `npm run build` to re-link them.

# Development Setup

Follow the general steps above before continuing.

## Additional Required Software

1. **CouchDB** On OSX, using [Homebrew](https://brew.sh/) will likely be the easiest way to install [CouchDB](http://couchdb.apache.org/) in a manner compatible with setup scripts: `brew install couchdb`. Installing from the binary is another viable option, just be sure to add it to your path.
2. **RethinkDB** On OSX, using [Homebrew](https://brew.sh/), use: `brew update && brew install rethinkdb`. Other options [here](https://rethinkdb.com/docs/install/).
3. **VSCode** There are no shortage of options when it comes to an editor, but [VSCode](https://code.visualstudio.com/) offers some great [debugging functionality](https://code.visualstudio.com/Docs/editor/debugging). You'll need to create a `launch.json` file as outlined [here](https://code.visualstudio.com/Docs/editor/debugging#_launch-configurations), with the following contents:

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

4. **tmux & Tmuxinator** To ease the process of initializing the development environment, we use [tmux](https://github.com/tmux/tmux) and [Tmuxinator](https://github.com/tmuxinator/tmuxinator) to automate things like starting CouchDB, creating a test user, creating a database, starting the webpack server and more. tmux can be installed via Homebrew `brew install tmux`. Tmuxinator can be installed via `gem install tmuxinator`. You'll also need to setup a couple environment variables for Tmuxinator, which you can find in their README linked above.

   // TODO: Bring this into VSCode?

## Additional Source Code

1. **mock-steelpenny** To mock the steelpenny authentication for COINSTAC development, you can clone the [mock-steelpenny](https://github.com/swashcap/mock-steelpenny) repo: `git clone https://github.com/swashcap/mock-steelpenny.git`. Just like the COINSTAC repo, the Tmuxinator script is going to assume you have this cloned in your HOME directory: `cd ~`.

   Once cloned, enter the directory and install its dependencies: `cd mock-steelpenny`, `npm install`.

2. **COINS** Next, create a directory in your root directory called **coins**. Alternatively, clone the [COINS](https://github.com/MRN-Code/coins) repo there. Once you have the directory, create a subdirectory called **config**. Lastly create a file at `/coins/config/dbmap.json` and copy into it the following:

   ```json
   {
     "coinstac": {
       "user": "coinstac",
       "password": "test"
     },
     
   }
   ```

## Configuration

Create a new file at `coinstac/packages/coinstac-ui/config/local.json` and copy into it the following:

   ```json
   {
      "api": {
        "hostname": "localhost",
        "pathname": "/api/v1.3.0",
        "port": 8800,
        "protocol": "http:"
      },
      "db": {
        "remote": {
          "db": {
            "hostname": "localhost",
            "pathname": "",
            "port": 5984,
            "protocol": "http:"
          }
        }
      }
   }
   ```

## Tmuxinator Script

Copy the following into a file at `~/.tmuxinator/coinstac.yml`:

```yml
# ~/.tmuxinator/coinstac.yml

name: coinstac
root: ~/coinstac/

# Optional tmux socket
# socket_name: foo

# Runs before everything. Use it to start daemons etc.
pre:
  # Init RethinkDB
  - rethinkdb --daemon
  - cd ~/coinstac/packages/coinstac-graphql
  - npm run test-setup

  - couchdb -b

  # Add CouchDB security
  - sleep 2 && curl -X PUT localhost:5984/_config/admins/coinstac -d '"test"'

  # Init database
  - cd ~/coinstac/packages/coinstac-server-core
  - npm run clean:db
  - bin/coinstac-server-core --nohang
  - cd ~/coinstac/packages/coinstac-ui
  - npm run clean:db
  - cd ~/coinstac/

# Specifies (by name or index) which window will be selected on project startup. If not set, the first window is used.
startup_window: editor

# Controls whether the tmux session should be attached to automatically. Defaults to true.
# attach: false

# Runs after everything. Use it to attach to tmux with custom options etc.
post:
  - curl -X DELETE localhost:5984/_config/admins/coinstac --user coinstac:test
  - couchdb -d
  - pkill -9 "rethinkdb"

windows:
  - dbapi:
      root: ~/coinstac/packages/coinstac-graphql
      panes:
        - npm run start
  - steelpenny:
      root: ~/mock-steelpenny
      panes:
        - npm start
  - server:
      root: ~/coinstac/packages/coinstac-server-core
      panes:
        - bin/coinstac-server-core --loglevel verbose
  - webpack:
      root: ~/coinstac/packages/coinstac-ui
      panes:
        - npm run watch
```

## Run Development Environment

The last step is to start your development environment: `tmuxinator start coinstac`.

Next, open the COINSTAC repo in VSCode and click on the debugging icon, which is the fourth icon down on the left-hand side of the screen. At the top of the left-hand side panel should be a *DEBUG* dropdown. Select `Debug` in the dropdown and hit the play button to begin debugging.

**Test data will also be required to create and run computations**
