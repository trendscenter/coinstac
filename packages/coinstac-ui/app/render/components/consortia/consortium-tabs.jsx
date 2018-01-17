import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
import ConsortiumAbout from './consortium-about';
import ConsortiumPipeline from './consortium-pipeline';
import ConsortiumResults from './consortium-results';
import ApolloClient from '../../state/apollo-client';
import { updateUserPerms } from '../../state/ducks/auth';
import { userRolesProp } from '../../state/graphql/props';
import {
  ADD_USER_ROLE_MUTATION,
  FETCH_ALL_CONSORTIA_QUERY,
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

    let consortium = {
      name: '',
      description: '',
      members: [],
      owners: [],
      activePipelineId: '',
      activeComputationInputs: [],
      tags: [],
    };

    if (props.params.consortiumId) {
      const data = ApolloClient.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
      consortium = data.fetchAllConsortia.find(cons => cons.id === props.params.consortiumId);
      delete consortium.__typename;
    }

    this.state = {
      consortium,
      owner: !props.params.consortiumId || consortium.owners.indexOf(props.auth.user.id) !== -1,
    };
    this.saveConsortium = this.saveConsortium.bind(this);
    this.updateConsortium = this.updateConsortium.bind(this);
  }

  saveConsortium(e) {
    e.preventDefault();

    if (this.state.consortium.owners.indexOf(this.props.auth.user.id) === -1) {
      this.setState(prevState => ({
        owners: prevState.consortium.owners.push(this.props.auth.user.id),
      }));
    }

    this.props.saveConsortium(this.state.consortium)
    .then(({ data: { saveConsortium } }) => {
      this.props.addUserRole(this.props.auth.user.id, 'consortia', saveConsortium.id, 'owner');

      // TODO: hook activePipelineId and Inputs
      this.setState({
        consortium:
        {
          id: saveConsortium.id,
          name: saveConsortium.name,
          description: saveConsortium.description,
          members: saveConsortium.members,
          owners: saveConsortium.owners,
          activePipelineId: null,
          activeComputationInputs: null,
          tags: null,

        },
      });
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
              owner={this.state.owner}
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
              owner={this.state.owner}
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

ConsortiumTabs.propTypes = {
  addUserRole: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  saveConsortium: PropTypes.func.isRequired,
};

function mapStateToProps({ auth }) {
  return { auth };
}

const ConsortiumTabsWithData = compose(
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(SAVE_CONSORTIUM_MUTATION, {
    props: ({ mutate }) => ({
      saveConsortium: consortium => mutate({
        variables: { consortium },
        update: (store, { data: { saveConsortium } }) => {
          const data = store.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
          const index = data.fetchAllConsortia.findIndex(cons => cons.id === saveConsortium.id);
          if (index > -1) {
            data.fetchAllConsortia[index] = { ...saveConsortium };
          } else {
            data.fetchAllConsortia.push(saveConsortium);
          }
          store.writeQuery({ query: FETCH_ALL_CONSORTIA_QUERY, data });
        },
      }),
    }),
  })
)(ConsortiumTabs);

export default connect(mapStateToProps, { updateUserPerms })(ConsortiumTabsWithData);
