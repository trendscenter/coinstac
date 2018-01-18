import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';

const ListDeleteModal = ({ close, deleteItem, itemName, show }) => (
  <Modal show={show} onHide={close}>
    <Modal.Header closeButton>
      <Modal.Title>Delete</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h4>Are you sure you want to delete this {itemName}?</h4>
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
