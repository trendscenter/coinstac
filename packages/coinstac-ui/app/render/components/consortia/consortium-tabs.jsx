import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tab, Tabs, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { graphql, compose } from 'react-apollo';
import ConsortiumAbout from './consortium-about';
import ConsortiumPipeline from './consortium-pipeline';
import ConsortiumRuns from './consortium-runs';
import { updateUserPerms } from '../../state/ducks/auth';
import {
  getAllAndSubProp,
  saveDocumentProp,
  userRolesProp,
} from '../../state/graphql/props';
import {
  ADD_USER_ROLE_MUTATION,
  FETCH_ALL_USERS_QUERY,
  REMOVE_USER_ROLE_MUTATION,
  SAVE_CONSORTIUM_MUTATION,
  USER_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import { notifySuccess, notifyError } from '../../state/ducks/notifyAndLog';
import { getGraphQLErrorMessage } from '../../utils/helpers';

const styles = theme => ({
  title: {
    marginBottom: theme.spacing(1),
  },
});

class ConsortiumTabs extends Component {
  constructor(props) {
    super(props);

    const consortium = {
      name: '',
      description: '',
      members: {},
      owners: {},
      activePipelineId: '',
      activeComputationInputs: [],
      tags: [],
      isPrivate: false,
    };

    this.state = {
      consortium,
      selectedTabIndex: 0,
      selectedInitialTab: false,
      savingStatus: 'init',
    };

    this.getConsortiumRuns = this.getConsortiumRuns.bind(this);
    this.saveConsortium = this.saveConsortium.bind(this);
    this.updateConsortium = this.updateConsortium.bind(this);
  }

  componentDidMount() {
    const { consortia, params, subscribeToUsers } = this.props;

    if (params.consortiumId) {
      const { __typename, ...consortium } = consortia.find(c => c.id === params.consortiumId);
      const consortiumUsers = this.getConsortiumUsers(consortium);

      this.setState({
        consortium: { ...consortium },
        consortiumUsers,
      });
    }

    this.unsubscribeUsers = subscribeToUsers(null);
  }

  componentDidUpdate(prevProps) {
    const { params, consortia } = this.props;
    const { selectedTabIndex, selectedInitialTab, consortium } = this.state;

    if (!selectedInitialTab) {
      const tabId = parseInt(params.tabId, 10);

      if (tabId && tabId !== selectedTabIndex) {
        this.handleSelect(null, tabId);
      }
    }

    if (consortium.id) {
      const prevRemoteConsortium = prevProps.consortia.find(c => c.id === consortium.id);
      const remoteConsortium = consortia.find(c => c.id === consortium.id);

      if (remoteConsortium && prevRemoteConsortium && (
        Object.keys(prevRemoteConsortium.members).length
          !== Object.keys(remoteConsortium.members).length
        || Object.keys(prevRemoteConsortium.owners).length
          !== Object.keys(remoteConsortium.owners).length
      )) {
        const consortiumUsers = this.getConsortiumUsers(remoteConsortium);

        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({
          consortiumUsers,
        });
      }
    }
  }

  componentWillUnmount() {
    this.unsubscribeUsers();
  }

  getConsortiumUsers = (consortium) => {
    const consortiumUsers = Object.keys(consortium.owners).map(userId => ({
      id: userId, name: consortium.owners[userId], owner: true, member: true,
    }));

    Object.keys(consortium.members)
      .forEach((userId) => {
        if (userId in consortium.owners) {
          return;
        }

        consortiumUsers.push({
          id: userId, name: consortium.members[userId], owner: false, member: true,
        });
      });

    return consortiumUsers.sort((a, b) => a.id.localeCompare(b.id));
  }

  getConsortiumRuns() {
    const { runs } = this.props;
    const { consortium } = this.state;

    return (
      runs.filter(run => run.consortiumId === consortium.id)
    );
  }

  handleSelect = (_, value) => {
    this.setState({ selectedTabIndex: value, selectedInitialTab: true });
  }

  getTabIndex = () => {
    const { auth, params } = this.props;
    const { selectedTabIndex, consortium } = this.state;
    const isEditingConsortium = !!consortium.id;

    const isOwner = auth.user.id in consortium.owners || !params.consortiumId;

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

  saveConsortium(e) {
    const {
      saveConsortium, notifySuccess, notifyError,
    } = this.props;
    const { consortium: { __typename, ...consortium } } = this.state;

    e.preventDefault();

    this.setState({ savingStatus: 'pending' });

    saveConsortium(consortium)
      .then(({ data: { saveConsortium: { __typename, ...other } } }) => {
        const consortiumUsers = this.getConsortiumUsers(other);

        this.setState({
          consortium: { ...other },
          consortiumUsers,
          savingStatus: 'success',
        });

        notifySuccess('Consortium Saved');
      })
      .catch((error) => {
        this.setState({
          savingStatus: 'fail',
        });

        notifyError(getGraphQLErrorMessage(error, 'Failed to save consoritum'));
      });
  }

  updateConsortium(update) {
    this.setState(prevState => ({
      consortium: { ...prevState.consortium, [update.param]: update.value },
    }));
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

    const isOwner = user.id in consortium.owners || !isEditingConsortium;

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
  consortia: [],
  runs: [],
  subscribeToUsers: null,
  users: [],
};

ConsortiumTabs.propTypes = {
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  params: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
  runs: PropTypes.array,
  users: PropTypes.array,
  addUserRole: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  saveConsortium: PropTypes.func.isRequired,
  subscribeToUsers: PropTypes.func,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

const ConsortiumTabsWithData = compose(
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
