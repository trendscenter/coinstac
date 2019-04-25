import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import {
  getCollectionFiles,
  getAllAssociatedConsortia,
  incrementRunCount,
  removeCollectionsFromAssociatedConsortia,
  saveAssociatedConsortia,
} from '../state/ducks/collections';
import { saveLocalRun } from '../state/ducks/runs';
import { updateUserPerms } from '../state/ducks/auth';
import { pullComputations } from '../state/ducks/docker';
import {
  CREATE_RUN_MUTATION,
  DELETE_CONSORTIUM_MUTATION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  JOIN_CONSORTIUM_MUTATION,
  LEAVE_CONSORTIUM_MUTATION,
} from '../state/graphql/functions';
import { notifyInfo, notifyWarning } from '../state/ducks/notifyAndLog';
import ConsortiaList from '../components/consortia/consortia-list';

class ConsortiaListContainer extends Component {
  componentDidMount() {
    const { getAllAssociatedConsortia } = this.props;

    getAllAssociatedConsortia();
  }

  deleteConsortium = (consortiumId) => {
    const { removeCollectionsFromAssociatedConsortia, deleteConsortiumById } = this.props;

    removeCollectionsFromAssociatedConsortia(consortiumId, true)
      .then(() => {
        deleteConsortiumById(consortiumId);
      });
  }

  leaveConsortium = (consortiumId) => {
    const { removeCollectionsFromAssociatedConsortia, leaveConsortium } = this.props;

    removeCollectionsFromAssociatedConsortia(consortiumId, true)
      .then(() => {
        leaveConsortium(consortiumId);
      });
  }

  startPipeline = (consortiumId, activePipelineId) => {
    const {
      client,
      router,
      getCollectionFiles,
      notifyWarning,
      notifyInfo,
      incrementRunCount,
      saveLocalRun,
      createRun,
    } = this.props;

    let isRemotePipeline = false;
    const pipelineData = client.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });
    const pipeline = pipelineData.fetchAllPipelines
      .find(pipe => pipe.id === activePipelineId);

    for (let i = 0; i < pipeline.steps.length; i += 1) {
      if (pipeline.steps[i].controller.type === 'decentralized') {
        isRemotePipeline = true;
        break;
      }
    }

    // Don't send local pipelines to Rethink
    if (!isRemotePipeline) {
      const data = client.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
      const consortium = data.fetchAllConsortia.find(cons => cons.id === consortiumId);
      let run = {
        id: `local-${shortid.generate()}`,
        clients: [...consortium.members],
        consortiumId,
        pipelineSnapshot: pipeline,
        startDate: Date.now(),
        type: 'local',
        results: null,
        endDate: null,
        userErrors: null,
        __typename: 'Run',
      };

      let status = 'started';
      return getCollectionFiles(
        consortiumId,
        consortium.name,
        run.pipelineSnapshot.steps
      ).then((filesArray) => {
        if ('error' in filesArray) {
          status = 'needs-map';
          notifyWarning({
            message: filesArray.error,
            autoDismiss: 5,
          });
        } else {
          notifyInfo({
            message: `Local Pipeline Starting for ${consortium.name}.`,
            action: {
              label: 'Watch Progress',
              callback: () => {
                router.push('dashboard');
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

          run.status = status;

          incrementRunCount(consortiumId);
          ipcRenderer.send('start-pipeline', {
            consortium,
            pipeline,
            filesArray: filesArray.allFiles,
            run,
          });
        }

        saveLocalRun({ ...run, status });
      });
    }

    // If remote pipeline, call GraphQL to create new pipeline
    createRun(consortiumId);
  }

  joinConsortium = (consortiumId, activePipelineId) => {
    const {
      client,
      pipelines,
      pullComputations,
      saveAssociatedConsortia,
      joinConsortium,
      notifyInfo,
      router,
    } = this.props;

    if (activePipelineId) {
      const computationData = client.readQuery({ query: FETCH_ALL_COMPUTATIONS_QUERY });
      const pipeline = pipelines.find(cons => cons.id === activePipelineId);

      const computations = pipeline.steps.map((step) => {
        const compObject = computationData.fetchAllComputations
          .find(comp => comp.id === step.computations[0].id);

        return {
          img: compObject.computation.dockerImage,
          compId: compObject.id,
          compName: compObject.meta.name,
        };
      });

      pullComputations({ consortiumId, computations });
      notifyInfo({
        message: 'Pipeline computations downloading via Docker.',
        autoDismiss: 5,
        action: {
          label: 'View Docker Download Progress',
          callback: () => {
            router.push('/dashboard/computations');
          },
        },
      });
    }

    saveAssociatedConsortia({ id: consortiumId, activePipelineId });
    joinConsortium(consortiumId);
  }

  render() {
    const {
      auth,
      associatedConsortia,
      consortia,
      pipelines,
    } = this.props;

    return (
      <ConsortiaList
        loggedInUser={auth.user}
        associatedConsortia={associatedConsortia}
        consortia={consortia}
        pipelines={pipelines}
        deleteConsortium={this.deleteConsortium}
        joinConsortium={this.joinConsortium}
        leaveConsortium={this.leaveConsortium}
        startPipeline={this.startPipeline}
      />
    );
  }
}

ConsortiaListContainer.propTypes = {
  associatedConsortia: PropTypes.array.isRequired,
  auth: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  createRun: PropTypes.func.isRequired,
  deleteConsortiumById: PropTypes.func.isRequired,
  getCollectionFiles: PropTypes.func.isRequired,
  getAllAssociatedConsortia: PropTypes.func.isRequired,
  incrementRunCount: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifyWarning: PropTypes.func.isRequired,
  pipelines: PropTypes.array.isRequired,
  pullComputations: PropTypes.func.isRequired,
  removeCollectionsFromAssociatedConsortia: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired,
  saveAssociatedConsortia: PropTypes.func.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
};

const ConsortiaListContainerWithData = compose(
  graphql(CREATE_RUN_MUTATION, {
    props: ({ mutate }) => ({
      createRun: consortiumId => mutate({
        variables: { consortiumId },
      }),
    }),
  }),
  graphql(DELETE_CONSORTIUM_MUTATION, {
    props: ({ mutate }) => ({
      deleteConsortiumById: consortiumId => mutate({
        variables: { consortiumId },
      }),
    }),
  }),
  graphql(JOIN_CONSORTIUM_MUTATION, {
    props: ({ mutate }) => ({
      joinConsortium: consortiumId => mutate({
        variables: { consortiumId },
      }),
    }),
  }),
  graphql(LEAVE_CONSORTIUM_MUTATION, {
    props: ({ mutate }) => ({
      leaveConsortium: consortiumId => mutate({
        variables: { consortiumId },
      }),
    }),
  }),
  withApollo
)(ConsortiaListContainer);

const mapStateToProps = ({ auth, collections: { associatedConsortia } }) => {
  return { auth, associatedConsortia };
};

export default connect(mapStateToProps,
  {
    getCollectionFiles,
    getAllAssociatedConsortia,
    incrementRunCount,
    notifyInfo,
    notifyWarning,
    pullComputations,
    removeCollectionsFromAssociatedConsortia,
    saveAssociatedConsortia,
    saveLocalRun,
    updateUserPerms,
  })(ConsortiaListContainerWithData);
