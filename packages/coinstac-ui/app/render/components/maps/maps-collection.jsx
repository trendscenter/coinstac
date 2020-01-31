import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router';
import Icon from '@material-ui/core/Icon';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import DeleteIcon from '@material-ui/icons/Delete';
import ipcPromise from 'ipc-promise';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import bitap from 'bitap';
import classNames from 'classnames';
import memoize from 'memoize-one';

const styles = theme => ({
  addFileGroupButton: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  removeFileGroupButton: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
    height: '100%',
  },
  fileErrorPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    backgroundColor: '#fef7e4',
    textAlign: 'center',
  },
  fileErrorMessage: {
    color: '#ab8e6b',
  },
  fileList: {
    backgroundColor: '#efefef',
    padding: '1rem',
    borderRadius: '0.25rem',
    overflowY: 'hidden'
  },
  fileListItem: {
    whiteSpace: 'nowrap',
    fontSize: '0.75rem',
    margin: '0.25rem'
  },
  actionsContainer: {
    marginTop: theme.spacing.unit * 2,
  },
  timesIcon: {
    color: '#f05a29 !important',
    fontSize: '1.25rem',
    position: 'absolute',
    top: '-0.75rem',
    right: '-0.75rem',
    background: 'white',
    borderRadius: '50%',
    border: '2px solid white',
    width: '1.5rem',
    height: '1.5rem',
  },
});

class MapsCollection extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filesError: null,
    };

    this.addFolderGroup = this.addFolderGroup.bind(this);
  }

  componentDidUpdate(prevProps) {
    const { registerDraggableContainer, dataFileHeader } = this.props;

    if (this.refs.Container && !prevProps.dataFileHeader && dataFileHeader) {
      const Container = ReactDOM.findDOMNode(this.refs.Container);

      registerDraggableContainer(Container);
    }
  }

  getRemainingDataVariables = memoize(
    (dataFileHeader, stepsDataMappings) => {
      if (!dataFileHeader) {
        return null;
      }

      const firstStepDataMappings = stepsDataMappings[0];

      const remainingVariables = [
        ...dataFileHeader,
      ];

      if (!firstStepDataMappings) {
        return remainingVariables;
      }

      Object.keys(firstStepDataMappings).forEach((key) => {
        firstStepDataMappings[key].forEach((mapping) => {
          const variableName = mapping.dataFileFieldName;

          const index = remainingVariables.findIndex(v => v === variableName);

          if (index > -1) {
            remainingVariables.splice(index, 1);
          }
        });
      });

      return remainingVariables;
    }
  );

  findMatchInPipelineVariables = (pipelineVariables, columnToMatch, pipelineFieldsetName) => {
    const matches = pipelineVariables.filter((variable) => {
      let search = variable.name ? variable.name : variable.type;

      if (!search) {
        return false;
      }

      search = search.toLowerCase();
      columnToMatch = columnToMatch.toLowerCase();

      let match = false;

      // Match data column and map to ID
      if (pipelineFieldsetName === 'data' && columnToMatch === 'id') {
        match = true;
      }

      // Match if string and search are equal
      if (!match && columnToMatch === search) {
        match = true;
      }

      // Match if string contains search and vice versa
      if (!match) {
        if (columnToMatch.length < search.length) {
          const sch = search.replace(/[_-\s]/g, ' ');
          if (sch.includes(columnToMatch)) {
            match = true;
          }
        } else {
          const str = columnToMatch.replace(/[_-\s]/gi, ' ');
          if (str.includes(search)) {
            match = true;
          }
        }
      }

      // Finally Fuzzy match string to search based on which is larger
      if (!match) {
        let fuzzy = [];
        const str = columnToMatch.replace(/[_-\s]/gi, '');
        const sch = search.replace(/[_-\s]/gi, '');
        if (str.length > sch.length) {
          fuzzy = bitap(str, sch, 1);
        } else {
          fuzzy = bitap(sch, str, 1);
        }

        if (fuzzy.length > 1 && fuzzy[0] > 3) {
          match = true;
        }
      }

      return match;
    });

    return matches.length > 0 ? matches[0] : null;
  }

  autoMap = () => {
    const { activeConsortium, addToDataMapping, dataFileHeader } = this.props;

    const inputMap = activeConsortium.pipelineSteps[0].inputMap;

    Object.entries(inputMap).forEach((item) => {
      const pipelineFieldsetName = item[0];
      const pipelineVariables = item[1].ownerMappings;

      if (!pipelineVariables) {
        return;
      }

      dataFileHeader.forEach((headerColumn) => {
        const match = this.findMatchInPipelineVariables(
          pipelineVariables,
          headerColumn,
          pipelineFieldsetName
        );

        if (match) {
          addToDataMapping(pipelineFieldsetName, match.name || match.type, headerColumn);
        }
      });
    });
  }

  addFileGroup = () => {
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
        this.setState({ filesError: error.message });
      });
  }

  addFolderGroup() {
    ipcPromise.send('open-dialog','bundle')
    .then((obj) => {

      let newFiles;

      const fileGroupId = shortid.generate();

      if (obj.error) {
        this.setState({ filesError: obj.error });
      } else {
        const name = `Group ${Object.keys(this.props.collection.fileGroups).length + 1} (${obj.extension.toUpperCase()})`;

        let type = this.props.activeConsortium.pipelineSteps[0].dataMeta.items[0];

        this.props.setRowArray([type]);
        this.props.setMetaRow([type]);

        newFiles = {
          name,
          id: fileGroupId,
          extension: obj.extension,
          files: [...obj.paths],
          date: new Date().getTime(),
          firstRow: type
        };

        this.setState({ showFiles: { [newFiles.date]: false } });
        this.setState({ filesError: null });

        this.props.updateCollection(
          {
            fileGroups: {
              ...this.props.collection.fileGroups,
              [fileGroupId]: newFiles,
            },
          },
          this.props.saveCollection
        );
      }
    })
    .catch(console.log);
  }

  render() {
    const {
      classes,
      dataType,
      isMapped,
      saveCollection,
      stepsTotal,
      stepsMapped,
      resetDataMapping,
      stepsDataMappings,
      removeColumnFromDataFileHeader,
      removeExtraColumnsFromDataFileHeader,
      dataFile,
      dataFileHeader,
      saveDataMapping,
    } = this.props;

    const { filesError } = this.state;

    const remainingDataVariables = this.getRemainingDataVariables(
      dataFileHeader, stepsDataMappings
    );

    const hasAnyDataMapped = remainingDataVariables
      && remainingDataVariables.length < dataFileHeader.length;

    return (
      <div>
        {
          !isMapped
          && dataType === 'array'
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
          !isMapped
          && dataType === 'bundle'
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
          filesError && (
            <Paper className={classes.fileErrorPaper}>
              <Typography variant="h6" className={classes.fileErrorMessage}>File Error</Typography>
              <Typography className={classes.fileErrorMessage} variant="body1">
                {filesError}
              </Typography>
            </Paper>
          )
        }
        {
          dataFile && (
            <Paper className={classes.rootPaper}>
              <div>
                {
                  !isMapped
                  && (
                    <Button
                      variant="contained"
                      color="secondary"
                      className={classes.removeFileGroupButton}
                      onClick={this.removeSelectedFile}
                    >
                      <DeleteIcon />
                      Remove selected file
                    </Button>
                  )
                }
                <Typography>
                  <span className="bold">Extension:</span> {dataFile.extension}
                </Typography>
                <Typography>
                  <span className="bold">Items Mapped:</span> {stepsMapped} of {stepsTotal}
                </Typography>
                <Typography>
                  <span className="bold">Original MetaFile Header:</span> {dataFile.metaFile[0].join(', ')}
                </Typography>
                <Typography>
                  <span className="bold">Mapped MetaFile Header:</span> {dataFileHeader.join(', ')}
                </Typography>
                {
                  /*group.org === 'metafile'
                  && (
                    <div>
                      <Typography>
                        <span className="bold">Meta File Path:</span> {group.metaFilePath}
                      </Typography>
                    </div>
                    )*/
                }
                <div>
                  {
                    remainingDataVariables && (
                      <div className="card-deck" ref="Container">
                        {
                          remainingDataVariables.map(columnName => (
                            <div
                              className={`card-draggable card-${columnName.toLowerCase()}`}
                              data-string={columnName}
                              key={columnName}
                            >
                              <FileCopyIcon />
                              { columnName }
                              { dataType !== 'array' ? `Bundle (${dataFile.files.length} files)` : '' }
                              <span onClick={() => removeColumnFromDataFileHeader(columnName)}>
                                <Icon className={classNames('fa fa-times-circle', classes.timesIcon)} />
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    )
                  }
                </div>
                <Divider />
                <div className={classes.actionsContainer}>
                  {
                    !isMapped && stepsTotal !== stepsMapped
                    && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={this.autoMap}
                      >
                        Auto Map
                      </Button>
                    )
                  }
                  {
                    !isMapped && stepsTotal === stepsMapped
                    && remainingDataVariables && remainingDataVariables.length > 0
                    && (
                      <Button
                        variant="contained"
                        style={{
                          backgroundColor: '#5cb85c',
                          color: '#fff',
                        }}
                        onClick={removeExtraColumnsFromDataFileHeader}
                      >
                        Remove Extra Items
                      </Button>
                    )
                  }
                  {
                    !isMapped && stepsTotal === stepsMapped
                    && (
                      <Button
                        variant="contained"
                        style={{
                          backgroundColor: '#5cb85c',
                          color: '#fff',
                        }}
                        onClick={saveDataMapping}
                      >
                        Save
                      </Button>
                    )
                  }
                  {
                    !isMapped && hasAnyDataMapped && (
                      <Button
                        style={{ marginLeft: '1rem' }}
                        variant="contained"
                        color="secondary"
                        onClick={resetDataMapping}
                      >
                        Reset
                      </Button>
                    )
                  }
                  {
                    isMapped
                    && (
                      <div>
                        <div className="alert alert-success" role="alert">
                          Mapping Complete!
                        </div>
                        <br />
                        <Button
                          variant="contained"
                          color="primary"
                          to="/dashboard/consortia"
                          component={Link}
                        >
                          Back to Consortia
                        </Button>
                      </div>
                    )
                  }
                </div>
              </div>
            </Paper>
          )
        }
      </div>
    );
  }
}

MapsCollection.propTypes = {
  collection: PropTypes.object,
  saveDataMapping: PropTypes.func.isRequired,
  resetDataMapping: PropTypes.func.isRequired,
  registerDraggableContainer: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

MapsCollection.defaultProps = {
  collection: null,
};

export default withStyles(styles)(MapsCollection);
