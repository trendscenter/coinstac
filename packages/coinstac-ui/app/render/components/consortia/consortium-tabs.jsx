import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
import ConsortiumAbout from './consortium-about';
import ConsortiumPipeline from './consortium-pipeline';
import ConsortiumRuns from './consortium-runs';
import { updateUserPerms } from '../../state/ducks/auth';
import { saveAssociatedConsortia } from '../../state/ducks/collections';
import {
  consortiaMembershipProp,
  getSelectAndSubProp,
  saveDocumentProp,
  userRolesProp,
} from '../../state/graphql/props';
import {
  ADD_USER_ROLE_MUTATION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_CONSORTIUM_QUERY,
  LEAVE_CONSORTIUM_MUTATION,
  REMOVE_USER_ROLE_MUTATION,
  SAVE_CONSORTIUM_MUTATION,
} from '../../state/graphql/functions';
import { notifyInfo, notifyWarning } from '../../state/ducks/notifyAndLog';

const styles = {
  tab: {
    marginTop: 10,
  },
};

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
    };
    this.getConsortiumRuns = this.getConsortiumRuns.bind(this);
    this.removeMemberFromConsortium = this.removeMemberFromConsortium.bind(this);
    this.saveConsortium = this.saveConsortium.bind(this);
    this.updateConsortium = this.updateConsortium.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.consortium.id && !this.state.unsubscribeConsortia) {
      this.setState({
        unsubscribeConsortia: this.props.subscribeToConsortia(this.state.consortium.id),
      });
    }

    if (nextProps.activeConsortium) {
      const { activeConsortium: { __typename, ...other } } = nextProps;
      this.setState({ consortium: { ...other } });
    }
  }

  componentWillUnmount() {
    if (this.state.unsubscribeConsortia) {
      this.state.unsubscribeConsortia();
    }
  }

  getConsortiumRuns() {
    return (
      this.props.runs.filter(run => run.consortiumId === this.state.consortium.id)
    );
  }

  removeMemberFromConsortium(userId) {
    return () => {
      this.props.leaveConsortium(this.state.consortium.id, userId);
      this.props.removeUserRole(userId, 'consortia', this.state.consortium.id, 'member');
    };
  }

  saveConsortium(e) {
    e.preventDefault();

    if (this.state.consortium.owners.indexOf(this.props.auth.user.id) === -1) {
      this.setState(prevState => ({
        owners: prevState.consortium.owners.push(this.props.auth.user.id),
      }));
    }

    this.props.saveConsortium(this.state.consortium)
    .then(({ data: { saveConsortium: { __typename, ...other } } }) => {
      this.props.addUserRole(this.props.auth.user.id, 'consortia', other.id, 'owner');
      let unsubscribeConsortia = this.state.unsubscribeConsortia;

      this.props.saveAssociatedConsortia({ ...other });

      if (!unsubscribeConsortia) {
        unsubscribeConsortia = this.props.subscribeToConsortia(other.id);
      }

      this.setState({
        consortium: { ...other },
        unsubscribeConsortia,
      });

      this.props.notifyInfo({
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
    const { user } = this.props.auth;
    const title = this.state.consortium.id
      ? 'Consortium Edit'
      : 'Consortium Creation';

    let isOwner = false;
    if (this.state.consortium.owners.indexOf(user.id) > -1 || !this.props.params.consortiumId) {
      isOwner = true;
    }

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">{title}</h1>
        </div>
        <Tabs defaultActiveKey={1} id="consortium-tabs">
          <Tab eventKey={1} title="About" style={styles.tab}>
            <ConsortiumAbout
              consortium={this.state.consortium}
              removeMemberFromConsortium={this.removeMemberFromConsortium}
              saveConsortium={this.saveConsortium}
              updateConsortium={this.updateConsortium}
              owner={isOwner}
            />
          </Tab>
          <Tab
            eventKey={2}
            title="Pipelines"
            disabled={typeof this.state.consortium.id === 'undefined'}
            style={styles.tab}
          >
            <ConsortiumPipeline
              consortium={this.state.consortium}
              owner={isOwner}
              pipelines={this.props.pipelines}
            />
          </Tab>
          {isOwner &&
            <Tab
              eventKey={3}
              title="Runs"
              disabled={typeof this.state.consortium.id === 'undefined'}
              style={styles.tab}
            >
              <ConsortiumRuns
                runs={this.getConsortiumRuns()}
                consortia={this.props.consortia}
                owner={isOwner}
              />
            </Tab>
          }
        </Tabs>
      </div>
    );
  }
}

ConsortiumTabs.defaultProps = {
  activeConsortium: null,
  consortia: null,
  runs: null,
  subscribeToConsortia: null,
};

ConsortiumTabs.propTypes = {
  activeConsortium: PropTypes.object,
  addUserRole: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  leaveConsortium: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  runs: PropTypes.array,
  saveAssociatedConsortia: PropTypes.func.isRequired,
  saveConsortium: PropTypes.func.isRequired,
  subscribeToConsortia: PropTypes.func,
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
  graphql(LEAVE_CONSORTIUM_MUTATION, consortiaMembershipProp('leaveConsortium')),
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(SAVE_CONSORTIUM_MUTATION, saveDocumentProp('saveConsortium', 'consortium')),
  graphql(REMOVE_USER_ROLE_MUTATION, userRolesProp('removeUserRole'))
)(ConsortiumTabs);

export default connect(
  mapStateToProps,
  {
    notifyInfo,
    notifyWarning,
    saveAssociatedConsortia,
    updateUserPerms,
  }
)(ConsortiumTabsWithData);
