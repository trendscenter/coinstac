/* eslint-disable react/no-find-dom-node */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Icon from '@material-ui/core/Icon';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import DeleteIcon from '@material-ui/icons/Delete';
import PropTypes from 'prop-types';
import bitap from 'bitap';
import classNames from 'classnames';
import memoize from 'memoize-one';
import MapsFilePicker from './maps-file-picker';

const styles = theme => ({
  removeFileGroupButton: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    height: '100%',
  },
  fileList: {
    backgroundColor: '#efefef',
    padding: '1rem',
    borderRadius: '0.25rem',
    overflowY: 'hidden',
  },
  fileListItem: {
    whiteSpace: 'nowrap',
    fontSize: '0.75rem',
    margin: '0.25rem',
  },
  actionsContainer: {
    marginTop: theme.spacing(2),
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
  componentDidUpdate(prevProps) {
    const { registerDraggableContainer, dataFileHeader } = this.props;

    if (this.container && !prevProps.dataFileHeader && dataFileHeader) {
      const Container = ReactDOM.findDOMNode(this.container);

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

    const { inputMap } = activeConsortium.pipelineSteps[0];

    Object.entries(inputMap).forEach((item) => {
      if (item[1].fulfilled) {
        return;
      }

      const pipelineFieldsetName = item[0];
      const pipelineVariables = item[1].value;

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

  render() {
    const {
      classes,
      dataType,
      stepsTotal,
      stepsMapped,
      resetDataMapping,
      stepsDataMappings,
      removeColumnFromDataFileHeader,
      removeExtraColumnsFromDataFileHeader,
      dataFile,
      dataFileHeader,
      saveDataMapping,
      setSelectedDataFile,
      removeSelectedFile,
      getFileName,
    } = this.props;

    const remainingDataVariables = this.getRemainingDataVariables(
      dataFileHeader, stepsDataMappings
    );

    const hasAnyDataMapped = remainingDataVariables
      && remainingDataVariables.length < dataFileHeader.length;

    return (
      <div>
        <MapsFilePicker dataType={dataType} setSelectedDataFile={setSelectedDataFile} />
        {
          dataFile && (
            <Paper className={classes.rootPaper}>
              <div>
                <Button
                  variant="contained"
                  color="secondary"
                  className={classes.removeFileGroupButton}
                  onClick={removeSelectedFile}
                >
                  <DeleteIcon />
                  Remove selected file
                </Button>
                {
                  dataType === 'freesurfer' && (
                    <div>
                      <Typography>
                        <span className="bold">Items Mapped:</span>
                        {' '}
                        {stepsMapped}
                        {' '}
                        of
                        {' '}
                        {stepsTotal}
                      </Typography>
                      <Typography>
                        <span className="bold">Extension:</span>
                        {' '}
                        {dataFile.extension}
                      </Typography>
                      <Typography>
                        <span className="bold">Original MetaFile Header:</span>
                        {' '}
                        {dataFile.metaFile[0].join(', ')}
                      </Typography>
                      <Typography>
                        <span className="bold">Mapped MetaFile Header:</span>
                        {' '}
                        {dataFileHeader.join(', ')}
                      </Typography>
                    </div>
                  )
                }
                {
                  dataType === 'files' && (
                    <div>
                      <Typography>
                        <span className="bold">File(s):</span>
                      </Typography>
                      <div className={classes.fileList}>
                        {
                          dataFile.files.map((file, i) => (
                            <div key={file} className={classes.fileListItem}>
                              { `(${i + 1}) ${file}` }
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )
                }
                <div>
                  {
                    remainingDataVariables && remainingDataVariables.length > 0 && (
                      <div className="card-deck" ref={(ref) => { this.container = ref; }}>
                        {
                          remainingDataVariables.map(columnName => (
                            <div
                              className={`card-draggable card-${columnName.toLowerCase()}`}
                              data-string={columnName}
                              key={columnName}
                            >
                              <FileCopyIcon />
                              { columnName }
                              { dataType !== 'freesurfer' ? `Bundle (${dataFile.files.length} files)` : '' }
                              <Icon
                                className={classNames('fa fa-times-circle', classes.timesIcon)}
                                onClick={() => removeColumnFromDataFileHeader(columnName)}
                              />
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
                    stepsTotal !== stepsMapped
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
                    stepsTotal === stepsMapped
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
                    stepsTotal === stepsMapped
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
                    hasAnyDataMapped && (
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
                </div>
              </div>
            </Paper>
          )
        }
      </div>
    );
  }
}

MapsCollection.defaultProps = {
  dataFileHeader: null,
  dataFile: null,
};

MapsCollection.propTypes = {
  activeConsortium: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  dataFile: PropTypes.object,
  dataFileHeader: PropTypes.array,
  dataType: PropTypes.string.isRequired,
  stepsDataMappings: PropTypes.array.isRequired,
  stepsMapped: PropTypes.number.isRequired,
  stepsTotal: PropTypes.number.isRequired,
  addToDataMapping: PropTypes.func.isRequired,
  registerDraggableContainer: PropTypes.func.isRequired,
  removeColumnFromDataFileHeader: PropTypes.func.isRequired,
  removeExtraColumnsFromDataFileHeader: PropTypes.func.isRequired,
  removeSelectedFile: PropTypes.func.isRequired,
  resetDataMapping: PropTypes.func.isRequired,
  saveDataMapping: PropTypes.func.isRequired,
  setSelectedDataFile: PropTypes.func.isRequired,
};

export default withStyles(styles)(MapsCollection);
