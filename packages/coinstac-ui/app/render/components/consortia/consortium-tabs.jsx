import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
import ConsortiumAbout from './consortium-about';
import ConsortiumPipeline from './consortium-pipeline';
import ConsortiumResults from './consortium-results';
import { updateUserPerms } from '../../state/ducks/auth';
import {
  getSelectAndSubProp,
  saveConsortiumProp,
  userRolesProp,
} from '../../state/graphql/props';
import {
  ADD_USER_ROLE_MUTATION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_CONSORTIUM_QUERY,
  SAVE_CONSORTIUM_MUTATION,
} from '../../state/graphql/functions';

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

      // TODO: hook activePipelineId and Inputs
      this.setState({ consortium: { ...other } });
      // TODO: Use redux to display success/failure messages after mutations
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
    const title = this.state.consortium.id
      ? 'Consortium Edit'
      : 'Consortium Creation';

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">{title}</h1>
        </div>
        <Tabs defaultActiveKey={1} id="consortium-tabs">
          <Tab eventKey={1} title="About" style={styles.tab}>
            <ConsortiumAbout
              consortium={this.state.consortium}
              saveConsortium={this.saveConsortium}
              updateConsortium={this.updateConsortium}
              owner={
                !this.props.params.consortiumId ||
                this.state.consortium.owners.indexOf(this.props.auth.user.id) !== -1
              }
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
              owner={
                !this.props.params.consortiumId ||
                this.state.consortium.owners.indexOf(this.props.auth.user.id) !== -1
              }
            />
          </Tab>
          <Tab
            eventKey={3}
            title="Results"
            disabled={typeof this.state.consortium.id === 'undefined'}
            style={styles.tab}
          >
            <ConsortiumResults
              consortium={this.state.consortium}
            />
          </Tab>
        </Tabs>
      </div>
    );
  }
}

ConsortiumTabs.defaultProps = {
  subscribeToConsortia: null,
};

ConsortiumTabs.propTypes = {
  addUserRole: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
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
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(SAVE_CONSORTIUM_MUTATION, saveConsortiumProp)
)(ConsortiumTabs);

export default connect(mapStateToProps, { updateUserPerms })(ConsortiumTabsWithData);
