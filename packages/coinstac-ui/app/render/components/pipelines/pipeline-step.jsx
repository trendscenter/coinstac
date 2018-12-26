import React, { Component } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { graphql } from 'react-apollo';
import Button from '@material-ui/core/Button';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ItemTypes from './pipeline-item-types';
import PipelineStepInput from './pipeline-step-input';
import { FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';
import { compIOProp } from '../../state/graphql/props';

const styles = theme => ({
  expansionPanelContent: {
    display: 'block',
  },
  inputParametersContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

const stepSource = {
  beginDrag(props) {
    return { id: props.id };
  },
  canDrag(props) {
    return props.owner && !props.placeholder;
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
  constructor(props) {
    super(props);

    this.state = {
      orderedInputs: [],
    };

    this.showOutput = this.showOutput.bind(this);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    let orderedInputs = [];

    // TODO: Find another way to force possibleInputs array to
    //   always match order of previousComputationId
    if (nextProps.possibleInputs) {
      orderedInputs = this.props.previousComputationIds.map((prevComp, possibleInputIndex) => {
        const comp = nextProps.possibleInputs.find(pI => pI.id === prevComp);
        return {
          inputs: comp ? comp.computation.output : [],
          possibleInputIndex,
        };
      });

      this.setState({ orderedInputs });
    }
  }

  showOutput(paddingLeft, id, output) {
    return (
      <div style={{ paddingLeft }}>
        {
          Object.entries(output).map((localOutput) => {
            if (typeof localOutput[1] === 'object') {
              const output = [(
                <Typography key={`${id}-${localOutput[0]}-output`} variant="body1">
                  {localOutput[1].label} ({localOutput[1].type})
                </Typography>
              )];

              if (localOutput[1].items) {
                output.push(this.showOutput(paddingLeft + 5, id, localOutput[1].items));
              }

              return output;
            }

            return null;
          })
        }
      </div>
    );
  }

  render() {
    const {
      compIO,
      computationId,
      connectDragSource,
      connectDropTarget,
      deleteStep,
      expanded,
      pipelineIndex,
      possibleInputs,
      previousComputationIds,
      isDragging,
      moveStep,
      owner,
      step,
      updateStep,
      classes,
      ...other
    } = this.props;

    const { orderedInputs } = this.state;

    const { id, computations } = step;

    return connectDragSource(connectDropTarget(
      <div>
        <ExpansionPanel style={{ ...styles.draggable, opacity: isDragging ? 0 : 1 }}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="headline">{computations[0].meta.name}</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className={classes.expansionPanelContent}>
            <div className={classes.inputParametersContainer}>
              <Typography variant="title">Input Parameters:</Typography>
              <Button
                variant="contained"
                color="secondary"
                disabled={!owner}
                onClick={() => deleteStep(step.id)}
              >
                Delete
              </Button>
            </div>
            {
              compIO !== null
              && Object.entries(compIO.computation.input).map(localInput => (
                <PipelineStepInput
                  objKey={localInput[0]}
                  objParams={localInput[1]}
                  pipelineIndex={pipelineIndex}
                  key={`${id}-${localInput[0]}-input`}
                  owner={owner}
                  parentKey={`${id}-${localInput[0]}-input`}
                  possibleInputs={orderedInputs}
                  step={step}
                  updateStep={updateStep}
                />
              ))
            }
            <Typography variant="title">Output:</Typography>
            {compIO !== null && this.showOutput(10, id, compIO.computation.output)}
          </ExpansionPanelDetails>
        </ExpansionPanel>
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
  previousComputationIds: PropTypes.array.isRequired,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func,
  classes: PropTypes.object.isRequired,
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

const componentWithStyles = withStyles(styles)(PipelineStepWithData);

export default compose(
  DropTarget(ItemTypes.COMPUTATION, stepTarget, collectDrop),
  DragSource(ItemTypes.COMPUTATION, stepSource, collectDrag)
)(componentWithStyles);
