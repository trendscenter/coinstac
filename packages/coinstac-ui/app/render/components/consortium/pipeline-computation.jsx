import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import ItemTypes from './pipeline-item-types';

const style = {
  border: '1px solid black',
  padding: '0.5rem 1rem',
  marginBottom: '.5rem',
  backgroundColor: 'green',
  cursor: 'move',
  color: 'white',
};

const computationSource = {
  beginDrag(props) {
    return { id: props.id, controllerIndex: props.controllerIndex };
  },
  isDragging(props, monitor) {
    return props.id === monitor.getItem().id;
  },
  endDrag(props, monitor) {
    const { id: droppedId, controllerIndex } = monitor.getItem();
    const didDrop = monitor.didDrop();

    if (!didDrop) {
      props.moveComputation(droppedId, null, controllerIndex, controllerIndex);
    }
  },
};

const computationTarget = {
  canDrop() {
    return false;
  },

  hover(props, monitor) {
    const { id: draggedId, controllerIndex: draggedController } = monitor.getItem();
    const { id: overId, controllerIndex: swapController } = props;

    if (draggedId !== overId) {
      props.moveComputation(draggedId, overId, draggedController, swapController);
      // Probably not a great idea to change monitor state but searching through all
      //  controller computation lists to find the dragged item could be costly
      monitor.getItem().controllerIndex = swapController;
    }
  },
};

const collectDrag = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  };
};

const collectDrop = connect =>
  ({ connectDropTarget: connect.dropTarget() });

const PipelineComputation = ({ computation, isDragging, connectDragSource, connectDropTarget }) =>
  connectDragSource(connectDropTarget(
    <div style={{ ...style, opacity: isDragging ? 0 : 1 }}>
      <p style={{ marginTop: 0, fontWeight: 'bold' }}>{computation.meta.name}</p>
    </div>
  ));

PipelineComputation.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  isDragging: PropTypes.bool.isRequired,
  computation: PropTypes.object.isRequired,
  moveComputation: PropTypes.func.isRequired,
};

export default compose(
  DropTarget(ItemTypes.COMPUTATION, computationTarget, collectDrop),
  DragSource(ItemTypes.COMPUTATION, computationSource, collectDrag)
)(PipelineComputation);
