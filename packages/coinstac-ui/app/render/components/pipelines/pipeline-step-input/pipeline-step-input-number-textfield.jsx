import React from 'react';
import TextField from '@material-ui/core/TextField';

function PipelineStepInputNumberTextField(objKey, objParams, owner, isFromCache, updateStep,
  getNewObj, step) {
  return (
    <TextField
      disabled={!owner || isFromCache}
      name={`step-${objKey}`}
      type="number"
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

export default PipelineStepInputNumberTextField;
