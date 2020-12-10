import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Collapse from '@material-ui/core/Collapse';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import InfoIcon from '@material-ui/icons/Info';

const styles = theme => ({
  selectFileButton: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  buttonContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  fileListContainer: {
    marginTop: theme.spacing(1),
  },
});

async function openFileDialog(multiple, directory, extensions, filterName) {
  const filters = [
    { name: filterName, extensions },
  ];

  const properties = [];

  if (directory) {
    properties.push('openDirectory');
  } else {
    properties.push('openFile');
  }

  if (multiple) {
    properties.push('multiSelections');
  }

  const result = await remote.dialog.showOpenDialog({
    filters,
    properties,
  });

  return result.canceled ? null : result.filePaths;
}

function FilePicker({
  multiple, directory, extensions, filterName, selectedFiles, onChange,
  deleteFile, tooltip, classes,
}) {
  const [expandList, setExpandList] = useState(false);

  return (
    <div>
      <div className={classes.buttonContainer}>
        <Button
          variant="contained"
          color="secondary"
          className={classes.selectFileButton}
          onClick={async () => {
            const selectedFiles = await openFileDialog(multiple, directory, extensions, filterName);

            if (selectedFiles) {
              onChange(selectedFiles);
            }
          }}
        >
          { directory ? 'Select Directory(s)' : 'Select File(s)' }
        </Button>
        {
          tooltip && (
            <Tooltip
              title={
                <Typography variant="body1">{ tooltip }</Typography>
              }
            >
              <InfoIcon />
            </Tooltip>
          )
        }
      </div>
      {
        selectedFiles && selectedFiles.length > 0 && (
          <Paper variant="outlined" className={classes.fileListContainer}>
            <List disablePadding>
              <ListItem button onClick={() => setExpandList(!expandList)}>
                <ListItemIcon>
                  <FileCopyIcon />
                </ListItemIcon>
                <ListItemText primary="Click to see selected files" />
                { expandList ? <ExpandLessIcon /> : <ExpandMoreIcon /> }
              </ListItem>
            </List>
            <Collapse in={expandList} timeout="auto">
              <List disablePadding>
                {
                  selectedFiles.map((file, index) => (
                    <ListItem key={file} button>
                      <ListItemText>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                        >
                          { file }
                        </Typography>
                      </ListItemText>
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => deleteFile(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                }
              </List>
            </Collapse>
          </Paper>
        )
      }
    </div>
  );
}

FilePicker.defaultProps = {
  multiple: false,
  directory: false,
  tooltip: null,
  selectedFiles: [],
};

FilePicker.propTypes = {
  multiple: PropTypes.bool,
  directory: PropTypes.bool,
  extensions: PropTypes.array.isRequired,
  filterName: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  tooltip: PropTypes.string,
  selectedFiles: PropTypes.array,
  classes: PropTypes.object.isRequired,
  deleteFile: PropTypes.func.isRequired,
};

export default withStyles(styles)(FilePicker);
