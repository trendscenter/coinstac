import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { Button, DropdownButton, MenuItem } from 'react-bootstrap';
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
    allComputations,
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
      <div className="clearfix" style={{ marginBottom: 20 }}>
        <span style={{ marginTop: 0, fontWeight: 'bold' }}>{controller.options.iterations}</span>
        <div className="pull-right">
          <DropdownButton
            bsStyle="primary"
            id="computation-dropdown"
            pullRight
            title={
              <span>
                <span aria-hidden="true" className="glphicon glyphicon-plus" /> Add Computation
              </span>
            }
          >
            {allComputations.map(comp => (
              <MenuItem
                eventKey={comp.id}
                key={comp.id}
                onClick={() => addComputation({ ...comp, idInPipeline: `${Date.now()}-${comp.id}` }, controllerIndex)}
              >
                {comp.meta.name}
              </MenuItem>
            ))}
          </DropdownButton>
        </div>
      </div>
      {controller.computations &&
        controller.computations.map(computation => (
          <PipelineComputation
            idInPipeline={computation.idInPipeline}
            key={computation.idInPipeline}
            computation={computation}
            controllerIndex={controllerIndex}
            moveComputation={moveComputation}
          />
        ))
      }
      {!controller.computations.length &&
        <PipelineComputation
          idInPipeline={'placeholder'}
          key={'placeholder'}
          placeholder
          computation={{ meta: { name: 'No computations listed!' } }}
          controllerIndex={controllerIndex}
          moveComputation={moveComputation}
        />
      }
    </div>
  ));

PipelineController.propTypes = {
  allComputations: PropTypes.array.isRequired,
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
