import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';

function PipelineStepInputTextField({
  objKey, objParams, owner, isFromCache, updateStep, getNewObj, step,
}) {
  if (!step) {
    return null;
  }

  return (
    <TextField
      disabled={!owner || isFromCache}
      name={`step-${objKey}`}
      onChange={event => updateStep({
        ...step,
        inputMap: getNewObj(objKey, event.target.value ? { value: event.target.value } : 'DELETE_VAR'),
      })}
      value={
        step.inputMap[objKey] && 'value' in step.inputMap[objKey]
          ? step.inputMap[objKey].value
          : objParams.default
      }
    />
  );
}

PipelineStepInputTextField.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  isFromCache: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func.isRequired,
  getNewObj: PropTypes.func.isRequired,
};

export default PipelineStepInputTextField;
