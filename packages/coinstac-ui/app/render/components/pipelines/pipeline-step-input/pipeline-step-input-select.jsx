import React from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

function PipelineStepInputSelect(objKey, objParams, owner, updateStep, getNewObj, step) {
  if (!objParams.values) {
    return null;
  }

  return (
    <Select
      disabled={!owner}
      onChange={event => updateStep({
        ...step,
        inputMap: getNewObj(
          objKey,
          event.target.value
            ? { value: event.target.value }
            : 'DELETE_VAR'
        ),
      })}
      value={
        step.inputMap[objKey] && 'value' in step.inputMap[objKey]
          ? step.inputMap[objKey].value
          : objParams.default
      }
    >
      {
        objParams.values.map(val => (
          <MenuItem key={`${val}-select-option`} value={val}>{val.toString()}</MenuItem>
        ))
      }
    </Select>
  );
}

export default PipelineStepInputSelect;
