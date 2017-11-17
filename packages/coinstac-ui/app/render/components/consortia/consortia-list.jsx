import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Alert, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';
import ListItem from '../common/list-item';
import { updateUserPerms } from '../../state/ducks/auth';
import {
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  DELETE_CONSORTIUM_MUTATION,
  JOIN_CONSORTIUM_MUTATION,
  LEAVE_CONSORTIUM_MUTATION,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  ADD_USER_ROLE_MUTATION,
  REMOVE_USER_ROLE_MUTATION,
} from '../../state/graphql/functions';
import {
  consortiaMembershipProp,
  deleteConsortiumProp,
  getAllAndSubProp,
  pipelinesProp,
  userRolesProp,
} from '../../state/graphql/props';

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

class ConsortiaList extends Component {
  constructor(props) {
    super(props);

    this.state = { unsubscribeConsortia: null };

    this.getOptions = this.getOptions.bind(this);
    this.deleteConsortium = this.deleteConsortium.bind(this);
    this.joinConsortium = this.joinConsortium.bind(this);
    this.leaveConsortium = this.leaveConsortium.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.consortia && !this.state.unsubscribeConsortia) {
      this.setState({ unsubscribeConsortia: this.props.subscribeToConsortia(null) });
    }
  }

  componentWillUnmount() {
    this.state.unsubscribeConsortia();
  }

  getOptions(member, owner, id) {
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
          onClick={() => this.joinConsortium(id)}
        >
          Join Consortium
        </Button>
      );
    }

    return options;
  }

  deleteConsortium(consortiumId) {
    const { auth: { user } } = this.props;

    this.props.deleteConsortium(consortiumId);
    this.props.removeUserRole(user.id, 'consortia', consortiumId, 'owner');
  }

  joinConsortium(consortiumId) {
    const { auth: { user } } = this.props;

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
      auth: { user },
      consortia,
    } = this.props;

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">Consortia</h1>
          <LinkContainer className="pull-right" to="/dashboard/consortia/new">
            <Button bsStyle="primary" className="pull-right">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              Create Consortium
            </Button>
          </LinkContainer>
        </div>
        {consortia && consortia.map(consortium => (
          <ListItem
            key={`${consortium.name}-list-item`}
            itemObject={consortium}
            deleteItem={this.deleteConsortium}
            owner={isUserA(user.id, consortium.owners)}
            itemOptions={
              this.getOptions(
                isUserA(user.id, consortium.members),
                isUserA(user.id, consortium.owners),
                consortium.id
              )
            }
            itemRoute={'/dashboard/consortia'}
          />
        ))}
        {!consortia &&
          <Alert bsStyle="info">
            No consortia found
          </Alert>
        }
      </div>
    );
  }
}

ConsortiaList.propTypes = {
  addUserRole: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  deleteConsortium: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  subscribeToConsortia: PropTypes.func.isRequired,
};

ConsortiaList.defaultProps = {
  consortia: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const ConsortiaListWithData = compose(
  graphql(FETCH_ALL_CONSORTIA_QUERY, getAllAndSubProp(
    CONSORTIUM_CHANGED_SUBSCRIPTION,
    'consortia',
    'fetchAllConsortia',
    'subscribeToConsortia',
    'consortiumChanged'
  )),
  graphql(DELETE_CONSORTIUM_MUTATION, deleteConsortiumProp),
  graphql(JOIN_CONSORTIUM_MUTATION, consortiaMembershipProp('joinConsortium')),
  graphql(LEAVE_CONSORTIUM_MUTATION, consortiaMembershipProp('leaveConsortium')),
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(REMOVE_USER_ROLE_MUTATION, userRolesProp('removeUserRole')),
  graphql(FETCH_ALL_PIPELINES_QUERY, pipelinesProp)
)(ConsortiaList);

export default connect(mapStateToProps, { updateUserPerms })(ConsortiaListWithData);
