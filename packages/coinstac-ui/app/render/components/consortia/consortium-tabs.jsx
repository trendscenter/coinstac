import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
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

  getConsortiumUsers = (consortium) => {
    const ownersIds = consortium.owners.reduce((acc, user) => {
      let userID = Object.keys(user)[0];
      acc[userID] = true;
      return acc;
    }, {});

    let consortiumUsers = consortium.owners
      .map((user) => {
          let userID = Object.keys(user)[0];
          let userName = user[userID];
          return ({ id: userID, name: userName, owner: true, member: true });
        }
      )
      .concat(
        consortium.members
          .filter((user) => {
            let userID = Object.keys(user)[0];
            if(Object.prototype.hasOwnProperty.call(ownersIds, userID) === false){
              return true;
            }else{
              return false;
            }
          })
          .map((user) => {
              let userID = Object.keys(user)[0];
              let userName = user[userID];
              return ({ id: userID, name: userName, owner: false, member: true });
            }
          )
      );

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

    this.setState({ savingStatus: 'pending' });

    this.props.saveConsortium(this.state.consortium)
    .then(({ data: { saveConsortium: { __typename, ...other } } }) => {
      let unsubscribeConsortia = this.state.unsubscribeConsortia;

      if (!unsubscribeConsortia) {
        unsubscribeConsortia = this.props.subscribeToConsortia(other.id);
      }

      const consortiumUsers = this.getConsortiumUsers(other);

      this.setState({
        consortium: { ...other },
        consortiumUsers,
        unsubscribeConsortia,
        savingStatus: 'success',
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
      this.setState({
        savingStatus: 'fail',
      })

      this.props.notifyError({
        message: get(graphQLErrors, '0.message', 'Failed to save consortium')
      })
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
      params,
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

    const isOwner = (user, consortium) => {
      let res = false;
      Object.values(consortium.owners).map((item) => {
        if(Object.keys(item).indexOf(userId) !== -1){
          res = true;
          return;
        }
      });
      return res;
    };

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
              addMemberToConsortium={this.addMemberToConsortium}
              removeMemberFromConsortium={this.removeMemberFromConsortium}
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
    )
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
  addUserRole: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  notifySuccess: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  runs: PropTypes.array,
  saveConsortium: PropTypes.func.isRequired,
  subscribeToConsortia: PropTypes.func,
  subscribeToUsers: PropTypes.func,
  classes: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
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
    notifyError,
    updateUserPerms,
  }
)(ConsortiumTabsWithData);

export default withStyles(styles)(connectedComponent);
