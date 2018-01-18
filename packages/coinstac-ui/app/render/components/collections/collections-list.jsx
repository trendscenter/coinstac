import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';
import ListItem from '../common/list-item';
import ListDeleteModal from '../common/list-delete-modal';
import { deleteCollection, getAllCollections } from '../../state/ducks/collections';

class CollectionsList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collectionToDelete: -1,
      showModal: false,
    };

    this.closeModal = this.closeModal.bind(this);
    this.deleteCollection = this.deleteCollection.bind(this);
    this.openModal = this.openModal.bind(this);
  }

  componentDidMount() {
    this.props.getAllCollections();
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  deleteCollection() {
    this.props.deleteCollection(this.state.collectionToDelete);
    this.closeModal();
  }

  openModal(collectionId) {
    return () => {
      this.setState({
        showModal: true,
        collectionToDelete: collectionId,
      });
    };
  }

  render() {
    const { collections } = this.props;

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">File Collections</h1>
          <LinkContainer className="pull-right" to="/dashboard/pipelines/new">
            <Button bsStyle="primary" className="pull-right">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              Create File Collection
            </Button>
          </LinkContainer>
        </div>
        {collections.length > 0 && collections.map(collection => (
          <ListItem
            key={`${collection.id}-list-item`}
            itemObject={collection}
            deleteItem={this.openModal}
            owner
            itemOptions={[]}
            itemRoute={'/dashboard/collections'}
          />
        ))}
        {collections.length === 0 &&
          <Alert bsStyle="info">
            No collections found
          </Alert>
        }
        <ListDeleteModal
          close={this.closeModal}
          deleteItem={this.deleteCollection}
          itemName={'collection'}
          show={this.state.showModal}
        />
      </div>
    );
  }
}

CollectionsList.propTypes = {
  collections: PropTypes.array.isRequired,
  deleteCollection: PropTypes.func.isRequired,
  getAllCollections: PropTypes.func.isRequired,
};

const mapStateToProps = ({ collections: { collections } }) => {
  return { collections };
};

export default connect(mapStateToProps, { deleteCollection, getAllCollections })(CollectionsList);
