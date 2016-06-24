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

Open a shell and navigate (using `cd`) to the directory where you want to install COINSTAC. Then, use git to download the repository:

```shell
git clone -b demo https://github.com/MRN-Code/coinstac.git
```

This will place COINSTAC into a new folder named “coinstac” and check out the “demo” branch.

## Installing Dependencies

Move into the _coinstac_ directory (`cd coinstac`) and run the following commands:

```shell
npm install
npm run bootstrap
```

## Updating Source Code

1. `git pull` to get the latest source code
2. `npm run bootstrap` from the root _coinstac_ directory to install dependencies and link packages

## Running the UI

The user interface is an [Electron application](http://electron.atom.io/). To run it:

1. Make sure you’re in the _coinstac/packages/coinstac-ui/_ directory.
2. Run `npm start` to start the UI

## Troubleshooting

* Ensure machines have at least 2 GB of memory. If you don’t have that much memory, run `npm install` in each directory in _coinstac/packages/_.
* If `npm run bootstrap` fails repeatedly, there’s likely a problem with [lerna’s](https://lernajs.io/) persisted state. Remove the _node_modules_ directory from each of the _coinstac/packages/<package name>_ directories.
