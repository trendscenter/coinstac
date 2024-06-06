import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import PropTypes from 'prop-types';
import React from 'react';

function PipelineStepInputArray({
  objKey, objParams, owner, updateStep, getNewObj, getSelectList, step,
}) {
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
            : 'DELETE_VAR',
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

PipelineStepInputArray.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  getSelectList: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputArray;
