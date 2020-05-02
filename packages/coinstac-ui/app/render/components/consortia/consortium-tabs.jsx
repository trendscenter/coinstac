import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Tab, Tabs, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { graphql, compose } from 'react-apollo';
import ConsortiumAbout from './consortium-about';
import ConsortiumPipeline from './consortium-pipeline';
import ConsortiumRuns from './consortium-runs';
import { updateUserPerms } from '../../state/ducks/auth';
import {
  getAllAndSubProp,
  getSelectAndSubProp,
  saveDocumentProp,
  userRolesProp,
} from '../../state/graphql/props';
import {
  ADD_USER_ROLE_MUTATION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_USERS_QUERY,
  FETCH_CONSORTIUM_QUERY,
  REMOVE_USER_ROLE_MUTATION,
  SAVE_CONSORTIUM_MUTATION,
  USER_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import { notifySuccess, notifyError } from '../../state/ducks/notifyAndLog';

const styles = theme => ({
  title: {
    marginBottom: theme.spacing.unit,
  },
});

class ConsortiumTabs extends Component {
  constructor(props) {
    super(props);

    const consortium = {
      name: '',
      description: '',
      members: [],
      owners: [],
      activePipelineId: '',
      activeComputationInputs: [],
      tags: [],
      isPrivate: false,
    };

    this.state = {
      consortium,
      unsubscribeConsortia: null,
      unsubscribeUsers: null,
      selectedTabIndex: 0,
      savingStatus: 'init',
    };

    this.getConsortiumRuns = this.getConsortiumRuns.bind(this);
    this.saveConsortium = this.saveConsortium.bind(this);
    this.updateConsortium = this.updateConsortium.bind(this);
  }

  // eslint-disable-next-line
  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      params, subscribeToConsortia, subscribeToUsers, routes,
    } = this.props;
    const {
      consortium, selectedTabIndex, unsubscribeConsortia, unsubscribeUsers,
    } = this.state;

    const tabId = parseInt(params.tabId, 10);

    if (tabId && tabId !== selectedTabIndex) {
      this.handleSelect(null, tabId);
    }

    if (consortium.id && !unsubscribeConsortia) {
      this.setState({
        unsubscribeConsortia: subscribeToConsortia(consortium.id),
      });
    }

    if (nextProps.users && !unsubscribeUsers) {
      this.setState({ unsubscribeUsers: subscribeToUsers(null) });
    }

    if (nextProps.activeConsortium) {
      const { activeConsortium: { __typename, ...other } } = nextProps;
      if (routes[3].path !== 'new' || (routes[3].path === 'new' && consortium.id)) {
        const consortiumUsers = this.getConsortiumUsers(other);
        this.setState({ consortium: { ...other }, consortiumUsers });
      }
    }
  }

  componentWillUnmount() {
    const { unsubscribeConsortia, unsubscribeUsers } = this.state;
    if (unsubscribeConsortia) {
      unsubscribeConsortia();
    }

    if (unsubscribeUsers) {
      unsubscribeUsers();
    }
  }

  getConsortiumUsers = (consortium) => {
    const consortiumUsers = consortium.owners.map((user) => {
      const userID = Object.keys(user)[0];
      const userName = user[userID];
      return ({
        id: userID, name: userName, owner: true, member: true,
      });
    });

    consortium.members
      .filter(userId => consortiumUsers.findIndex(consUser => consUser.id === userId) === -1)
      .forEach((user) => {
        const userID = Object.keys(user)[0];
        const userName = user[userID];

        consortiumUsers.push({
          id: userID, name: userName, owner: false, member: true,
        });
      });

    return consortiumUsers;
  }

  getConsortiumRuns() {
    const { runs } = this.props;
    const { consortium } = this.state;

    return (
      runs.filter(run => run.consortiumId === consortium.id)
    );
  }

  handleSelect= (_event, value) => {
    this.setState({ selectedTabIndex: value });
  }

  saveConsortium(e) {
    const {
      saveConsortium, subscribeToConsortia, notifySuccess, notifyError,
    } = this.props;
    const { consortium, unsubscribeConsortia } = this.state;

    e.preventDefault();

    /* This is creating a duplicate consortia owner. Why is this here?
    //
    if (this.state.consortium.owners.indexOf(this.props.auth.user.id) === -1) {
      this.setState(prevState => ({
        owners: prevState.consortium.owners.push(this.props.auth.user.id),
      }));
    }
    //
    */

    this.setState({ savingStatus: 'pending' });

    saveConsortium(consortium)
      .then(({ data: { saveConsortium: { __typename, ...other } } }) => {
        const consortiumUsers = this.getConsortiumUsers(other);

        this.setState({
          consortium: { ...other },
          consortiumUsers,
          unsubscribeConsortia: unsubscribeConsortia || subscribeToConsortia(other.id),
          savingStatus: 'success',
        });

        notifySuccess('Consortium Saved');
      })
      .catch(({ graphQLErrors }) => {
        this.setState({
          savingStatus: 'fail',
        });

        notifyError(get(graphQLErrors, '0.message', 'Failed to save consortium'));
      });
  }

  updateConsortium(update) {
    this.setState(prevState => ({
      consortium: { ...prevState.consortium, [update.param]: update.value },
    }));
  }

  getTabIndex = () => {
    const { auth, params } = this.props;
    const { selectedTabIndex, consortium } = this.state;
    const isEditingConsortium = !!consortium.id;

    const isOwner = consortium.owners.indexOf(auth.user.id) > -1
      || !params.consortiumId;


    if (selectedTabIndex === 1) {
      if (!isEditingConsortium) {
        return 0;
      }
    } else if (selectedTabIndex === 2) {
      if (!isEditingConsortium || !isOwner) {
        return 0;
      }
    }

    return selectedTabIndex;
  }

  render() {
    const {
      auth,
      users,
      addUserRole,
      removeUserRole,
      pipelines,
      consortia,
      classes,
    } = this.props;

    const { user } = auth;
    const {
      selectedTabIndex,
      consortium,
      consortiumUsers,
      savingStatus,
    } = this.state;

    const isEditingConsortium = !!consortium.id;

    const title = isEditingConsortium
      ? 'Consortium Edit'
      : 'Consortium Creation';

    const isOwner = consortium.owners.findIndex(user => Object.keys(user)[0] === user.id) > -1
      || !isEditingConsortium;

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4" className={classes.title}>
            {title}
          </Typography>
        </div>
        <Tabs
          value={this.getTabIndex()}
          onChange={this.handleSelect}
          id="consortium-tabs"
        >
          <Tab label="About" />
          { isEditingConsortium && <Tab label="Pipelines" /> }
          { isEditingConsortium && isOwner && <Tab label="Runs" /> }
        </Tabs>
        {
          selectedTabIndex === 0
          && (
            <ConsortiumAbout
              addUserRole={addUserRole}
              removeUserRole={removeUserRole}
              consortium={consortium}
              consortiumUsers={consortiumUsers}
              saveConsortium={this.saveConsortium}
              updateConsortium={this.updateConsortium}
              owner={isOwner}
              user={user}
              users={users}
              savingStatus={savingStatus}
            />
          )
        }
        {
          selectedTabIndex === 1
          && (
            <ConsortiumPipeline
              consortium={consortium}
              owner={isOwner}
              pipelines={pipelines}
            />
          )
        }
        {
          selectedTabIndex === 2
          && (
            <ConsortiumRuns
              runs={this.getConsortiumRuns()}
              consortia={consortia}
              owner={isOwner}
            />
          )
        }
      </div>
    );
  }
}

ConsortiumTabs.defaultProps = {
  activeConsortium: null, // eslint-disable-line react/default-props-match-prop-types
  consortia: [],
  runs: [],
  subscribeToConsortia: null,
  subscribeToUsers: null,
  users: [],
};

ConsortiumTabs.propTypes = {
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  params: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
  routes: PropTypes.array.isRequired,
  runs: PropTypes.array,
  users: PropTypes.array,
  addUserRole: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  saveConsortium: PropTypes.func.isRequired,
  subscribeToConsortia: PropTypes.func,
  subscribeToUsers: PropTypes.func,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

const ConsortiumTabsWithData = compose(
  graphql(FETCH_CONSORTIUM_QUERY, getSelectAndSubProp(
    'activeConsortium',
    CONSORTIUM_CHANGED_SUBSCRIPTION,
    'consortiumId',
    'subscribeToConsortia',
    'consortiumChanged',
    'fetchConsortium'
  )),
  graphql(FETCH_ALL_USERS_QUERY, getAllAndSubProp(
    USER_CHANGED_SUBSCRIPTION,
    'users',
    'fetchAllUsers',
    'subscribeToUsers',
    'userChanged'
  )),
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(SAVE_CONSORTIUM_MUTATION, saveDocumentProp('saveConsortium', 'consortium')),
  graphql(REMOVE_USER_ROLE_MUTATION, userRolesProp('removeUserRole'))
)(ConsortiumTabs);

const connectedComponent = connect(
  mapStateToProps,
  {
    notifySuccess,
    notifyError,
    updateUserPerms,
  }
)(ConsortiumTabsWithData);

export default withStyles(styles)(connectedComponent);
