import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';
import ListItem from '../common/list-item';
import { getAllCollections } from '../../state/ducks/collections';

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

class CollectionsList extends Component {
  componentDidMount() {
    this.props.getAllCollections();
  }

  render() {
    const { auth: { user }, collections } = this.props;

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
        {collections && collections.map(collection => (
          <div>
            <ListItem
              key={`${collection.name}-list-item`}
              itemObject={collection}
              deleteItem={() => { return null; }}
              owner={false}
              itemOptions={[]}
              itemRoute={'/dashboard/collections'}
            />
          </div>
        ))}
        {!collections &&
          <Alert bsStyle="info">
            No collections found
          </Alert>
        }
      </div>
    );
  }
}

CollectionsList.propTypes = {
  auth: PropTypes.object.isRequired,
  collections: PropTypes.array.isRequired,
  getAllCollections: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, collections: { collections } }) => {
  return { auth, collections };
};

export default connect(mapStateToProps, { getAllCollections })(CollectionsList);
