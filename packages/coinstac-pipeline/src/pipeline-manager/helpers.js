
const fs = require('fs');
const path = require('path');
const tar = require('tar-fs');
const zlib = require('zlib');
const merge2 = require('merge2');
const {
    readdir,
  } = fs.promises;

const splitFilesFromStream = (stream, filePath, chunkSize) => {
    let currentChunk = 0;
    let currentChunkLen = 0;
    const asyncStreams = [];
    const splits = [];
    const newFileStream = fs.createWriteStream(
      `${filePath}.${currentChunk}`
    );
    splits[currentChunk] = {
      filePath: `${filePath}.${currentChunk}`,
      stream: newFileStream,
    };
    asyncStreams.push(new Promise((resolve, reject) => {
      splits[currentChunk].stream.on('close', () => resolve());
      splits[currentChunk].stream.on('error', e => reject(e));
    }));
    stream.on('data', (data) => {
      if (currentChunkLen >= chunkSize) {
        splits[currentChunk].stream.end();
        currentChunk += 1;
        const newFileStream = fs.createWriteStream(
          `${filePath}.${currentChunk}`
        );
        splits[currentChunk] = {
          filePath: `${filePath}.${currentChunk}`,
          stream: newFileStream,
        };
        asyncStreams.push(new Promise((resolve, reject) => {
          splits[currentChunk].stream.on('close', () => resolve());
          splits[currentChunk].stream.on('error', e => reject(e));
        }));
        splits[currentChunk].stream.write(data);
        currentChunkLen = data.length;
      } else {
        splits[currentChunk].stream.write(data);
        currentChunkLen += data.length;
      }
    });
    asyncStreams.push(new Promise((resolve, reject) => {
      stream.on('end', () => {
        splits[currentChunk].stream.end();
        resolve();
      });
      stream.on('error', (e) => {
        reject(e);
      });
    }));
    return Promise.all(asyncStreams)
      .then(() => splits.map(split => path.basename(split.filePath)));
  };
  
  const extractTar = (parts, outdir) => {
    return new Promise((resolve, reject) => {
      const unpack = merge2(...parts.map(part => fs.createReadStream(part)))
        .pipe(zlib.createGunzip())
        .pipe(tar.extract(outdir));
      unpack.on('finish', () => resolve());
      unpack.on('error', e => reject(e));
    });
  };
  
  /**
   * get files in a dir recursively
   * https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
   * @param  {string}  dir dir path
   * @return {Promise}     files
   */
  const getFilesAndDirs = async (dir) => {
    const dirents = await readdir(dir, { withFileTypes: true });
    return dirents.reduce((memo, dirent) => {
      if (dirent.isDirectory()) {
        memo.directories.push(dirent.name);
      } else {
        memo.files.push(dirent.name);
      }
      return memo;
    }, { files: [], directories: [] });
  };

  module.exports = {splitFilesFromStream, extractTar, getFilesAndDirs}