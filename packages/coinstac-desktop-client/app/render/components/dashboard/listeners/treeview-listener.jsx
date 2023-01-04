import { useEffect } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { setConsortiaFileTree } from '../../../state/ducks/app';
import { buildTree, generateInitalFileTree } from '../../../utils/helpers';

function TreeviewListener({
  userId, appDirectory, runs, consortia, setConsortiaFileTree,
}) {
  const getFileTree = () => {
    ipcRenderer.send('prepare-consortia-files', {
      userId,
      appDirectory,
      fileTree: generateInitalFileTree(consortia, runs),
    });
  };

  useEffect(() => {
    getFileTree();

    ipcRenderer.on('prepare-consortia-files', (event, nodes) => {
      setConsortiaFileTree(buildTree(nodes));
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

export default connect(null, {
  setConsortiaFileTree,
})(TreeviewListener);
