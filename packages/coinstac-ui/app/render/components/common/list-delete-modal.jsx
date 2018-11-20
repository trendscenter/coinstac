import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';

const styles = {
  warningMessage: {
    marginTop: 20
  },
  warningIcon: {
    color: '#ec971f',
    marginRight: 5
  }
};

const ListDeleteModal = ({ close, deleteItem, itemName, show, warningMessage }) => (
  <Modal show={show} onHide={close}>
    <Modal.Header closeButton>
      <Modal.Title>Delete</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h4>Are you sure you want to delete this {itemName}?</h4>
      {
        warningMessage &&
        <h5 style={styles.warningMessage}>
          <span aria-hidden="true" className="glyphicon glyphicon-warning-sign" style={styles.warningIcon} />
          { warningMessage }
        </h5>
      }
    </Modal.Body>
    <Modal.Footer>
      <Button className="pull-left" onClick={close}>Cancel</Button>
      <Button bsStyle="danger" onClick={deleteItem}>Delete</Button>
    </Modal.Footer>
  </Modal>
);

ListDeleteModal.propTypes = {
  close: PropTypes.func.isRequired,
  deleteItem: PropTypes.func.isRequired,
  itemName: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
};

export default ListDeleteModal;
