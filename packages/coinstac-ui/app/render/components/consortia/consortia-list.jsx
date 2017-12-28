import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Alert, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';
import ApolloClient from '../../state/apollo-client';
import ListItem from '../common/list-item';
import ListDeleteModal from '../common/list-delete-modal';
import { updateUserPerms } from '../../state/ducks/auth';
import { pullComputations } from '../../state/ducks/docker';
import {
  ADD_USER_ROLE_MUTATION,
  DELETE_CONSORTIUM_MUTATION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  JOIN_CONSORTIUM_MUTATION,
  LEAVE_CONSORTIUM_MUTATION,
  REMOVE_USER_ROLE_MUTATION,
} from '../../state/graphql/functions';
import {
  consortiaMembershipProp,
  removeDocFromTableProp,
  userRolesProp,
} from '../../state/graphql/props';
import { notifyInfo } from '../../state/ducks/notifyAndLog';

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

    if (member && !owner) {
      options.push(
        <Button
          key="leave-cons-button"
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
          key="join-cons-button"
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
        key={`${consortium.name}-list-item`}
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
    const { auth: { user }, pipelines } = this.props;

    if (activePipelineId) {
      console.log('wtf');
      const computationData = ApolloClient.readQuery({ query: FETCH_ALL_COMPUTATIONS_QUERY });
      const pipeline = pipelines.find(cons => cons.id === activePipelineId);

      const computations = [];
      pipeline.steps.forEach((step) => {
        const compObject = computationData.fetchAllComputations
          .find(comp => comp.id === step.computations[0].id);
        computations.push(compObject.computation.dockerImage);
      });

      this.props.pullComputations({ consortiumId, computations });
      this.props.notifyInfo({
        message: 'Pipeline computations downloading via Docker.',
        autoDismiss: 5,
        action: {
          label: 'View Docker Download Progress',
          callback: () => {
            this.props.router.push('/dashboard/docker');
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
  consortia: PropTypes.array.isRequired,
  deleteConsortiumById: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  pipelines: PropTypes.array.isRequired,
  pullComputations: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const ConsortiaListWithData = compose(
  graphql(DELETE_CONSORTIUM_MUTATION, removeDocFromTableProp(
    'consortiumId',
    'deleteConsortiumById',
    FETCH_ALL_CONSORTIA_QUERY,
    'fetchAllConsortia'
  )),
  graphql(JOIN_CONSORTIUM_MUTATION, consortiaMembershipProp('joinConsortium')),
  graphql(LEAVE_CONSORTIUM_MUTATION, consortiaMembershipProp('leaveConsortium')),
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(REMOVE_USER_ROLE_MUTATION, userRolesProp('removeUserRole'))
)(ConsortiaList);

export default connect(mapStateToProps,
  { notifyInfo, pullComputations, updateUserPerms }
)(ConsortiaListWithData);
