import React from 'react';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';

function PipelineStepInputRadio(objKey, objParams, owner, updateStep, getNewObj, step) {
  if (!objParams.values) {
    return null;
  }

  return (
    <RadioGroup
      disabled={!owner}
      onChange={event => updateStep({
        ...step,
        inputMap: getNewObj(objKey, event.target.checked ? { value: event.target.checked } : 'DELETE_VAR'),
      })}
      value={
        step.inputMap[objKey] && 'value' in step.inputMap[objKey]
          ? step.inputMap[objKey].value
          : objParams.default
      }
    >
      {
        objParams.values.map(val => (
          <FormControlLabel
            value={val}
            control={<Radio />}
            label={val}
            labelPlacement="start"
          />
        ))
      }
    </RadioGroup>
  );
}

export default PipelineStepInputRadio;
