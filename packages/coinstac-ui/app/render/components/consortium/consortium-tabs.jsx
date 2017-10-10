import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import { graphql } from 'react-apollo';
import ConsortiumAbout from './consortium-about';
import ConsortiumPipeline from './consortium-pipeline';
import ConsortiumResults from './consortium-results';
import ApolloClient from '../../state/apollo-client';
import { fetchAllConsortiaFunc, saveConsortiumFunc } from '../../state/graphql-queries';

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
      users: [],
      owners: [],
    };

    if (props.params.consortiumId) {
      const data = ApolloClient.readQuery({ query: fetchAllConsortiaFunc });
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
    .then((res) => {
      this.setState({ 
        consortium: 
        {
          id: res.data.saveConsortium.id,
          name: res.data.saveConsortium.name,
          description: res.data.saveConsortium.description,
          users: res.data.saveConsortium.users,
          owners: res.data.saveConsortium.owners, 
        } 
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
    const title = this.state.consortium.name
      ? this.state.consortium.name
      : 'New Consortium';

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
  auth: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  saveConsortium: PropTypes.func.isRequired,
};

function mapStateToProps({ auth }) {
  return { auth };
}

const ConsortiumTabsWithData = graphql(saveConsortiumFunc, {
  props: ({ mutate }) => ({
    saveConsortium: consortium => mutate({
      variables: { consortium },
      update: (store, { data: { saveConsortium } }) => {
        const data = store.readQuery({ query: fetchAllConsortiaFunc });
        const index = data.fetchAllConsortia.findIndex(cons => cons.id === saveConsortium.id);
        if (index > -1) {
          data.fetchAllConsortia[index] = { ...saveConsortium };
        } else {
          data.fetchAllConsortia.push(saveConsortium);
        }
        store.writeQuery({ query: fetchAllConsortiaFunc, data });
      },
    }),
  }),
})(ConsortiumTabs);

export default connect(mapStateToProps)(ConsortiumTabsWithData);
