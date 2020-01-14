import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import { isEqual, uniqWith } from 'lodash';
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import dragula from 'react-dragula';
import {
  getAllCollections,
  mapConsortiumData,
  incrementRunCount,
  saveAssociatedConsortia,
  saveCollection,
} from '../../state/ducks/collections';
import {
  getRunsForConsortium,
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
import MapsStepFieldset from './maps-step-fieldset';
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

    const collection = {
      name: '',
      description: '',
      fileGroups: {},
      associatedConsortia: {},
    };

    this.state = {
      activeConsortium: { stepIO: [], runs: 0, pipelineSteps: [] },
      containers: [],
      collection,
      dataType: 'array',
      isMapped: false,
      mappedItem: '',
      rowArray: [],
      metaRow: [],
      stepsMapped: 0,
    };

    this.saveCollection = this.saveCollection.bind(this);
    this.traversePipelineSteps = this.traversePipelineSteps.bind(this);
    this.updateCollection = this.updateCollection.bind(this);
    this.getDropAction = this.getDropAction.bind(this);
    this.saveAndCheckConsortiaMapping = this.saveAndCheckConsortiaMapping.bind(this);
    this.updateAssociatedConsortia = this.updateAssociatedConsortia.bind(this);
    this.updateConsortiumClientProps = this.updateConsortiumClientProps.bind(this);
  }

  setMetaRow = (val) => this.setState({ metaRow: val });
  setRowArray = (val) => this.setState({ rowArray: val });

  componentDidMount = () => {
    const {
      params,
      collections,
      pipelines,
      saveCollection,
      associatedConsortia,
    } = this.props;

    const consortium = associatedConsortia.find(c => c.id === params.consortiumId);
    const pipeline = pipelines.find(p => p.id === consortium.activePipelineId);

    if (pipeline.steps[0].dataMeta && pipeline.steps[0].dataMeta.type) {
      this.setState({ dataType: pipeline.steps[0].dataMeta.type });
    }

    let collection = collections.find(c => c.associatedConsortia.includes(consortium.id));
    if (!collection || Object.entries(collection.fileGroups).length === 0) {
      collection = {
        name: `${consortium.name}: Collection`,
        associatedConsortia: [consortium.id],
        fileGroups: {},
      };

      saveCollection(collection);
    }

    this.setState({ collection });

    this.setState({
      activeConsortium: {
        ...consortium,
        pipelineSteps: pipeline.steps,
      },
    });

    this.setState({ isMapped: consortium.isMapped });

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

    this.setPipelineSteps(pipeline.steps);

    this.getDropAction();
  }

  getDropAction = () => {
    drake.on('drop', (el, target) => {
      this.mapObject(el, target);
    });
  }

  removeMapStep = (type, index, string) => {
    const {
      rowArray,
    } = this.state;
    this.updateConsortiumClientProps(0, type, index, []);
    let array = rowArray;
    array.push(string);
    this.setRowArray(array);
  }

  removeRowArrItem = (item, method) => {
    const {
      rowArray,
    } = this.state;
    let array = rowArray;
    var index = array.indexOf(item);
    if (index !== -1) array.splice(index, 1);
    this.setRowArray(array);
    if(method && method === 'delete'){
      this.removeMetaFileColumn(item);
    }
  }

  removeExtraRowArrItems(){
    return new Promise((resolve, reject) => {
      const {
        rowArray,
      } = this.state;
      if(rowArray.length > 0){
        setTimeout(() => {
          while(rowArray.length > 0){
            rowArray.map((item) => {
                this.removeRowArrItem(item, 'delete');
            });
          }
        }, 250);
      }
      if(rowArray.length === 0){
        resolve(true);
      }
    });
  }

  saveCollection(e) {
    const { collection } = this.state;
    if (e) {
      e.preventDefault();
    }
    this.props.saveCollection(collection);
  }

  updateMetaFileHeader() {
    let groupKey = Object.keys(this.state.collection.fileGroups);
    groupKey = groupKey[0];
    let newMeta = this.state.collection.fileGroups[groupKey].metaFile;
    newMeta[0] = [...this.state.metaRow];
    this.setState(prevState => ({
      collection: {
        ...prevState.collection,
          fileGroups: {
            [groupKey]: update(prevState.collection.fileGroups[groupKey], {
            metaFile: {$set: newMeta}
          }),
        },
      },
    }),
    () => {
      this.props.saveCollection(this.state.collection);
    });
  }

  updateAssociatedConsortia(cons) {
    if (this.state.collection.associatedConsortia.id === cons.id) {
      this.setState(prevState => ({
        collection: {
          ...prevState.collection,
          error: '',
          associatedConsortia: [...prevState.collection.associatedConsortia, cons.id],
        },
      }),
      () => {
        this.props.saveCollection(this.state.collection);
      });
    }
  }

  saveAndCheckConsortiaMapping = () => {
    let removeExtraRowArrItems = this.removeExtraRowArrItems();
    removeExtraRowArrItems.then((r) => {
      if (!r) {
        return;
      }

      if(this.state.dataType === 'array'){
        this.updateMetaFileHeader();
      }

      const cons = this.state.activeConsortium;
      this.props.saveAssociatedConsortia(cons);
      const runs = this.props.userRuns;
      const currentUserId = this.props.auth.user.id;

      let mappedForRun = cons.mappedForRun || [];

      if (mappedForRun.indexOf(currentUserId) === -1) {
        mappedForRun = [...mappedForRun, currentUserId]
      }

      mapConsortiumData(cons.id)
      .then(filesArray => {
        this.setState({ isMapped: true });

        this.props.updateConsortiumMappedUsers({ consortiumId: cons.id, mappedForRun });

        if (!runs || !runs.length || runs[runs.length - 1].endDate) {
          return;
        }

        let run = runs[runs.length - 1];
        const consortium = this.props.consortia.find(obj => obj.id === run.consortiumId);
        if ('allFiles' in filesArray) {
          this.props.notifyInfo({
            message: `Pipeline Starting for ${cons.name}.`,
            action: {
              label: 'Watch Progress',
              callback: () => {
                this.props.router.push('dashboard');
              },
            },
          });

          if ('steps' in filesArray) {
            run = {
              ...run,
              pipelineSnapshot: {
                ...run.pipelineSnapshot,
                steps: filesArray.steps,
              },
            };
          }

          this.props.incrementRunCount(cons.id);
          ipcRenderer.send('start-pipeline', {
            consortium, pipeline: run.pipelineSnapshot, filesArray: filesArray.allFiles, run,
          });
          this.props.saveLocalRun({ ...run, status: 'started' });
        }
      });
    });
  }

  resetPipelineSteps = (array) => {
    const { pipelines } = this.props;
    const { activeConsortium } = this.state;

    const pipeline = pipelines.find(p => p.id === activeConsortium.activePipelineId);

    this.setState({
      activeConsortium: {
        ...activeConsortium,
        pipelineSteps: pipeline.steps,
      },
    });

    this.setRowArray([]);
    this.setRowArray(array);
    this.setState({ isMapped: false });
    this.setPipelineSteps(pipeline.steps);
  }

  setPipelineSteps(steps) {
    // Prepopulate stepIO with same number of steps as pipeline to ensure indices match
    // TODO: Add section specifically for covars and prepopulate empty values for all params?
    const stepIO = Array(steps.length)
      .fill([]);

    steps.forEach((step, index) => {
      if ('covariates' in step.inputMap) {
        stepIO[index] = {
          covariates: Array(step.inputMap.covariates.ownerMappings.length).fill([]),
        };
      }

      if ('data' in step.inputMap) {
        stepIO[index] = {
          ...stepIO[index],
          data: Array(step.inputMap.data.ownerMappings.length).fill([]),
        };
      }
    });

    this.setState(prevState => ({
      activeConsortium: {
        ...prevState.activeConsortium,
        pipelineSteps: steps,
        stepIO,
      },
    }));
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

  mapObject = (el, target) => {
    const { collection, metaRow } = this.state;
    const dex = target.dataset.index;
    const key = target.dataset.type;
    const name = target.dataset.name;
    const varObject = [{
      'collectionId': collection.id,
      'groupId': el.dataset.filegroup,
      'column':  name
    }];

    if (key && dex && varObject) {
      this.updateConsortiumClientProps(0, key, dex, varObject);
      this.setState({ mappedItem: el.dataset.string });
      this.removeRowArrItem(el.dataset.string);
      const marray = [...metaRow];
      const index = marray.indexOf(el.dataset.string);
      if (index === 0) {
        marray[index] = 'id';
      } else {
        marray[index] = name;
      }
      this.setMetaRow(marray);
    }
    el.remove();
  }

  removeMetaFileColumn(string) {
    let newMetaRow = [...this.state.metaRow];
    let index = newMetaRow.indexOf(string);
    if (index !== -1) newMetaRow.splice(index, 1);
    this.setState({metaRow: newMetaRow});
    let groupKey = Object.keys(this.state.collection.fileGroups);
    groupKey = groupKey[0];
    let newMeta = [...this.state.collection.fileGroups[groupKey].metaFile];
    newMeta = newMeta.map((row) => {
      row.splice(index, 1);
      return row;
    });
    this.setState(prevState => ({
      collection: {
        ...prevState.collection,
          fileGroups: {
            [groupKey]: update(prevState.collection.fileGroups[groupKey], {
            metaFile: {$set: newMeta}
          }),
        },
      },
    }),
    () => {
      this.props.saveCollection(this.state.collection);
    });
  }

  traversePipelineSteps() {
    const stepsInputs = [];
    const { activeConsortium } = this.state;

    if (!activeConsortium.pipelineSteps) {
      return;
    }

    activeConsortium.pipelineSteps.forEach((step) => {
      const { inputMap } = step;

      Object.keys(inputMap).forEach((inputMapKey) => {
        if (inputMapKey === 'meta') {
          return;
        }

        stepsInputs.push(
          <MapsStepFieldset
            registerDraggableContainer={this.registerDraggableContainer}
            key={`step-${inputMapKey}`}
            fieldsetName={inputMapKey}
            stepFieldset={inputMap[inputMapKey]}
            consortium={activeConsortium}
            removeMapStep={this.removeMapStep}
            updateConsortiumClientProps={this.updateConsortiumClientProps}
            mapped={this.props.mapped}
          />
        );
      });
    });

    return stepsInputs;
  }

  updateCollection(updateObj, callback) {
    this.setState(prevState => ({
      collection: { ...prevState.collection, ...updateObj },
    }), callback);
  }

  updateConsortiumClientProps(pipelineStepIndex, prop, propIndex, propArray) {
    this.setState((prevState) => {
      prevState.activeConsortium.stepIO[pipelineStepIndex][prop][propIndex] = propArray[0];
      }, (() => {
        this.updateAssociatedConsortia(this.state.activeConsortium);
    }));
  }

  render() {
    const { classes } = this.props;

    const {
      activeConsortium,
      collection,
      dataType,
      isMapped,
      mappedItem,
      metaRow,
      rowArray,
      stepsMapped,
      stepsTotal,
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
                <Grid item sm={4}>
                  <Paper
                    className={classes.rootPaper}
                    elevation={1}
                  >
                    <Typography variant="headline" className={classes.title}>
                      { `${activeConsortium.name}: Pipeline` }
                    </Typography>
                    <Divider />
                    { this.traversePipelineSteps() }
                  </Paper>
                </Grid>
                <Grid item sm={8}>
                  <Paper
                    className={classes.rootPaper}
                    elevation={1}
                  >
                    <Typography variant="headline" className={classes.title}>
                      { collection ? collection.name : 'File Collection' }
                    </Typography>
                    <div>
                      {
                        collection
                        && (
                          <MapsCollection
                            activeConsortium={activeConsortium}
                            collection={collection}
                            dataType={dataType}
                            registerDraggableContainer={this.registerDraggableContainer}
                            isMapped={isMapped}
                            notifySuccess={this.notifySuccess}
                            mappedItem={mappedItem}
                            metaRow={metaRow}
                            setMetaRow={this.setMetaRow}
                            removeRowArrItem={this.removeRowArrItem}
                            resetPipelineSteps={this.resetPipelineSteps}
                            rowArray={rowArray}
                            rowArrayLength={rowArray.length}
                            saveAndCheckConsortiaMapping={this.saveAndCheckConsortiaMapping}
                            saveCollection={this.saveCollection}
                            setRowArray={this.setRowArray}
                            stepsMapped={stepsMapped}
                            stepsTotal={stepsTotal}
                            updateCollection={this.updateCollection}
                            updateConsortiumClientProps={this.updateConsortiumClientProps}
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
  associatedConsortia: PropTypes.array.isRequired,
  getAllCollections: PropTypes.func.isRequired,
  getRunsForConsortium: PropTypes.func.isRequired,
  runs: PropTypes.array.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
};

function mapStateToProps({ auth,
  collections: { associatedConsortia, collections } }) {
  return { auth, associatedConsortia, collections };
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
    getAllCollections,
    getRunsForConsortium,
    incrementRunCount,
    notifyInfo,
    saveAssociatedConsortia,
    saveCollection,
    saveLocalRun,
  }
)(ComponentWithData);

export default withStyles(styles)(connectedComponent);
