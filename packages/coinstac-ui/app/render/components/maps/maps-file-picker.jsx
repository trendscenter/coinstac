import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ipcPromise from 'ipc-promise';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { notifyError } from '../../state/ducks/notifyAndLog';

const styles = theme => ({
  addFileGroupButton: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  fileErrorPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: '#fef7e4',
    textAlign: 'center',
  },
  fileErrorMessage: {
    color: '#ab8e6b',
  },
});

class MapsFilePicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filesError: null,
    };
  }

  addFileGroup = () => {
    const { notifyError } = this.props;

    ipcPromise.send('open-dialog', 'metafile')
      .then((obj) => {
        if (obj.error) {
          this.setState({ filesError: obj.error });
          return;
        }

        const { setSelectedDataFile } = this.props;

        setSelectedDataFile(obj);

        this.setState({ filesError: null });
      }).catch((error) => {
        notifyError(error.message);
        this.setState({ filesError: error.message });
      });
  }

  addFolderGroup = () => {
    ipcPromise.send('open-dialog', 'bundle')
      .then((obj) => {
        if (obj.error) {
          this.setState({ filesError: obj.error });
          return;
        }
        const { setSelectedDataFile } = this.props;

        const dataFile = {
          extension: obj.extension,
          files: obj.paths,
        };

        setSelectedDataFile(dataFile);

        this.setState({ filesError: null });
      })
      .catch((error) => {
        this.setState({ filesError: error.message });
      });
  }

  addSingleGroup = () => {
    ipcPromise.send('open-dialog', 'singles')
      .then((obj) => {
        if (obj.error) {
          this.setState({ filesError: obj.error });
          return;
        }
        const { setSelectedDataFile } = this.props;

        const dataFile = {
          extension: obj.extension,
          files: obj.paths,
        };

        setSelectedDataFile(dataFile);

        this.setState({ filesError: null });
      })
      .catch((error) => {
        this.setState({ filesError: error.message });
      });
  }

  render() {
    const { dataType, classes } = this.props;

    const { filesError } = this.state;

    return (
      <div>
        {
          dataType === 'array'
          && (
            <div>
              <Button
                variant="contained"
                color="primary"
                className={classes.addFileGroupButton}
                onClick={this.addFileGroup}
              >
                Add Files Group
              </Button>
              <Divider />
            </div>
          )
        }
        {
          dataType === 'bundle'
          && (
            <div>
              <Button
                variant="contained"
                color="primary"
                className={classes.addFileGroupButton}
                onClick={this.addFolderGroup}
              >
                Add Files from Folder
              </Button>
              <Divider />
            </div>
          )
        }
        {
          dataType === 'singles'
          && (
            <div>
              <Button
                variant="contained"
                color="primary"
                className={classes.addFileGroupButton}
                onClick={this.addSingleGroup}
              >
                Add Single File(s)
              </Button>
              <Divider />
            </div>
          )
        }
        {
          filesError && (
            <Paper className={classes.fileErrorPaper}>
              <Typography variant="h6" className={classes.fileErrorMessage}>File Error</Typography>
              <Typography className={classes.fileErrorMessage} variant="body2">
                {filesError}
              </Typography>
            </Paper>
          )
        }
      </div>
    );
  }
}

MapsFilePicker.propTypes = {
  classes: PropTypes.object.isRequired,
  dataType: PropTypes.string.isRequired,
  setSelectedDataFile: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
};

const connectedComponent = connect(null,
  {
    notifyError,
  })(MapsFilePicker);

export default withStyles(styles)(connectedComponent);
