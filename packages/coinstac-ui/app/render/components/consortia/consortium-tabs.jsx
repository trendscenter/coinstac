import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { graphql, compose } from 'react-apollo';
import ConsortiumAbout from './consortium-about';
import ConsortiumPipeline from './consortium-pipeline';
import ConsortiumRuns from './consortium-runs';
import { updateUserPerms } from '../../state/ducks/auth';
import { saveAssociatedConsortia } from '../../state/ducks/collections';
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
import { notifySuccess } from '../../state/ducks/notifyAndLog';

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
    };

    this.state = {
      consortium,
      unsubscribeConsortia: null,
      unsubscribeUsers: null,
      selectedTabIndex: 0,
    };

    this.getConsortiumRuns = this.getConsortiumRuns.bind(this);
    this.addMemberToConsortium = this.addMemberToConsortium.bind(this);
    this.removeMemberFromConsortium = this.removeMemberFromConsortium.bind(this);
    this.saveConsortium = this.saveConsortium.bind(this);
    this.updateConsortium = this.updateConsortium.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {

    const tabId = parseInt(this.props.params.tabId);
    if (this.props.params.tabId && tabId !== this.state.selectedTabIndex) {
      this.handleSelect(null, tabId);
    }

    if (this.state.consortium.id && !this.state.unsubscribeConsortia) {
      this.setState({
        unsubscribeConsortia: this.props.subscribeToConsortia(this.state.consortium.id),
      });
    }

    if (nextProps.users && !this.state.unsubscribeUsers) {
      this.setState({ unsubscribeUsers: this.props.subscribeToUsers(null) });
    }

    if (nextProps.activeConsortium) {
      const { activeConsortium: { __typename, ...other } } = nextProps;
      if (this.props.routes[3].path !== 'new' || (this.props.routes[3].path === 'new' && this.state.consortium.id) ) {
        const consortiumUsers = this.getConsortiumUsers(other);
        this.setState({ consortium: { ...other }, consortiumUsers });
      }
    }
  }

  componentWillUnmount() {
    if (this.state.unsubscribeConsortia) {
      this.state.unsubscribeConsortia();
    }

    if (this.state.unsubscribeUsers) {
      this.state.unsubscribeUsers();
    }
  }

  getConsortiumUsers = consortium => {
    let consortiumUsers = [];

    consortium.owners.forEach(user => consortiumUsers.push({ id: user, owner: true, member: true }));
    consortium.members
      .filter(user => consortiumUsers.findIndex(consUser => consUser.id === user) === -1)
      .forEach(user => consortiumUsers.push({ id: user, member: true }));

    return consortiumUsers;
  }

  addMemberToConsortium(userId) {
    this.props.addUserRole(userId, 'consortia', this.state.consortium.id, 'member');
  }

  getConsortiumRuns() {
    return (
      this.props.runs.filter(run => run.consortiumId === this.state.consortium.id)
    );
  }

  handleSelect(event, value) {
    this.setState({ selectedTabIndex: value });
  }

  removeMemberFromConsortium(user) {
    return () => {
      this.props.removeUserRole(user.id, 'consortia', this.state.consortium.id, 'owner');
      this.props.removeUserRole(user.id, 'consortia', this.state.consortium.id, 'member');
    };
  }

  saveConsortium(e) {
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

    this.props.saveConsortium(this.state.consortium)
    .then(({ data: { saveConsortium: { __typename, ...other } } }) => {
      let unsubscribeConsortia = this.state.unsubscribeConsortia;

      this.props.saveAssociatedConsortia({ ...other });

      if (!unsubscribeConsortia) {
        unsubscribeConsortia = this.props.subscribeToConsortia(other.id);
      }

      const consortiumUsers = this.getConsortiumUsers(other);

      this.setState({
        consortium: { ...other },
        consortiumUsers,
        unsubscribeConsortia
      });

      this.props.notifySuccess({
        message: 'Consortium Saved',
        autoDismiss: 5,
        action: {
          label: 'View Consortia List',
          callback: () => {
            this.props.router.push('/dashboard/consortia/');
          },
        },
      });
    })
    .catch(({ graphQLErrors }) => {
      console.log(graphQLErrors);
    });
  }

  updateConsortium(update) {
    this.setState(prevState => ({
      consortium: { ...prevState.consortium, [update.param]: update.value },
    }));
  }

  render() {
    const {
      users,
      params,
      addUserRole,
      removeUserRole,
      pipelines,
      consortia,
      classes,
    } = this.props;
    const { user } = this.props.auth;
    const { selectedTabIndex, consortium, consortiumUsers } = this.state;

    const title = this.state.consortium.id
      ? 'Consortium Edit'
      : 'Consortium Creation';

    const isOwner = consortium.owners.indexOf(user.id) > -1
      || !params.consortiumId;

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4" className={classes.title}>
            {title}
          </Typography>
        </div>
        <Tabs
          value={selectedTabIndex}
          onChange={this.handleSelect}
          id="consortium-tabs"
        >
          <Tab label="About" />
          <Tab label="Pipelines" />
          { isOwner && <Tab label="Runs" /> }
        </Tabs>
        {
          selectedTabIndex === 0
          && (
            <ConsortiumAbout
              addUserRole={addUserRole}
              removeUserRole={removeUserRole}
              consortium={consortium}
              consortiumUsers={consortiumUsers}
              addMemberToConsortium={this.addMemberToConsortium}
              removeMemberFromConsortium={this.removeMemberFromConsortium}
              saveConsortium={this.saveConsortium}
              updateConsortium={this.updateConsortium}
              owner={isOwner}
              user={user}
              users={users}
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
  activeConsortium: null,
  consortia: null,
  runs: null,
  subscribeToConsortia: null,
  subscribeToUsers: null,
};

ConsortiumTabs.propTypes = {
  activeConsortium: PropTypes.object,
  addUserRole: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  notifySuccess: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  runs: PropTypes.array,
  saveAssociatedConsortia: PropTypes.func.isRequired,
  saveConsortium: PropTypes.func.isRequired,
  subscribeToConsortia: PropTypes.func,
  subscribeToUsers: PropTypes.func,
};

function mapStateToProps({ auth }) {
  return { auth };
}

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
    saveAssociatedConsortia,
    updateUserPerms,
  }
)(ConsortiumTabsWithData);

export default withStyles(styles)(connectedComponent);
