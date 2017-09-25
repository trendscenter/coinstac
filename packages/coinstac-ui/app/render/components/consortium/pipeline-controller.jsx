import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import ItemTypes from './pipeline-item-types';

const style = {
  border: '1px dashed gray',
  padding: '0.5rem 1rem',
  marginBottom: '.5rem',
  backgroundColor: 'white',
  cursor: 'move',
};

const controllerSource = {
  beginDrag(props) {
    return { id: props.id };
  },

  endDrag(props, monitor) {
    const { id: droppedId } = monitor.getItem();
    const didDrop = monitor.didDrop();

    if (!didDrop) {
      props.moveController(droppedId, null);
    }
  },
};

const controllerTarget = {
  canDrop() {
    return false;
  },

  hover(props, monitor) {
    const { id: draggedId } = monitor.getItem();
    const { id: overId } = props;

    if (draggedId !== overId) {
      props.moveController(draggedId, overId);
    }
  },
};

const collectDrag = (connect, monitor) => (
  {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  }
);

const collectDrop = (connect, monitor) => (
  {
    connectDropTarget: connect.dropTarget(),
  }
);

const PipelineController = ({ controller, isDragging, connectDragSource, connectDropTarget }) =>
  connectDragSource(connectDropTarget(
    <div style={{ ...style, opacity: isDragging ? 0 : 1 }}>
      <p style={{ marginTop: 0, fontWeight: 'bold' }}>{controller.options.iterations}</p>
    </div>
  ));

PipelineController.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired,
  id: PropTypes.any.isRequired,
  controller: PropTypes.object.isRequired,
  moveController: PropTypes.func.isRequired,
};

export default compose(
  DropTarget(ItemTypes.COMPUTATION, controllerTarget, collectDrop),
  DragSource(ItemTypes.COMPUTATION, controllerSource, collectDrag)
)(PipelineController);
