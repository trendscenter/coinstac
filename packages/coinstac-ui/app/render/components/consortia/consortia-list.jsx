import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { Alert, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import { getCollectionFiles } from '../../state/ducks/collections';
import ListItem from '../common/list-item';
import ListDeleteModal from '../common/list-delete-modal';
import { saveLocalRun } from '../../state/ducks/runs';
import { updateUserPerms } from '../../state/ducks/auth';
import { pullComputations } from '../../state/ducks/docker';
import {
  ADD_USER_ROLE_MUTATION,
  CREATE_RUN_MUTATION,
  DELETE_CONSORTIUM_MUTATION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  JOIN_CONSORTIUM_MUTATION,
  LEAVE_CONSORTIUM_MUTATION,
  REMOVE_USER_ROLE_MUTATION,
} from '../../state/graphql/functions';
import {
  consortiaMembershipProp,
  removeDocFromTableProp,
  saveDocumentProp,
  userRolesProp,
} from '../../state/graphql/props';
import { notifyInfo, notifyWarning } from '../../state/ducks/notifyAndLog';

const MAX_LENGTH_CONSORTIA = 5;

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

class ConsortiaList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ownedConsortia: [],
      otherConsortia: [],
      consortiumToDelete: -1,
      showModal: false,
    };

    this.getOptions = this.getOptions.bind(this);
    this.getListItem = this.getListItem.bind(this);
    this.deleteConsortium = this.deleteConsortium.bind(this);
    this.joinConsortium = this.joinConsortium.bind(this);
    this.leaveConsortium = this.leaveConsortium.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.startPipeline = this.startPipeline.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const ownedConsortia = [];
    const otherConsortia = [];
    if (nextProps.consortia && nextProps.consortia.length > MAX_LENGTH_CONSORTIA) {
      nextProps.consortia.forEach((cons) => {
        if (cons.owners.indexOf(this.props.auth.user.id) > -1) {
          ownedConsortia.push(cons);
        } else {
          otherConsortia.push(cons);
        }
      });
    }
    this.setState({ ownedConsortia, otherConsortia });
  }

  getOptions(member, owner, id, activePipelineId) {
    const options = [];

    if (owner && activePipelineId) {
      options.push(
        <Button
          key={`${id}-start-pipeline-button`}
          bsStyle="success"
          onClick={this.startPipeline(id, activePipelineId)}
          style={{ marginLeft: 10 }}
        >
          Start Pipeline
        </Button>
      );
    }

    if (member && !owner) {
      options.push(
        <Button
          key={`${id}-leave-cons-button`}
          bsStyle="warning"
          className="pull-right"
          onClick={() => this.leaveConsortium(id)}
        >
          Leave Consortium
        </Button>
      );
    } else if (!member && !owner) {
      options.push(
        <Button
          key={`${id}-join-cons-button`}
          bsStyle="primary"
          className="pull-right"
          onClick={() => this.joinConsortium(id, activePipelineId)}
        >
          Join Consortium
        </Button>
      );
    }

    return options;
  }

  getListItem(consortium) {
    const { user } = this.props.auth;
    return (
      <ListItem
        key={`${consortium.id}-list-item`}
        itemObject={consortium}
        deleteItem={this.openModal}
        owner={isUserA(user.id, consortium.owners)}
        itemOptions={
          this.getOptions(
            isUserA(user.id, consortium.members),
            isUserA(user.id, consortium.owners),
            consortium.id,
            consortium.activePipelineId
          )
        }
        itemRoute={'/dashboard/consortia'}
      />
    );
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  openModal(consortiumId) {
    return () => {
      this.setState({
        showModal: true,
        consortiumToDelete: consortiumId,
      });
    };
  }

  deleteConsortium() {
    const { auth: { user } } = this.props;

    this.props.deleteConsortiumById(this.state.consortiumToDelete);
    this.props.removeUserRole(user.id, 'consortia', this.state.consortiumToDelete, 'owner');
    this.closeModal();
  }

  joinConsortium(consortiumId, activePipelineId) {
    const { auth: { user }, client, pipelines } = this.props;

    if (activePipelineId) {
      const computationData = client.readQuery({ query: FETCH_ALL_COMPUTATIONS_QUERY });
      const pipeline = pipelines.find(cons => cons.id === activePipelineId);

      const computations = [];
      pipeline.steps.forEach((step) => {
        const compObject = computationData.fetchAllComputations
          .find(comp => comp.id === step.computations[0].id);
        computations.push({
          img: compObject.computation.dockerImage,
          compId: compObject.id,
          compName: compObject.meta.name,
        });
      });

      this.props.pullComputations({ consortiumId, computations });
      this.props.notifyInfo({
        message: 'Pipeline computations downloading via Docker.',
        autoDismiss: 5,
        action: {
          label: 'View Docker Download Progress',
          callback: () => {
            this.props.router.push('/dashboard/computations');
          },
        },
      });
    }

    this.props.joinConsortium(consortiumId);
    this.props.addUserRole(user.id, 'consortia', consortiumId, 'member');
  }

  leaveConsortium(consortiumId) {
    const { auth: { user } } = this.props;

    this.props.leaveConsortium(consortiumId);
    this.props.removeUserRole(user.id, 'consortia', consortiumId, 'member');
  }

  startPipeline(consortiumId, activePipelineId) {
    return () => {
      const { client } = this.props;
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
        const run = {
          id: `local-${shortid.generate()}`,
          clients: [...consortium.members, ...consortium.owners],
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
        return this.props.getCollectionFiles(consortiumId, consortium.name, pipeline.steps)
          .then((filesArray) => {
            if (typeof filesArray === 'object' && 'error' in filesArray) {
              status = 'needs-map';
              this.props.notifyWarning({
                message: filesArray.error,
                autoDismiss: 5,
              });
            } else {
              this.props.notifyInfo({
                message: `Local Pipeline Starting for ${consortium.name}.`,
              });
              ipcRenderer.send('start-pipeline', { consortium, pipeline, filesArray, run: { ...run } });
            }

            this.props.saveLocalRun({ ...run, status });
          });
      }

      // If remote pipeline, call GraphQL to create new pipeline
      this.props.createRun(consortiumId);
    };
  }

  render() {
    const {
      consortia,
    } = this.props;
    const {
      ownedConsortia,
      otherConsortia,
    } = this.state;

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="nav-item-page-title">Consortia</h1>
          <LinkContainer className="pull-right" to="/dashboard/consortia/new">
            <Button bsStyle="primary" className="pull-right">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              Create Consortium
            </Button>
          </LinkContainer>
        </div>

        {consortia && consortia.length && consortia.length <= MAX_LENGTH_CONSORTIA
          && consortia.map(consortium => this.getListItem(consortium))
        }
        {ownedConsortia.length > 0 && <h4>Owned Consortia</h4>}
        {ownedConsortia.length > 0 &&
          ownedConsortia.map(consortium => this.getListItem(consortium))
        }
        {otherConsortia.length > 0 && <h4>Other Consortia</h4>}
        {otherConsortia.length > 0 &&
          otherConsortia.map(consortium => this.getListItem(consortium))
        }

        {(!consortia || !consortia.length) &&
          <Alert bsStyle="info">
            No consortia found
          </Alert>
        }
        <ListDeleteModal
          close={this.closeModal}
          deleteItem={this.deleteConsortium}
          itemName={'consortium'}
          show={this.state.showModal}
        />
      </div>
    );
  }
}

ConsortiaList.propTypes = {
  addUserRole: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  createRun: PropTypes.func.isRequired,
  deleteConsortiumById: PropTypes.func.isRequired,
  getCollectionFiles: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifyWarning: PropTypes.func.isRequired,
  pipelines: PropTypes.array.isRequired,
  pullComputations: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const ConsortiaListWithData = compose(
  graphql(CREATE_RUN_MUTATION, saveDocumentProp('createRun', 'consortiumId')),
  graphql(DELETE_CONSORTIUM_MUTATION, removeDocFromTableProp(
    'consortiumId',
    'deleteConsortiumById',
    FETCH_ALL_CONSORTIA_QUERY,
    'fetchAllConsortia'
  )),
  graphql(JOIN_CONSORTIUM_MUTATION, consortiaMembershipProp('joinConsortium')),
  graphql(LEAVE_CONSORTIUM_MUTATION, consortiaMembershipProp('leaveConsortium')),
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(REMOVE_USER_ROLE_MUTATION, userRolesProp('removeUserRole')),
  withApollo
)(ConsortiaList);

export default connect(mapStateToProps,
  { getCollectionFiles, notifyInfo, notifyWarning, pullComputations, saveLocalRun, updateUserPerms }
)(ConsortiaListWithData);
