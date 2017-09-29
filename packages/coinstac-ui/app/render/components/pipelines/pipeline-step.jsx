import React, { Component } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { graphql } from 'react-apollo';
import { ControlLabel, FormGroup, FormControl, Panel, Well } from 'react-bootstrap';
import ItemTypes from './pipeline-item-types';
import { fetchComputationLocalIO } from '../../state/graphql-queries';

const styles = {
  container: {
    margin: '10px 0',
  },
  draggable: {
    cursor: 'move',
  },
};

const stepSource = {
  beginDrag(props) {
    return { id: props.id };
  },
  canDrag(props) {
    return !props.placeholder;
  },
  isDragging(props, monitor) {
    return props.id === monitor.getItem().id;
  },
  endDrag(props, monitor) {
    const { id: droppedId } = monitor.getItem();
    const didDrop = monitor.didDrop();

    if (!didDrop) {
      props.moveStep(droppedId, null);
    }
  },
};

const stepTarget = {
  canDrop() {
    return false;
  },

  hover(props, monitor) {
    const { id: draggedId } = monitor.getItem();
    const { id: overId } = props;

    if (draggedId !== overId) {
      props.moveStep(draggedId, overId);
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

class PipelineStep extends Component {
  render() {
    const {
      compIO,
      connectDragSource,
      connectDropTarget,
      isDragging,
      moveStep,
      owner,
      placeholder,
      step,
      updateStep,
      ...other
    } = this.props;

    const { id, computations, controller } = step;

    console.log(compIO);

    return connectDragSource(connectDropTarget(
      <div style={styles.container}>
        {placeholder &&
          <Well bsSize="small" style={styles.placeholderContainer}>
            <em>{computations[0].meta.name}</em>
          </Well>
        }

        {!placeholder &&
          <Panel
            header={computations[0].meta.name}
            style={{ ...styles.draggable, opacity: isDragging ? 0 : 1 }}
            {...other}
          >
            <h4>Step Options:</h4>
            <FormGroup controlId={`${id}-iterations`}>
              <ControlLabel>Iterations</ControlLabel>
              <FormControl
                disabled={!owner}
                inputRef={(input) => { this.iterations = input; }}
                onChange={() => updateStep(id, { ...step, iterations: this.iterations.value })}
                type="number"
                value={controller.options.iterations}
              />
            </FormGroup>
            <hr />
            <h4>Input Mappings:</h4>
          </Panel>
        }
      </div>
    ));
  }
}

PipelineStep.defaultProps = {
  owner: false,
  placeholder: false,
  updateStep: null,
};

PipelineStep.propTypes = {
  compIO: PropTypes.object.isRequired,
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  isDragging: PropTypes.bool.isRequired,
  moveStep: PropTypes.func.isRequired,
  owner: PropTypes.bool,
  placeholder: PropTypes.bool,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func,
};

const PipelineStepWithData = graphql(fetchComputationLocalIO, {
  props: ({ data: { fetchComputationMetadataByName } }) => ({
    compIO: fetchComputationMetadataByName,
  }),
  options: ({ computationName }) => ({ variables: { computationName } }),
})(PipelineStep);

export default compose(
  DropTarget(ItemTypes.COMPUTATION, stepTarget, collectDrop),
  DragSource(ItemTypes.COMPUTATION, stepSource, collectDrag)
)(PipelineStepWithData);
