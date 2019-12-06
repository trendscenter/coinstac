import React from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

function PipelineStepInputArray(objKey, objParams, owner, updateStep, getNewObj, getSelectList,
  step) {
  return (
    <Select
      disabled={!owner}
      multiple
      onChange={event => updateStep({
        ...step,
        inputMap: getNewObj(
          objKey,
          event.target.value
            ? { value: getSelectList(step.inputMap[objKey].value, event.target.value) }
            : 'DELETE_VAR'
        ),
      })}
      value={
        step.inputMap[objKey] && 'value' in step.inputMap[objKey]
          ? step.inputMap[objKey].value
          : [objParams.default]
      }
    >
      {
        objParams.values.map(val => (
          <MenuItem key={`${val}-select-option`} value={val}>{val}</MenuItem>
        ))
      }
    </Select>
  );
}

export default PipelineStepInputArray;
