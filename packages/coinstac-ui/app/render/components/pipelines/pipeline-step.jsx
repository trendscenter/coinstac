import React, { Component } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { graphql } from 'react-apollo';
import { Button, Panel } from 'react-bootstrap';
import ItemTypes from './pipeline-item-types';
import PipelineStepInput from './pipeline-step-input';
import { FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';
import { compIOProp } from '../../state/graphql/props';

const styles = {
  container: {
    margin: '10px 0',
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
      computationId,
      connectDragSource,
      connectDropTarget,
      deleteStep,
      pipelineIndex,
      possibleInputs,
      previousComputationIds,
      isDragging,
      moveStep,
      owner,
      step,
      updateStep,
      ...other
    } = this.props;

    const { id, computations } = step;

    return connectDragSource(connectDropTarget(
      <div style={styles.container}>
        <Panel
          header={computations[0].meta.name}
          style={{ ...styles.draggable, opacity: isDragging ? 0 : 1 }}
          {...other}
        >
          <Button
            key={`delete-step-button-${step.id}`}
            bsStyle="danger"
            className="pull-right"
            onClick={() => deleteStep(step.id)}
          >
            Delete
          </Button>
          <h4>Input Parameters:</h4>
          {compIO !== null && Object.entries(compIO.computation.input).map(localInput => (
            <PipelineStepInput
              isCovariate={localInput[0] === 'covariates'}
              objKey={localInput[0]}
              objParams={localInput[1]}
              pipelineIndex={pipelineIndex}
              key={`${id}-${localInput[0]}-input`}
              owner={owner}
              parentKey={`${id}-${localInput[0]}-input`}
              possibleInputs={possibleInputs.map((prevComp, possibleInputIndex) =>
                ({ inputs: prevComp.computation.output, possibleInputIndex })
              )}
              step={step}
              updateStep={updateStep}
            />
          ))}
          <h4>Output:</h4>
          {compIO !== null && Object.entries(compIO.computation.output).map(localOutput => (
            <p key={`${id}-${localOutput[0]}-output`}>{localOutput[1].label}</p>
          ))}
        </Panel>
      </div>
    ));
  }
}

PipelineStep.defaultProps = {
  compIO: null,
  owner: false,
  possibleInputs: [],
  updateStep: null,
};

PipelineStep.propTypes = {
  compIO: PropTypes.object,
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  deleteStep: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  isDragging: PropTypes.bool.isRequired,
  moveStep: PropTypes.func.isRequired,
  owner: PropTypes.bool,
  possibleInputs: PropTypes.array,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func,
};

const PipelineStepWithData = compose(
  graphql(FETCH_COMPUTATION_QUERY, compIOProp),
  graphql(FETCH_COMPUTATION_QUERY, {
    props: ({ data: { fetchComputation } }) => ({
      possibleInputs: fetchComputation,
    }),
    options: ({ previousComputationIds }) =>
      ({ variables: { computationIds: previousComputationIds } }),
  })
)(PipelineStep);

export default compose(
  DropTarget(ItemTypes.COMPUTATION, stepTarget, collectDrop),
  DragSource(ItemTypes.COMPUTATION, stepSource, collectDrag)
)(PipelineStepWithData);
