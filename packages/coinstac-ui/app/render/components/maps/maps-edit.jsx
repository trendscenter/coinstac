import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { compose, graphql, withApollo } from 'react-apollo';
import PropTypes from 'prop-types';
import { isEqual, uniqWith } from 'lodash';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import dragula from 'react-dragula';
import Button from '@material-ui/core/Button';
import { saveDataMapping } from '../../state/ducks/maps';
import {
  updateConsortiumMappedUsersProp,
} from '../../state/graphql/props';
import {
  UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION,
} from '../../state/graphql/functions';
import MapsPipelineVariables from './maps-pipeline-variables';
import MapsCollection from './maps-collection';
import path from 'path';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    height: '100%',
  },
});

const drake = dragula({
  copy: true,
  copySortSource: true,
  revertOnSpill: true,
});

class MapsEdit extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeConsortium: null,
      containers: [],
      stepsDataMappings: [],
      dataType: 'array',
      isMapped: false,
      stepsMapped: 0,
      dataFile: null,
      dataFileHeader: null,
    };
  }

  componentDidMount = () => {
    const {
      params,
      maps,
      pipelines,
      consortia,
    } = this.props;

    const consortium = consortia.find(c => c.id === params.consortiumId);
    const pipeline = pipelines.find(p => p.id === consortium.activePipelineId);

    if (pipeline.steps[0].dataMeta && pipeline.steps[0].dataMeta.type) {
      this.setState({ dataType: pipeline.steps[0].dataMeta.type });
    }

    const consortiumDataMap = maps.find(
      m => m.consortiumId === consortium.id && m.pipelineId === consortium.activePipelineId
    );

    this.setState({
      activeConsortium: {
        ...consortium,
        pipelineSteps: pipeline.steps,
      },
      isMapped: !!consortiumDataMap,
    });

    let totalInputFields = 0;

    if (pipeline.steps[0].inputMap.covariates) {
      const ctotal = pipeline.steps[0].inputMap.covariates.ownerMappings.length;
      totalInputFields += ctotal;
    }

    if (pipeline.steps[0].inputMap.data) {
      const dtotal = pipeline.steps[0].inputMap.data.ownerMappings.length;
      totalInputFields += dtotal;
    }

    this.setState({ stepsTotal: totalInputFields });

    this.setupDragAndDropObjects();
  }

  setupDragAndDropObjects = () => {
    drake.on('drop', (el, target) => {
      this.mapObject(el, target);
    });
  }

  saveDataMapping = () => {
    const { dataFile, stepsDataMappings, activeConsortium } = this.state;
    const { saveDataMapping, updateConsortiumMappedUsers, auth } = this.props;

    saveDataMapping(activeConsortium.id, activeConsortium.activePipelineId,
      stepsDataMappings, dataFile);

    const currentUserId = auth.user.id;
    let mappedForRun = activeConsortium.mappedForRun || [];

    if (mappedForRun.indexOf(currentUserId) === -1) {
      mappedForRun = [...mappedForRun, currentUserId];
    }

    updateConsortiumMappedUsers({ consortiumId: activeConsortium.id, mappedForRun });

    this.setState({ isMapped: true });
  }

  resetDataMapping = () => {
    this.setState((prevState) => {
      const stateChanges = {
        stepsDataMappings: [],
      };

      const { dataFile, dataType } = prevState;

      if (dataFile) {
        switch (dataType) {
          case 'array':
            stateChanges.dataFileHeader = dataFile.metaFile[0]
            break;
          case 'bundle':
            stateChanges.dataFileHeader = [dataType]
            break;
          case 'singles':
            stateChanges.dataFileHeader = dataFile.files
            break;
          default:
            stateChanges.dataFileHeader = [dataType]
            break;
        }
      }

      return stateChanges;
    });
  }

  unmapField = (fieldsetName, dataFileFieldName) => {
    this.setState((prevState) => {
      const stateChanges = {
        stepsDataMappings: [
          ...prevState.stepsDataMappings,
        ],
      };

      stateChanges.stepsDataMappings[0] = {
        ...stateChanges.stepsDataMappings[0],
        [fieldsetName]: [
          ...stateChanges.stepsDataMappings[0][fieldsetName],
        ],
      };

      const spliceIndex = stateChanges.stepsDataMappings[0][fieldsetName].findIndex(
        field => field.dataFileFieldName === dataFileFieldName
      );

      stateChanges.stepsDataMappings[0][fieldsetName].splice(spliceIndex, 1);

      return stateChanges;
    });
  }

  registerDraggableContainer = (container) => {
    if (!container) {
      return;
    }

    const { containers, stepsTotal } = this.state;

    const newContainers = containers;
    newContainers.push(container);

    const uniqueContainers = uniqWith(newContainers, isEqual);

    const filter = [
      'card-deck',
      'card-draggable',
    ];

    let unmappedContainersCount = 0;
    uniqueContainers.forEach((item) => {
      const itemClass = item.getAttribute('class');

      if (!itemClass.includes(filter[0]) && !itemClass.includes(filter[1])) {
        unmappedContainersCount += 1;
      }
    });

    const stepsMappedCount = stepsTotal - unmappedContainersCount;

    this.setState({ stepsMapped: stepsMappedCount });

    uniqueContainers.forEach((container) => {
      drake.containers.push(container);
    });
  }

  mapObject = (fileDataMappingElement, targetPipelineElement) => {
    const fieldsetName = targetPipelineElement.dataset.type;
    const fieldName = targetPipelineElement.dataset.name;
    const dataMappingFieldName = fileDataMappingElement.dataset.string;

    this.addToDataMapping(fieldsetName, fieldName, dataMappingFieldName);

    fileDataMappingElement.remove();
  }

  addToDataMapping = (fieldsetName, fieldName, dataMappingFieldName) => {
    if (!fieldsetName || !fieldName || !dataMappingFieldName) {
      return;
    }

    this.setState((prevState) => {
      const stateChanges = {
        stepsDataMappings: [
          ...prevState.stepsDataMappings,
        ],
      };

      const currentStepIndex = 0;

      if (stateChanges.stepsDataMappings.length <= currentStepIndex) {
        stateChanges.stepsDataMappings.push({});
      }

      if (!(fieldsetName in stateChanges.stepsDataMappings[currentStepIndex])) {
        stateChanges.stepsDataMappings[currentStepIndex][fieldsetName] = [];
      }

      stateChanges.stepsDataMappings[currentStepIndex] = {
        ...stateChanges.stepsDataMappings[currentStepIndex],
        [fieldsetName]: [
          ...stateChanges.stepsDataMappings[currentStepIndex][fieldsetName],
          {
            pipelineVariableName: fieldName,
            dataFileFieldName: dataMappingFieldName,
          },
        ],
      };

      return stateChanges;
    });
  }

  removeColumnFromDataFileHeader = (column) => {
    this.setState((prevState) => {
      const updatedDataFileHeader = [
        ...prevState.dataFileHeader,
      ];

      const columnIndex = updatedDataFileHeader.findIndex(header => header === column);

      if (columnIndex === -1) {
        return null;
      }

      updatedDataFileHeader.splice(columnIndex, 1);

      return {
        dataFileHeader: updatedDataFileHeader,
      };
    });
  }

  removeExtraColumnsFromDataFileHeader = () => {
    this.setState((prevState) => {
      const stateChanges = {
        dataFileHeader: [
          ...prevState.dataFileHeader,
        ],
      };

      const { stepsDataMappings } = prevState;

      const firstStepDataMappings = stepsDataMappings[0];

      prevState.dataFileHeader.forEach((headerColumn) => {
        let isColumnMapped = false;

        Object.keys(firstStepDataMappings).forEach((key) => {
          firstStepDataMappings[key].forEach((mapping) => {
            if (mapping.dataFileFieldName === headerColumn) {
              isColumnMapped = true;
            }
          });
        });

        if (!isColumnMapped) {
          const index = stateChanges.dataFileHeader.findIndex(c => c === headerColumn);
          stateChanges.dataFileHeader.splice(index, 1);
        }
      });

      return stateChanges;
    });
  }

  setSelectedDataFile = (dataFile) => {
    this.setState((prevState) => {
      const { dataType } = prevState;
      let fileHeader;
      switch (dataType) {
        case 'array':
          fileHeader = dataFile.metaFile[0]
          break;
        case 'bundle':
          fileHeader = [dataType]
          break;
        case 'singles':
          fileHeader = dataFile.files
          break;
        default:
          fileHeader = [dataType]
          break;
      }
      return {
        dataFileHeader: fileHeader,
        dataFile: {
          ...dataFile,
          dataType,
        },
      };
    });
  }

  removeSelectedFile = () => {
    this.resetDataMapping();

    this.setState({
      dataFile: null,
      dataFileHeader: null,
    });
  }

  getFileName = (filepath) => {
    return path.basename(filepath, path.extname(filepath));
  }

  render() {
    const { classes } = this.props;

    const {
      activeConsortium,
      dataType,
      isMapped,
      stepsMapped,
      stepsTotal,
      stepsDataMappings,
      dataFile,
      dataFileHeader,
    } = this.state;

    return (
      <div>
        {
          activeConsortium
          && (
            <div>
              <div className="page-header">
                <Typography variant="h4">
                  { `Map - ${activeConsortium.name}` }
                </Typography>
              </div>
              <Grid container spacing={16}>
                <MapsPipelineVariables
                  consortium={activeConsortium}
                  registerDraggableContainer={this.registerDraggableContainer}
                  stepsDataMappings={stepsDataMappings}
                  unmapField={this.unmapField}
                />
                <Grid item sm={8}>
                  <Paper
                    className={classes.rootPaper}
                    elevation={1}
                  >
                    <Typography variant="h5" className={classes.title}>
                      File Collection
                    </Typography>
                    <div>
                      {
                        isMapped ? (
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
                        ) : (
                          <MapsCollection
                            activeConsortium={activeConsortium}
                            dataType={dataType}
                            registerDraggableContainer={this.registerDraggableContainer}
                            isMapped={isMapped}
                            removeSelectedFile={this.removeSelectedFile}
                            stepsMapped={stepsMapped}
                            stepsTotal={stepsTotal}
                            addToDataMapping={this.addToDataMapping}
                            stepsDataMappings={stepsDataMappings}
                            removeColumnFromDataFileHeader={this.removeColumnFromDataFileHeader}
                            removeExtraColumnsFromDataFileHeader={
                              this.removeExtraColumnsFromDataFileHeader
                            }
                            dataFile={dataFile}
                            dataFileHeader={dataFileHeader}
                            saveDataMapping={this.saveDataMapping}
                            setSelectedDataFile={this.setSelectedDataFile}
                            resetDataMapping={this.resetDataMapping}
                            getFileName={this.getFileName}
                          />
                        )
                      }
                    </div>
                  </Paper>
                </Grid>
              </Grid>
            </div>
          )
        }
      </div>
    );
  }
}

MapsEdit.propTypes = {
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  maps: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
  saveDataMapping: PropTypes.func.isRequired,
  updateConsortiumMappedUsers: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, maps }) => ({
  auth,
  maps: maps.consortiumDataMappings,
});

const ComponentWithData = compose(
  graphql(
    UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION,
    updateConsortiumMappedUsersProp('updateConsortiumMappedUsers')
  ),
  withApollo
)(MapsEdit);

const connectedComponent = connect(mapStateToProps,
  {
    saveDataMapping,
  })(ComponentWithData);

export default withStyles(styles)(connectedComponent);
