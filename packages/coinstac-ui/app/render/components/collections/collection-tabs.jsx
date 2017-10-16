import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
// import CollectionAbout from './consortium-about';
// import { fetchAllConsortiaFunc, saveConsortiumFunc } from '../../state/graphql/functions';

const styles = {
  tab: {
    marginTop: 10,
  },
};

class CollectionTabs extends Component {
  constructor(props) {
    super(props);

    let collection = {
      name: '',
      description: '',
    };

    /*
    if (props.params.collectionId) {
      const data = ApolloClient.readQuery({ query: fetchAllConsortiaFunc });
      collection = data.fetchAllConsortia.find(cons => cons.id === props.params.consortiumId);
      delete consortium.__typename;
    }
    */

    this.state = {
      collection,
    };

    this.saveCollection = this.saveCollection.bind(this);
    this.updateCollection = this.updateCollection.bind(this);
  }

  saveCollection(e) {
    e.preventDefault();

    /*
    this.props.saveCollection(this.state.consortium)
    .then((res) => {
      // TODO: hook activeComputationId and Inputs
      this.setState({
        consortium:
        {
          id: res.data.saveConsortium.id,
          name: res.data.saveConsortium.name,
          description: res.data.saveConsortium.description,
          users: res.data.saveConsortium.users,
          owners: res.data.saveConsortium.owners,
          activeComputationId: null,
          activeComputationInputs: null,
          tags: null,

        },
      });
      // TODO: Use redux to display success/failure messages after mutations
    })
    .catch(({ graphQLErrors }) => {
      console.log(graphQLErrors);
    });
    */
  }

  updateCollection(update) {
    this.setState(prevState => ({
      collection: { ...prevState.collection, [update.param]: update.value },
    }));
  }

  render() {
    const title = this.state.collection.name
      ? this.state.collection.name
      : 'New Collection';

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">{title}</h1>
        </div>
        <Tabs defaultActiveKey={1} id="consortium-tabs">
          <Tab eventKey={1} title="About" style={styles.tab} />
          <Tab
            eventKey={2}
            title="Consortia"
            disabled={typeof this.state.collection.id === 'undefined'}
            style={styles.tab}
          />
          <Tab
            eventKey={3}
            title="Files"
            disabled={typeof this.state.collection.id === 'undefined'}
            style={styles.tab}
          />
        </Tabs>
      </div>
    );
  }
}

/*
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
*/

export default CollectionTabs; // connect(mapStateToProps)(ConsortiumTabsWithData);
