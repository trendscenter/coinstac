import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import CollectionAbout from './collection-about';
import CollectionFiles from './collection-files';
import CollectionConsortia from './collection-consortia';
import { getAssociatedConsortia, getCollectionFiles, saveAssociatedConsortia, saveCollection } from '../../state/ducks/collections';
import { getRunsForConsortium, saveLocalRun } from '../../state/ducks/runs';
import { notifyInfo } from '../../state/ducks/notifyAndLog';

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
      fileGroups: {},
      associatedConsortia: [],
    };

    if (collections.length > 0 && params.collectionId) {
      collection = collections.find(col => col.id.toString() === params.collectionId);
      this.props.getAssociatedConsortia(collection.associatedConsortia);
    }

    this.state = {
      collection,
    };

    this.saveCollection = this.saveCollection.bind(this);
    this.updateAssociatedConsortia = this.updateAssociatedConsortia.bind(this);
    this.updateCollection = this.updateCollection.bind(this);
  }

  saveCollection(e) {
    if (e) {
      e.preventDefault();
    }

    this.props.saveCollection(this.state.collection);
  }

  updateAssociatedConsortia(cons) {
    this.props.saveAssociatedConsortia(cons);

    if (this.state.collection.associatedConsortia.indexOf(cons.id) === -1) {
      this.setState(prevState => ({
        collection: {
          ...prevState.collection,
          associatedConsortia: [...prevState.collection.associatedConsortia, cons.id],
        },
      }),
      () => {
        this.props.saveCollection(this.state.collection);
      });
    }

    // Grab runs for consortium, check if most recent is waiting for mapping,
    //   start pipeline if mapping complete
    this.props.getRunsForConsortium(cons.id)
      .then((runs) => {
        if (runs[runs.length - 1].status === 'needs-map') {
          const run = runs[runs.length - 1];
          const consortium = this.props.consortia.find(obj => obj.id === run.consortiumId);
          const pipeline =
            this.props.pipelines.find(obj => obj.id === consortium.activePipelineId);

          return this.props.getCollectionFiles(cons.id, consortium.name, pipeline.steps)
            .then((collectionFiles) => {
              if ('allFiles' in collectionFiles) {
                this.props.notifyInfo({
                  message: `Pipeline Starting for ${consortium.name}.`,
                });
                console.log(collectionFiles);
                // ipcRenderer.send('start-pipeline', { consortium, pipeline, filesArray: collectionFiles.allFiles, run });
                // this.props.saveLocalRun({ ...run, status: 'started' });
              }
            });
        }
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
              associatedConsortia={this.props.associatedConsortia}
              collection={this.state.collection}
              consortia={this.props.consortia}
              saveCollection={this.saveCollection}
              updateAssociatedConsortia={this.updateAssociatedConsortia}
              updateCollection={this.updateCollection}
            />
          </Tab>
        </Tabs>
      </div>
    );
  }
}

CollectionTabs.defaultProps = {
  associatedConsortia: [],
};

CollectionTabs.propTypes = {
  associatedConsortia: PropTypes.array,
  collections: PropTypes.array.isRequired,
  consortia: PropTypes.array.isRequired,
  getAssociatedConsortia: PropTypes.func.isRequired,
  getCollectionFiles: PropTypes.func.isRequired,
  getRunsForConsortium: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
  saveAssociatedConsortia: PropTypes.func.isRequired,
  saveCollection: PropTypes.func.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
};

function mapStateToProps({ collections: { associatedConsortia, collections } }) {
  return { associatedConsortia, collections };
}

export default connect(mapStateToProps,
  {
    getAssociatedConsortia,
    getCollectionFiles,
    getRunsForConsortium,
    notifyInfo,
    saveAssociatedConsortia,
    saveCollection,
    saveLocalRun,
  }
)(CollectionTabs);
