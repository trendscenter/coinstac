import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import { includes, isEqual, uniqWith } from 'lodash';
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import {
  getAllCollections,
  getCollectionFiles,
  incrementRunCount,
  saveAssociatedConsortia,
  saveCollection,
  updateCollection
} from '../../state/ducks/collections';
import {
  getRunsForConsortium,
  saveLocalRun
} from '../../state/ducks/runs';
import {
  getSelectAndSubProp,
} from '../../state/graphql/props';
import {
  FETCH_ALL_USER_RUNS_QUERY,
} from '../../state/graphql/functions';
import { notifyInfo } from '../../state/ducks/notifyAndLog';
import { Alert, Button, Panel } from 'react-bootstrap';
import MapsStep from './maps-step';
import MapsCollection from './maps-collection';
import dragula from 'react-dragula';
import bitap from 'bitap';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
    height: '100%',
  },
});

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

let drake = dragula({
  copy: true,
  copySortSource: true,
  revertOnSpill: true,
});

class MapsEdit extends Component {
  constructor(props) {
    super(props);

    let collection = {
      name: '',
      description: '',
      fileGroups: {},
      associatedConsortia: {},
    };

    this.state = {
      activeConsortium: { stepIO: [], runs: 0, pipelineSteps: [] },
      containers: [],
      collection,
      isMapped: false,
      mappedItem: '',
      rowArray: [],
      metaRow: [],
      sources: [],
      updateMapsStep: false,
    };

    this.saveCollection = this.saveCollection.bind(this);
    this.traversePipelineSteps = this.traversePipelineSteps.bind(this);
    this.updateCollection = this.updateCollection.bind(this);
    this.getContainers = this.getContainers.bind(this);
    this.getDropAction = this.getDropAction.bind(this);
    this.saveAndCheckConsortiaMapping = this.saveAndCheckConsortiaMapping.bind(this);
    this.updateAssociatedConsortia = this.updateAssociatedConsortia.bind(this);
    this.updateConsortiumClientProps = this.updateConsortiumClientProps.bind(this);
  }

  setMetaRow = (val) => this.setState({ metaRow: val });
  setRowArray = (val) => this.setState({ rowArray: val });
  updateMapsStep = (val) => this.setState({ updateMapsStep: val });

  componentWillMount = () => {
    const { consortium, collections } = this.props;
    Object.keys(collections).map(([key, value]) => {
      let colname = collections[key].name;
      let conname = consortium.name+': Collection';
      if( colname === conname && Object.entries(collections[key].fileGroups).length > 0 ){
        let collection = collections[key];
        this.setState(prevState => ({ collection }));
        return;
      }
    });
  }

  componentDidMount = () => {
    const { user } = this.props.auth;
    const { consortium, collections, mapped, pipelines } = this.props;
    let pipeline = pipelines.find(p => p.id === consortium.activePipelineId);
     this.setState({
       activeConsortium: {
         ...consortium,
         pipelineSteps: pipeline.steps,
       },
     });
     this.setState({isMapped: mapped});
     this.setPipelineSteps(pipeline.steps);

     let name = consortium.name+': Collection';

     let colExists = collections.map(function(e) { return e.name; }).indexOf(name);

     if( colExists === -1 && Object.entries(this.state.collection.fileGroups).length === 0 ){
         let collection = {
           name: consortium.name+': Collection',
           associatedConsortia: consortium,
           fileGroups: {},
         }
        this.setState({collection});
        this.props.saveCollection(collection);
     }else{
       this.setState({collection: collections[0]});
     }

     this.getDropAction();
  }

  getContainers = (container) => {
    let containers = [];
    if(container){
      let newContainers = this.state.containers;
      newContainers.push(container);
    }
    containers = uniqWith(this.state.containers, isEqual);
    containers.map((container) => {
      drake.containers.push(container);
    });
  }

  getDropAction = () => {
    drake.on('drop', (el, target, source, sibling) => {
      this.mapObject(el, target);
    });
  }

  getMapped = (member, owner, consortium) => {
    const { auth: { user } } = this.props;
    if (consortium.isMapped) {
      return true;
    }else{
      return false;
    }
  }

  makePoints = ((str) => {
    return str.split(", ");
  });

  mapObject = (el, target) => {
    const { activeConsortium, collection, metaRow, rowArray } = this.state;
    let group = collection.fileGroups[el.dataset.filegroup];
    let dex = target.dataset.index;
    let key = target.dataset.type;
    let name = target.dataset.name;
    let varObject = [{
      'collectionId': collection.id,
      'groupId': el.dataset.filegroup,
      'column':  name
    }];
    if(key && dex && varObject){
      this.updateConsortiumClientProps(0, key, dex, varObject);
      this.setState({mappedItem: el.dataset.string});
      this.removeRowArrItem(el.dataset.string);
      let marray = [...metaRow];
      let index = marray.indexOf(el.dataset.string);
      if(index === 0){
        marray[index] = 'id';
      }else{
        marray[index] = name;
      }
      this.setMetaRow(marray);
    }
    el.remove();
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

  removeRowArrItem = (item) => {
    const {
      rowArray,
    } = this.state;
    let array = rowArray;
    var index = array.indexOf(item);
    if (index !== -1) array.splice(index, 1);
    this.setRowArray(array);
  }

  saveCollection(e) {
    const { collection } = this.state;
    if (e) {
      e.preventDefault();
    }
    this.props.saveCollection(collection);
  }

  updateMetaRow() {
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
    this.updateMetaRow();

    const cons = this.state.activeConsortium;
    this.props.saveAssociatedConsortia(cons);
    const runs = this.props.userRuns;

    this.props.getCollectionFiles(cons.id)
      .then((filesArray) => {
        this.setState({isMapped: true});

        if (runs && runs.length && !runs[runs.length - 1].endDate) {
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
        }
      });
  }

  resetPipelineSteps = (array) => {
    const { consortium, collections, mapped, pipelines } = this.props;
    let pipeline = pipelines.find(p => p.id === consortium.activePipelineId);
     this.setState({
       activeConsortium: {
         ...consortium,
         pipelineSteps: pipeline.steps,
       },
     });
     this.setRowArray([]);
     this.setRowArray(array);
     this.setState({isMapped: false});
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

  traversePipelineSteps(){
    let result = [];
    const { activeConsortium, metaRow, rowArray } = this.state;
    if (activeConsortium.pipelineSteps) {
      let steps = activeConsortium.pipelineSteps;
      Object.entries(steps).forEach(([key, value]) => {
        let inputMap = steps[key].inputMap;
        Object.keys(inputMap).map((k, i) => {
           result.push(
             <MapsStep
               getContainers={this.getContainers}
               key={'step'+k+'-'+i}
               name={Object.keys(inputMap)[i]}
               step={inputMap[k]}
               consortium={activeConsortium}
               metaRow={metaRow}
               setMetaRow={this.setMetaRow}
               rowArray={rowArray}
               removeMapStep={this.removeMapStep}
               setRowArray={this.setRowArray}
               updateMapsStep={this.state.updateMapsStep}
               updateConsortiumClientProps={this.updateConsortiumClientProps}
               mapped={this.props.mapped}
              />
           );
        });
      });
    }
    return result;
  }

  uniqueArray(array) {
    return array.filter(function(elem, pos,arr) {
      return arr.indexOf(elem) == pos;
    });
  };

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
    this.setState({updateMapsStep: true});
  }

  render() {
    const { classes, consortium } = this.props;

    const {
      activeConsortium,
      collection,
      isMapped,
      mappedItem,
      metaRow,
      rowArray,
    } = this.state;

    return (
      <div>
        {
          consortium && activeConsortium
          && (
            <div>
              <div className="page-header">
                <Typography variant="h4">
                  Map - {consortium ? consortium.name : ''}
                </Typography>
              </div>
              <Grid container spacing={16}>
                <Grid item sm={4}>
                  <Paper
                    className={classes.rootPaper}
                    elevation={1}
                  >
                    <Typography variant="headline" className={classes.title}>
                      { consortium ? `${consortium.name}: Pipeline` : 'Pipeline' }
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
                            getContainers={this.getContainers}
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
                            updateCollection={this.updateCollection}
                            updateConsortiumClientProps={this.updateConsortiumClientProps}
                            updateMapsStep={this.updateMapsStep}
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

MapsEdit.defaultProps = {
  activeAssociatedConsortia: [],
};

MapsEdit.propTypes = {
  activeAssociatedConsortia: PropTypes.array,
  getAllCollections: PropTypes.func.isRequired,
  getRunsForConsortium: PropTypes.func.isRequired,
  runs: PropTypes.array.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
};

function mapStateToProps({ auth,
  collections: { activeAssociatedConsortia, collections } }) {
  return { auth, activeAssociatedConsortia, collections };
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
  withApollo
)(MapsEdit);

const connectedComponent = connect(mapStateToProps,
  {
    getCollectionFiles,
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
