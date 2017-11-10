import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import CollectionAbout from './collection-about';
import CollectionFiles from './collection-files';
import CollectionConsortia from './collection-consortia';
import { saveCollection } from '../../state/ducks/collections';

const styles = {
  tab: {
    marginTop: 10,
  },
};

class CollectionTabs extends Component {
  constructor(props) {
    super(props);

    const { collections, params } = props;
    let collection = {
      name: '',
      description: '',
    };

    if (params.collectionId) {
      collection = collections.find(col => col.id.toString() === params.collectionId);
    }

    this.state = {
      collection,
    };

    this.saveCollection = this.saveCollection.bind(this);
    this.updateCollection = this.updateCollection.bind(this);
  }

  saveCollection(e) {
    if (e) {
      e.preventDefault();
    }

    this.props.saveCollection(this.state.collection)
    // TODO: Use redux to display success/failure messages after mutations
    .catch(({ graphQLErrors }) => {
      console.log(graphQLErrors);
    });
  }

  updateCollection(update, callback) {
    this.setState(prevState => ({
      collection: { ...prevState.collection, [update.param]: update.value },
    }), callback);
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
        <Tabs defaultActiveKey={1} id="collection-tabs">
          <Tab eventKey={1} title="About" style={styles.tab}>
            <CollectionAbout
              collection={this.state.collection}
              saveCollection={this.saveCollection}
              updateCollection={this.updateCollection}
            />
          </Tab>
          <Tab
            eventKey={2}
            title="Files"
            disabled={typeof this.state.collection.id === 'undefined'}
            style={styles.tab}
          >
            <CollectionFiles
              collection={this.state.collection}
              saveCollection={this.saveCollection}
              updateCollection={this.updateCollection}
            />
          </Tab>
          <Tab
            eventKey={3}
            title="Consortia"
            disabled={typeof this.state.collection.id === 'undefined'}
            style={styles.tab}
          >
            <CollectionConsortia
              collection={this.state.collection}
              saveCollection={this.saveCollection}
              updateCollection={this.updateCollection}
            />
          </Tab>
        </Tabs>
      </div>
    );
  }
}

CollectionTabs.propTypes = {
  collections: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  saveCollection: PropTypes.func.isRequired,
};

function mapStateToProps({ collections: { collections } }) {
  return { collections };
}

export default connect(mapStateToProps, { saveCollection })(CollectionTabs);
