import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { Button } from 'react-bootstrap';
import ItemTypes from './pipeline-item-types';
import PipelineComputation from './pipeline-computation';

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

const collectDrop = connect =>
  ({ connectDropTarget: connect.dropTarget() });

const PipelineController = (
  {
    addComputation,
    controller,
    isDragging,
    connectDragSource,
    connectDropTarget,
    controllerIndex,
    moveComputation,
  }
) =>
  connectDragSource(connectDropTarget(
    <div style={{ ...style, opacity: isDragging ? 0 : 1 }}>
      <p style={{ marginTop: 0, fontWeight: 'bold' }}>{controller.options.iterations}</p>
      <Button
        bsStyle="primary"
        type="button"
        onClick={() => addComputation(controllerIndex)}
      >
        <span aria-hidden="true" className="glphicon glyphicon-plus" />
        {' '}
        Add Computation
      </Button>
      {controller.computations &&
        controller.computations.map(computation => (
          <PipelineComputation
            id={computation.id}
            key={computation.id}
            computation={computation}
            controllerIndex={controllerIndex}
            moveComputation={moveComputation}
          />
        ))
      }
    </div>
  ));

PipelineController.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  isDragging: PropTypes.bool.isRequired,
  controller: PropTypes.object.isRequired,
  moveController: PropTypes.func.isRequired,
  moveComputation: PropTypes.func.isRequired,
};

export default compose(
  DropTarget(ItemTypes.CONTROLLER, controllerTarget, collectDrop),
  DragSource(ItemTypes.CONTROLLER, controllerSource, collectDrag)
)(PipelineController);
