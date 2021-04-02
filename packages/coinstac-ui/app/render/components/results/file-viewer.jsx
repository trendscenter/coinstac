import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import {
  get, isArray, setWith, take, values,
} from 'lodash';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';

const buildTree = (nodes) => {
  const res = {};

  nodes.forEach((node) => {
    const segments = node.split('/');

    for (let segIndex = 0; segIndex < segments.length; segIndex += 1) {
      const parents = take(segments, segIndex);

      const currentSegment = segments[segIndex];

      if (segIndex === 0) {
        if (!res[currentSegment]) {
          res[currentSegment] = {
            id: currentSegment,
            name: currentSegment,
            children: {},
          };
        }
      } else {
        const path = `${parents.join('.children.')}.children`;
        const currentPath = [...path.split('.'), currentSegment];

        if (!get(res, currentPath)) {
          setWith(res, currentPath, {
            id: currentSegment,
            name: currentSegment,
            children: {},
          }, Object);
        }
      }
    }
  });

  const output = values(res);

  return isArray(output) && output.length > 0 ? output[0] : null;
};

const useStyles = makeStyles(theme => ({
  fileView: {
    height: `calc(100vh - ${150 + theme.spacing(2)}px)`,
    overflowY: 'auto',
    border: '1px solid whitesmoke',
    marginTop: theme.spacing(2),
    padding: theme.spacing(1),
  },
  root: {
    height: '100%',
    flexGrow: 1,
  },
  content: {
    color: theme.palette.text.secondary,
    borderTopRightRadius: theme.spacing(2),
    borderBottomRightRadius: theme.spacing(2),
    paddingRight: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
  },
  labelRoot: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 0),
  },
  labelIcon: {
    marginRight: theme.spacing(1),
  },
  labelText: {
    fontWeight: 'inherit',
    flexGrow: 1,
  },
}));

const FileViewer = ({ auth, consortia, runs }) => {
  const [fileTree, setFileTree] = useState(null);

  const initialFileTree = useMemo(() => {
    return consortia.map((consortium) => {
      const consortiumRuns = runs.filter(
        run => run.consortiumId === consortium.id
      ).map(run => ({ id: run.id, pipelineName: run.pipelineSnapshot.name }));

      return {
        id: consortium.id,
        name: consortium.name,
        runs: consortiumRuns,
      };
    });
  }, [consortia, runs]);

  useEffect(() => {
    if (auth && initialFileTree.length > 0) {
      ipcRenderer.send('prepare-consortia-files', {
        userId: auth.user.id,
        fileTree: initialFileTree,
        appDirectory: auth.appDirectory,
      });
    }
  }, [auth, initialFileTree]);

  useEffect(() => {
    ipcRenderer.on('prepare-consortia-files', (event, nodes) => {
      setFileTree(buildTree(nodes));
    });
  }, []);

  const classes = useStyles();

  const renderTree = (nodes) => {
    const children = nodes.children ? values(nodes.children) : [];

    return (
      <TreeItem
        key={nodes.id}
        nodeId={nodes.id}
        label={(
          <div className={classes.labelRoot}>
            {children.length > 0
              ? <FolderOutlinedIcon color="inherit" className={classes.labelIcon} />
              : <InsertDriveFileIcon color="inherit" className={classes.labelIcon} />
            }
            <Typography variant="body2" className={classes.labelText}>
              {nodes.name}
            </Typography>
          </div>
        )}
        classes={{
          content: classes.content,
        }}
      >
        {children.length > 0 && children.map(node => renderTree(node))}
      </TreeItem>
    );
  };

  if (!fileTree) {
    return null;
  }

  return (
    <div className={classes.fileView}>
      <TreeView
        className={classes.root}
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
      >
        {renderTree(fileTree)}
      </TreeView>
    </div>
  );
};

FileViewer.propTypes = {
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  runs: PropTypes.array.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps)(FileViewer);
