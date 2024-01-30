import React, { useState } from 'react';
import PropTypes from 'prop-types';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Box from '@material-ui/core/Box';
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
import { ipcRenderer } from 'electron';

const useStyles = makeStyles(theme => ({
  selectFileButton: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  fileListContainer: {
    marginTop: theme.spacing(1),
  },
}));

function openFileDialog(multiple, directory, extensions, filterName) {
  const filters = [];
  const properties = [];

  if (directory) {
    properties.push('openDirectory');
  } else {
    properties.push('openFile');
    filters.push({ name: filterName, extensions });
  }

  if (multiple) {
    properties.push('multiSelections');
  }

  return ipcRenderer.invoke('open-dialog', { filters, properties });
}

function FilePicker({
  multiple, directory, extensions, filterName, selected, onChange,
  deleteItem, tooltip,
}) {
  const classes = useStyles();

  const [expandList, setExpandList] = useState(false);

  return (
    <div>
      <Box display="flex" alignItems="center">
        <Button
          variant="contained"
          color="secondary"
          className={classes.selectFileButton}
          onClick={async () => {
            const selected = await openFileDialog(multiple, directory, extensions, filterName);

            if (selected) {
              onChange(selected);
            }
          }}
        >
          {directory ? 'Select Directory(s)' : 'Select File(s)'}
        </Button>
        {tooltip && (
          <Tooltip
            title={
              <Typography variant="body1">{tooltip}</Typography>
            }
          >
            <InfoIcon />
          </Tooltip>
        )}
      </Box>
      {selected && selected.length > 0 && (
        <Paper variant="outlined" className={classes.fileListContainer}>
          <List disablePadding>
            <ListItem button onClick={() => setExpandList(!expandList)}>
              <ListItemIcon>
                <FileCopyIcon />
              </ListItemIcon>
              <ListItemText primary={`Click to see selected ${directory ? 'directories' : 'files'}`} />
              {expandList ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
          </List>
          <Collapse in={expandList} timeout="auto">
            <List disablePadding>
              {selected.map((file, index) => (
                <ListItem key={file} button>
                  <ListItemText>
                    <Typography
                      component="span"
                      variant="body2"
                      color="textPrimary"
                    >
                      {file}
                    </Typography>
                  </ListItemText>
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => deleteItem(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Paper>
      )}
    </div>
  );
}

FilePicker.defaultProps = {
  multiple: false,
  directory: false,
  tooltip: null,
  extensions: [],
  selected: [],
  deleteItem: null,
};

FilePicker.propTypes = {
  multiple: PropTypes.bool,
  directory: PropTypes.bool,
  extensions: PropTypes.array,
  filterName: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  tooltip: PropTypes.string,
  selected: PropTypes.array,
  deleteItem: PropTypes.func,
};

export default FilePicker;
