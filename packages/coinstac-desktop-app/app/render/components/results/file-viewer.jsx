/*
  eslint-disable jsx-a11y/click-events-have-key-events,
  jsx-a11y/no-static-element-interactions, react/prop-types
*/
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized-auto-sizer';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import VariableSizeTree from './variable-size-tree';

const nodeStyle = {
  display: 'flex',
  cursor: 'pointer',
};

const Node = ({
  data: { isLeaf, name, nestingLevel }, isOpen, style, setOpen,
}) => (
  <div
    style={{
      ...style,
      alignItems: 'center',
      display: 'flex',
      marginLeft: nestingLevel * 10 + (isLeaf ? 48 : 0),
    }}
  >
    {!isLeaf && (
      <div style={nodeStyle} onClick={() => setOpen(!isOpen)}>
        {isOpen ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
        <FolderOutlinedIcon />
        <Typography style={{ marginLeft: 10 }}>{name}</Typography>
      </div>
    )}
    {isLeaf && (
      <div style={nodeStyle}>
        <InsertDriveFileIcon />
        <Typography style={{ marginLeft: 10 }}>{name}</Typography>
      </div>
    )}
  </div>
);

const useStyles = makeStyles(theme => ({
  fileView: {
    height: `calc(100vh - ${150 + theme.spacing(2)}px)`,
    overflowY: 'auto',
    border: '1px solid whitesmoke',
    color: theme.palette.grey[600],
    marginTop: theme.spacing(2),
    padding: theme.spacing(1),
  },
}));

const FileViewer = ({ fileTree }) => {
  const classes = useStyles();

  if (!fileTree || !Array.isArray(fileTree.children) || fileTree.children.length === 0) {
    return null;
  }

  const getNodeData = (node, nestingLevel) => ({
    data: {
      defaultHeight: 35,
      id: node.id,
      isLeaf: node.children.length === 0,
      isOpenByDefault: false,
      name: node.name,
      nestingLevel,
    },
    nestingLevel,
    node,
  });

  function* treeWalker() {
    for (let i = 0; i < fileTree.children.length; i += 1) {
      yield getNodeData(fileTree.children[i], 0);
    }

    while (true) {
      const parentMeta = yield;

      for (let i = 0; i < parentMeta.node.children.length; i += 1) {
        yield getNodeData(
          parentMeta.node.children[i],
          parentMeta.nestingLevel + 1
        );
      }
    }
  }

  return (
    <div className={classes.fileView}>
      <AutoSizer disableWidth>
        {({ height }) => (
          <VariableSizeTree treeWalker={treeWalker} height={height}>
            {Node}
          </VariableSizeTree>
        )}
      </AutoSizer>
    </div>
  );
};

FileViewer.propTypes = {
  fileTree: PropTypes.object,
};

FileViewer.defaultProps = {
  fileTree: null,
};

const mapStateToProps = ({ app }) => ({
  fileTree: app.fileTree,
});

export default connect(mapStateToProps)(FileViewer);
