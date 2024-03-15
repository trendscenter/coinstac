import TextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import React from 'react';

function PipelineStepInputNumberTextField({
  objKey, objParams, owner, isFromCache,
  updateStep, getNewObj, step,
}) {
  if (!step) {
    return null;
  }

  return (
    <TextField
      disabled={!owner || isFromCache}
      name={`step-${objKey}`}
      type="number"
      onFocus={event => event.target.select()}
      onChange={event => updateStep({
        ...step,
        inputMap: getNewObj(objKey, event.target.value ? { value: parseFloat(event.target.value) } : 'DELETE_VAR'),
      })}
      value={
        step.inputMap[objKey] && 'value' in step.inputMap[objKey]
          ? step.inputMap[objKey].value
          : objParams.default
      }
    />
  );
}

PipelineStepInputNumberTextField.defaultProps = {
  isFromCache: false,
};

PipelineStepInputNumberTextField.propTypes = {
  isFromCache: PropTypes.bool,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputNumberTextField;
