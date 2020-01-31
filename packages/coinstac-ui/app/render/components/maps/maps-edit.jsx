import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import PropTypes from 'prop-types';
import { isEqual, uniqWith } from 'lodash';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import dragula from 'react-dragula';
import { saveDataMapping } from '../../state/ducks/maps';
import {
  saveLocalRun,
} from '../../state/ducks/runs';
import {
  saveDocumentProp,
  updateConsortiumMappedUsersProp,
} from '../../state/graphql/props';
import {
  FETCH_ALL_USER_RUNS_QUERY,
  SAVE_CONSORTIUM_MUTATION,
  UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION,
} from '../../state/graphql/functions';
import { notifyInfo } from '../../state/ducks/notifyAndLog';
import MapsPipelineVariables from './maps-pipeline-variables';
import MapsCollection from './maps-collection';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
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
      saveDataMapping,
    } = this.props;

    const consortium = consortia.find(c => c.id === params.consortiumId);
    const pipeline = pipelines.find(p => p.id === consortium.activePipelineId);

    console.log('pipao', pipeline.steps);

    if (pipeline.steps[0].dataMeta && pipeline.steps[0].dataMeta.type) {
      this.setState({ dataType: pipeline.steps[0].dataMeta.type });
    }

    // const consortiumDataMap = maps.find(
    //   m => m.consortiumId === consortium.id && m.pipelineId === consortium.activePipelineId
    // );

    this.setState({
      activeConsortium: {
        ...consortium,
        pipelineSteps: pipeline.steps,
      },
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

      const { dataFile } = prevState;

      if (dataFile) {
        stateChanges.dataFileHeader = dataFile.metaFile[0];
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
    this.setState({
      dataFileHeader: dataFile.metaFile[0],
      dataFile,
    });
  }

  removeSelectedFile = () => {
    this.resetDataMapping();

    this.setState({
      dataFile: null,
      dataFileHeader: null,
    });
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
                    <Typography variant="headline" className={classes.title}>
                      File Collection
                    </Typography>
                    <div>
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
                        removeExtraColumnsFromDataFileHeader={this.removeExtraColumnsFromDataFileHeader}
                        dataFile={dataFile}
                        dataFileHeader={dataFileHeader}
                        saveDataMapping={this.saveDataMapping}
                        setSelectedDataFile={this.setSelectedDataFile}
                        resetDataMapping={this.resetDataMapping}
                      />
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
  consortia: PropTypes.array.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

function mapStateToProps({ auth, maps }) {
  return {
    auth,
    maps: maps.consortiumDataMappings,
  };
}

const ComponentWithData = compose(
  graphql(FETCH_ALL_USER_RUNS_QUERY, {
    props: ({ data }) => ({
      userRuns: data.fetchAllUserRuns,
      refetchUserRuns: data.refetch,
    }),
    options: props => ({
      variables: { userId: props.auth.user.id },
    }),
  }),
  graphql(SAVE_CONSORTIUM_MUTATION, saveDocumentProp('saveConsortium', 'consortium')),
  graphql(
    UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION,
    updateConsortiumMappedUsersProp('updateConsortiumMappedUsers'),
  ),
  withApollo
)(MapsEdit);

const connectedComponent = connect(mapStateToProps,
  {
    notifyInfo,
    saveLocalRun,
    saveDataMapping,
  })(ComponentWithData);

export default withStyles(styles)(connectedComponent);
