/* eslint-disable react/no-unused-prop-types */
import React, { Component } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { graphql } from '@apollo/react-hoc';
import { debounce } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ItemTypes from './pipeline-item-types';
import PipelineStepInput from './pipeline-step-input';
import { FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';
import { compIOProp } from '../../state/graphql/props';

const styles = theme => ({
  pipelineStep: {
    marginBottom: theme.spacing(2),
  },
  accordionPanelContent: {
    display: 'block',
  },
});

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

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

const collectDrop = connect => ({ connectDropTarget: connect.dropTarget() });

class PipelineStep extends Component {
  state = {
    orderedInputs: [],
    compInputs: [],
    inputGroups: {},
  };

  componentDidMount() {
    const {
      compIO, isEdit, updateStep, step,
    } = this.props;

    if (compIO) {
      this.groupInputs(compIO);

      if (!isEdit) {
        const inputMapDefaultValues = this.fillDefaultValues(compIO);
        const inputMapPrefill = this.prefillDataFromHeadlessClients();

        updateStep({
          ...step,
          inputMap: {
            ...step.inputMap,
            ...inputMapDefaultValues,
            ...inputMapPrefill,
          },
        });
      }
    }
  }

  componentDidUpdate() {
    const {
      compIO, possibleInputs, isEdit, updateStep, step,
    } = this.props;
    const { compInputs, orderedInputs } = this.state;

    if ((!orderedInputs || !orderedInputs.length) && possibleInputs) {
      debounce(this.orderComputations, 500)(possibleInputs);
    }

    if ((!compInputs || !compInputs.length) && compIO) {
      this.groupInputs(compIO);

      if (!isEdit) {
        const inputMapDefaultValues = this.fillDefaultValues(compIO);
        const inputMapPrefill = this.prefillDataFromHeadlessClients();

        updateStep({
          ...step,
          inputMap: {
            ...step.inputMap,
            ...inputMapDefaultValues,
            ...inputMapPrefill,
          },
        });
      }
    }
  }

  prefillDataFromHeadlessClients = () => {
    const { headlessMembers, headlessClientsConfig, computationId } = this.props;

    if (!headlessMembers) {
      return;
    }

    const inputMap = {};

    Object.keys(headlessMembers).forEach((headlessClientId) => {
      const headlessClientConfig = headlessClientsConfig.find(hc => hc.id === headlessClientId);

      if (!headlessClientConfig) {
        return;
      }

      const computationConfig = headlessClientConfig.computationWhitelist[computationId];

      Object.keys(computationConfig.inputMap).forEach((inputKey) => {
        const input = computationConfig.inputMap[inputKey];

        let value;

        if (input.type === 'csv') {
          value = input.dataMap.map(dataMapField => ({
            name: dataMapField.variableName,
            type: dataMapField.type,
            suggested: true,
          }));
        }

        if (value) {
          inputMap[inputKey] = {
            fulfilled: false,
            value,
          };
        }
      });
    });

    return inputMap;
  }

  orderComputations = (possibleInputs) => {
    const { previousComputationIds } = this.props;

    const orderedInputs = previousComputationIds.map((prevComp, possibleInputIndex) => {
      const comp = possibleInputs.find(pI => pI.id === prevComp);
      return {
        inputs: comp ? comp.computation.output : [],
        possibleInputIndex,
      };
    });

    this.setState({ orderedInputs });
  }

  groupInputs = (compIO) => {
    const compInputs = Object.keys(compIO.computation.input)
      .map(inputKey => ({
        key: inputKey,
        value: compIO.computation.input[inputKey],
      }))
      .sort((a, b) => a.value.order - b.value.order);

    const inputGroups = compInputs.reduce((acc, inputField) => {
      if (!inputField.value.group) {
        return acc;
      }

      if (!acc[inputField.value.group]) {
        acc[inputField.value.group] = [];
      }

      acc[inputField.value.group].push(inputField);

      return acc;
    }, {});

    this.setState({
      compInputs,
      inputGroups,
    });
  }

  fillDefaultValues = (compIO) => {
    const defaultInputs = {};

    Object.keys(compIO.computation.input).forEach((inputFieldKey) => {
      const inputField = compIO.computation.input[inputFieldKey];

      if ('default' in inputField) {
        defaultInputs[inputFieldKey] = {
          fulfilled: inputField.source === 'owner',
          value: inputField.default,
        };
      }
    });

    return defaultInputs;
  }

  showOutput = (paddingLeft, id, output) => {
    const localOutputs = Object.entries(output).filter(elem => typeof elem[1] === 'object');

    return (
      <div key={`${id}-output`} style={{ paddingLeft }}>
        {
          localOutputs.map((localOutput) => {
            const output = [(
              <Typography key={`${id}-${localOutput[0]}-output`} variant="body2">
                {localOutput[1].label}
                {' '}
                (
                {localOutput[1].type}
                )
              </Typography>
            )];

            if (localOutput[1].items) {
              output.push(this.showOutput(paddingLeft + 5, id, localOutput[1].items));
            }

            return output;
          })
        }
      </div>
    );
  }

  renderPipelineStepInput = (localInput) => {
    const {
      pipelineIndex, step, users, owner, updateStep,
    } = this.props;
    const { orderedInputs } = this.state;

    return (
      <PipelineStepInput
        objKey={localInput.key}
        objParams={localInput.value}
        pipelineIndex={pipelineIndex}
        key={`${step.id}-${localInput.key}-input`}
        owner={owner}
        parentKey={`${step.id}-${localInput.key}-input`}
        possibleInputs={orderedInputs}
        step={step}
        updateStep={updateStep}
        users={users}
      />
    );
  }

  render() {
    const {
      classes,
      compIO,
      connectDragSource,
      connectDropTarget,
      deleteStep,
      isDragging,
      owner,
      step,
    } = this.props;

    const { compInputs, inputGroups } = this.state;

    return connectDragSource(connectDropTarget(
      <div className={classes.pipelineStep} key={`step-${step.id}`}>
        <Accordion className="pipeline-step" style={{ ...styles.draggable, opacity: isDragging ? 0 : 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">{step.computations[0].meta.name}</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordionPanelContent} key={`step-exp-${step.id}`}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Input Parameters:</Typography>
              <Button
                variant="contained"
                color="secondary"
                disabled={!owner}
                onClick={() => deleteStep(step.id)}
              >
                Delete
              </Button>
            </Box>
            {
              compInputs
                .filter(localInput => !localInput.value.group)
                .map(this.renderPipelineStepInput)
            }
            <div>
              {
                Object.entries(inputGroups).map((group) => {
                  const name = group[0];
                  const items = group[1];

                  return (
                    <Accordion
                      key={name}
                      className="pipeline-step"
                      style={{
                        ...styles.draggable,
                        opacity: isDragging ? 0 : 1,
                        margin: '1rem 0',
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span>
                          {`${capitalize(name)} Fields`}
                        </span>
                      </AccordionSummary>
                      <AccordionDetails className={classes.accordionPanelContent}>
                        {items && items.map(this.renderPipelineStepInput)}
                      </AccordionDetails>
                    </Accordion>
                  );
                })
              }
            </div>
            <Typography variant="h6">Output:</Typography>
            {compIO && this.showOutput(10, step.id, compIO.computation.output)}
          </AccordionDetails>
        </Accordion>
      </div>
    ));
  }
}

PipelineStep.defaultProps = {
  compIO: null,
  owner: false,
  possibleInputs: [],
  updateStep: null,
  users: [],
  headlessMembers: {},
  headlessClientsConfig: [],
  computationId: null,
};

PipelineStep.propTypes = {
  classes: PropTypes.object.isRequired,
  compIO: PropTypes.object,
  id: PropTypes.string.isRequired,
  isDragging: PropTypes.bool.isRequired,
  isEdit: PropTypes.bool.isRequired,
  owner: PropTypes.bool,
  pipelineIndex: PropTypes.number.isRequired,
  possibleInputs: PropTypes.array,
  previousComputationIds: PropTypes.array.isRequired,
  step: PropTypes.object.isRequired,
  users: PropTypes.array,
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  deleteStep: PropTypes.func.isRequired,
  moveStep: PropTypes.func.isRequired,
  updateStep: PropTypes.func,
  headlessMembers: PropTypes.object,
  headlessClientsConfig: PropTypes.array,
  computationId: PropTypes.string,
};

const PipelineStepWithData = compose(
  graphql(FETCH_COMPUTATION_QUERY, compIOProp),
  graphql(FETCH_COMPUTATION_QUERY, {
    props: ({ data: { fetchComputation } }) => ({
      possibleInputs: fetchComputation,
    }),
    options: ({ previousComputationIds }) => ({
      variables: { computationIds: previousComputationIds },
    }),
  })
)(PipelineStep);

const componentWithStyles = withStyles(styles)(PipelineStepWithData);

export default compose(
  DropTarget(ItemTypes.COMPUTATION, stepTarget, collectDrop),
  DragSource(ItemTypes.COMPUTATION, stepSource, collectDrag)
)(componentWithStyles);
