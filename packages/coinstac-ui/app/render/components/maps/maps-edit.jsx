import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import { includes, isEqual, uniqWith } from 'lodash';
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
    copy: false,
    revertOnSpill: true,
    accepts: function (el, target) {
      if(el.dataset.string && target.dataset.name){
        let fuzzy = bitap(el.dataset.string.toLowerCase(), target.dataset.name.toLowerCase(), 1);
        if(fuzzy.length){
          return true;
        }
      }
    },
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
      dataType: '',
      isMapped: false,
      mappedItem: '',
      rowArray: [],
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

  filterGetObj(arr, searchKey) {
    let searchkey = searchKey.replace('file', ''); //other object values contain the string 'file', let's remove.
    return arr.filter(function(obj) {
     return Object.keys(obj).some(function(key) {
       let objkey = obj[key];
       if(typeof objkey === 'string'){
         let fuzzy = bitap(objkey.toLowerCase(), searchkey.toLowerCase(), 1);
         if(fuzzy.length){
           return obj[key];
         }
       }
     })
    });
  }

  filterGetIndex(arr, searchKey) {
     let searchkey = searchKey.replace('file', ''); //other object values contain the string 'file', let's remove.
     return arr.findIndex(function(obj) {
       return Object.keys(obj).some(function(key) {
         let objkey = obj[key];
         if(typeof objkey === 'string'){
           let fuzzy = bitap(objkey.toLowerCase(), searchkey.toLowerCase(), 1);
           if(fuzzy.length){
             return obj[key];
           }
         }
       })
     });
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
    const { activeConsortium, collection } = this.state;
    let string = el.dataset.string.replace('file', '');
    let fuzzy = bitap(string.toLowerCase(), target.dataset.name.toLowerCase(), 1);
    let covariates = false;
    let data = false;
    if(fuzzy.length > 0){
      if(activeConsortium.pipelineSteps[0].inputMap.covariates){
        covariates = activeConsortium.pipelineSteps[0].inputMap.covariates.ownerMappings;
      }
      if(activeConsortium.pipelineSteps[0].inputMap.data){
        data = activeConsortium.pipelineSteps[0].inputMap.data.ownerMappings;
      }
      let group = collection.fileGroups[el.dataset.filegroup];
      let dex = null;
      let key = null;
      let name = target.dataset.name;
      let varObject = [{
        'collectionId': collection.id,
        'groupId': el.dataset.filegroup,
        'column':  target.dataset.name
      }];
      if( covariates && Object.keys(this.filterGetObj(covariates,name)).length > 0 ){
        dex = this.filterGetIndex(covariates,name);
        key = 'covariates';
      }
      if ( data && Object.keys(this.filterGetObj(data,name)).length > 0 ){
        dex = this.filterGetIndex(data,name);
        key = 'data';
      }
      this.updateConsortiumClientProps(0, key, dex, varObject);
      this.setState({mappedItem: string});
      el.remove();
    }
  }

  saveCollection(e) {
    const { collection } = this.state;
    if (e) {
      e.preventDefault();
    }
    this.props.saveCollection(collection);
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
        this.setState({ dataType: step.inputMap.data.ownerMappings[0]['type'] });
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
    const { activeConsortium } = this.state;
    if (activeConsortium.pipelineSteps) {
      let steps = activeConsortium.pipelineSteps;
      Object.entries(steps).forEach(([key, value]) => {
        let inputMap = steps[key].inputMap;
        Object.keys(inputMap).map((k, i) => {
           result.push(
             <MapsStep
               getContainers={this.getContainers}
               key={i}
               name={Object.keys(inputMap)[i]}
               step={inputMap[k]}
               consortium={activeConsortium}
               updateMapsStep={this.state.updateMapsStep}
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
  }

  render() {
    const { classes, consortium } = this.props;

    const {
      activeConsortium,
      collection,
      dataType,
      isMapped,
      mappedItem,
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
                            getContainers={this.getContainers}
                            isMapped={isMapped}
                            notifySuccess={this.notifySuccess}
                            mappedItem={mappedItem}
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
