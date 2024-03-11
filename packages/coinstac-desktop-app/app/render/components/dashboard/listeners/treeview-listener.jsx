import { ipcRenderer } from 'electron';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setConsortiaFileTree } from '../../../state/ducks/app';
import { buildTree, generateInitalFileTree } from '../../../utils/helpers';

function TreeviewListener({
  userId, appDirectory, runs, consortia,
}) {
  const dispatch = useDispatch();

  const getFileTree = () => {
    ipcRenderer.send('prepare-consortia-files', {
      userId,
      appDirectory,
      fileTree: generateInitalFileTree(consortia, runs),
    });
  };

  useEffect(() => {
    getFileTree();

    ipcRenderer.on('prepare-consortia-files', (_, nodes) => {
      dispatch(setConsortiaFileTree(buildTree(nodes)));
    });

    return () => {
      ipcRenderer.removeAllListeners('prepare-consortia-files');
    };
  }, []);

  useEffect(() => {
    getFileTree();
  }, [consortia, runs]);

  return null;
}

TreeviewListener.defaultProps = {
  userId: '',
  appDirectory: '',
  runs: [],
  consortia: [],
};

export default TreeviewListener;
