import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { Well } from 'react-bootstrap';
import ItemTypes from './pipeline-item-types';

const styles = {
  container: {
    border: '1px solid black',
    padding: '0.5rem 1rem',
    marginBottom: '.5rem',
    backgroundColor: 'green',
    cursor: 'move',
    color: 'white',
  },
  placeholderContainer: {
    marginBottom: '.5rem',
    padding: '0.5rem 1rem',
  },
};

const computationSource = {
  beginDrag(props) {
    return { idInPipeline: props.idInPipeline, controllerIndex: props.controllerIndex };
  },
  canDrag(props) {
    return !props.placeholder;
  },
  isDragging(props, monitor) {
    return props.idInPipeline === monitor.getItem().idInPipeline;
  },
  endDrag(props, monitor) {
    const { idInPipeline: droppedId, controllerIndex } = monitor.getItem();
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
    const { idInPipeline: draggedId, controllerIndex: draggedController } = monitor.getItem();
    const { idInPipeline: overId, controllerIndex: swapController } = props;

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

const PipelineComputation = ({
  computation,
  connectDragSource,
  connectDropTarget,
  isDragging,
  placeholder,
}) =>
  connectDragSource(connectDropTarget(
    <div>
      {placeholder &&
        <Well bsSize="small" style={styles.placeholderContainer}>
          <p><em>{computation.meta.name}</em></p>
        </Well>
      }

      {!placeholder &&
        <div style={{ ...styles.container, opacity: isDragging ? 0 : 1 }}>
          <p>{computation.meta.name}</p>
        </div>
      }
    </div>
  ));

PipelineComputation.defaultProps = {
  placeholder: false,
};

PipelineComputation.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  idInPipeline: PropTypes.string.isRequired,
  isDragging: PropTypes.bool.isRequired,
  computation: PropTypes.object.isRequired,
  moveComputation: PropTypes.func.isRequired,
  placeholder: PropTypes.bool,
};

export default compose(
  DropTarget(ItemTypes.COMPUTATION, computationTarget, collectDrop),
  DragSource(ItemTypes.COMPUTATION, computationSource, collectDrag)
)(PipelineComputation);
