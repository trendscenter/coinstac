import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { includes, isEqual, uniqWith } from 'lodash';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import {
  getConsortium,
  incrementRunCount,
  saveAssociatedConsortia,
} from '../../state/ducks/collections';
import {
  getRunsForConsortium,
  saveLocalRun
} from '../../state/ducks/runs';
import {
  FETCH_ALL_USER_RUNS_QUERY,
  SAVE_COLLECTION,
  SAVE_CONSORTIUM_MAPPING,
  GET_ALL_COLLECTIONS,
} from '../../state/graphql/functions';
import { getCollectionFiles2 } from '../../state/graphql/utils';
import { notifyInfo } from '../../state/ducks/notifyAndLog';
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
      associatedConsortia: null,
    };

    this.state = {
      activeConsortium: { stepIO: [], runs: 0, pipelineSteps: [] },
      containers: [],
      collection,
      exists: false,
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

  componentDidMount = () => {
    const consortium = {
      ...this.props.consortium
    };

    this.setState({
      consortium,
      activeConsortium: {
        ...this.props.consortium,
        stepIO: [...this.props.consortium.stepIO],
      },
    });
    const { user } = this.props.auth;
    let mapped = this.getMapped(
      isUserA(user.id, consortium.members),
      isUserA(user.id, consortium.owners),
      consortium
    )
    this.setState({isMapped: mapped});
    this.setPipelineSteps(consortium.pipelineSteps);
    Object.keys(this.props.collections).map(([key, value]) => {
      if (includes(this.props.collections[key], consortium.name + ': Collection')) {
        this.setState({
          collection: this.props.collections[key],
          exists: true
        });
      }
    });
    let collection = {
      name: consortium.name + ': Collection',
      associatedConsortia: consortium,
      fileGroups: {},
    }
    if( this.state.exists === false ){
      this.setState({ collection });
      this.props.saveCollection(collection.name, consortium.id, {});
    }
    this.getDropAction();
  }

  filterGetObj(arr, searchKey) {
    let searchkey = searchKey.replace('file', ''); //other object values contain the string 'file', let's remove.
    return arr.filter(function(obj) {
     return Object.keys(obj).some(function(key) {
       let objkey = obj[key];
       if(typeof objkey === 'string'){
         let fuzzy = bitap(objkey, searchkey, 1);
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
           let fuzzy = bitap(objkey, searchkey, 1);
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
    return consortium.isMapped;
  }

  makePoints = ((str) => {
    return str.split(", ");
  });

  mapObject = (el, target) => {
    let fuzzy = bitap(el.dataset.string.toLowerCase(), target.dataset.name.toLowerCase(), 1);
    if(fuzzy.length){
      let covariates = this.state.consortium.pipelineSteps[0].inputMap.covariates.ownerMappings;
      let data = this.state.consortium.pipelineSteps[0].inputMap.data.ownerMappings;
      let group = this.state.collection.fileGroups[el.dataset.filegroup];
      let dex = '';
      let key = '';
      let name = target.dataset.name;
      let string = el.dataset.string;
      let varObject = [{
        'consortiumId': this.state.consortium.id,
        'groupId': el.dataset.filegroup,
        'column':  target.dataset.name
      }];
      if( Object.keys(this.filterGetObj(covariates,name)).length > 0 ){
        dex = this.filterGetIndex(covariates,name);
        key = 'covariates';
      }
      if ( Object.keys(this.filterGetObj(data,name)).length > 0 ){
        dex = this.filterGetIndex(data,name);
        key = 'data';
      }
      this.updateConsortiumClientProps(0, key, dex, varObject);
      this.setState({mappedItem: string});
      el.remove();
    }
  }

  saveCollection(e) {
    if (e) {
      e.preventDefault();
    }
    const { collection } = this.state;
    this.props.saveCollection(collection.name, collection.associatedConsortia.id, collection.fileGroups);
  }

  updateAssociatedConsortia(cons) {
    if (this.state.collection.associatedConsortia.id === cons.id) {
      const key = Object.keys(this.state.collection.fileGroups)[0];
      this.setState(prevState => {
        return {
          collection: {
            ...prevState.collection,
            error: '',
            associatedConsortia: cons.id,
          },
        };
      });
    }
  }

  saveAndCheckConsortiaMapping = () => {
    const cons = this.state.activeConsortium;

    this.props.saveConsortiumMapping(cons.id, cons.stepIO);
    this.props.saveAssociatedConsortia(cons)
    const runs = this.props.userRuns;

    const filesArray = getCollectionFiles2(this.props.client, cons.id, cons.stepIO);

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
    if (this.state.consortium.pipelineSteps) {
      let steps = this.state.consortium.pipelineSteps;
      Object.entries(this.state.consortium.pipelineSteps).forEach(([key, value]) => {
        let inputMap = steps[key].inputMap;
        Object.keys(inputMap).map((k, i) => {
           result.push(
             <MapsStep
               getContainers={this.getContainers}
               key={i}
               name={Object.keys(inputMap)[i]}
               step={inputMap[k]}
               consortium={this.state.consortium.stepIO &&
                 Object.keys(this.state.consortium.stepIO).length > 0 ?
                this.state.consortium : this.state.activeConsortium
               }
               updateMapsStep={this.state.updateMapsStep}
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
      const activeConsortium = { ...prevState.activeConsortium };
      activeConsortium.stepIO[pipelineStepIndex][prop][propIndex] = propArray[0];

      return {
        activeConsortium,
      };
    }, (() => {
      this.updateAssociatedConsortia(this.state.activeConsortium);
    }));
  }

  render() {
    const { classes } = this.props;

    const {
      activeConsortium,
      collection,
      consortium,
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
                            getContainers={this.getContainers}
                            isMapped={isMapped}
                            notifySuccess={this.notifySuccess}
                            mappedItem={mappedItem}
                            rowArray={rowArray}
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

MapsEdit.propTypes = {
  getConsortium: PropTypes.func.isRequired,
  getRunsForConsortium: PropTypes.func.isRequired,
  runs: PropTypes.array.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
};

function mapStateToProps({ auth }) {
  return { auth };
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
  graphql(GET_ALL_COLLECTIONS, {
    props: ({ data }) => ({
      collections: data.collections,
    }),
  }),
  graphql(SAVE_COLLECTION, {
    props: ({ mutate }) => ({
      saveCollection: (name, associatedConsortium, fileGroups) => mutate({
        variables: { name, associatedConsortium, fileGroups },
      }),
    }),
  }),
  graphql(SAVE_CONSORTIUM_MAPPING, {
    props: ({ mutate }) => ({
      saveConsortiumMapping: (consortiumId, stepIO) => mutate({
        variables: { consortiumId, stepIO },
      }),
    }),
  }),
  withApollo
)(MapsEdit);

const connectedComponent = connect(mapStateToProps,
  {
    getConsortium,
    getRunsForConsortium,
    incrementRunCount,
    notifyInfo,
    saveAssociatedConsortia,
    saveLocalRun,
  }
)(ComponentWithData);

export default withStyles(styles)(connectedComponent);
