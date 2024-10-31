import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import PropTypes from 'prop-types';
import React from 'react';

function makeNumberRange(initialMin, max, step) {
  const range = [];
  let min = initialMin;

  while (parseFloat(min) <= parseFloat(max)) {
    range.push(min);
    min += step;
  }

  return range;
}

function PipelineStepInputRange({
  objKey, objParams, owner, updateStep, getNewObj, step,
}) {
  if (!step || !objParams.min || !objParams.max || !objParams.step) {
    return null;
  }

  const value = step.inputMap[objKey] && 'value' in step.inputMap[objKey]
    ? step.inputMap[objKey].value
    : parseFloat(objParams.default);

  return (
    <Select
      disabled={!owner}
      onChange={event => updateStep({
        ...step,
        inputMap: getNewObj(
          objKey,
          event.target.value
            ? { value: event.target.value }
            : 'DELETE_VAR',
        ),
      })}
      value={value}
    >
      {
        makeNumberRange(objParams.min, objParams.max, objParams.step).map(val => (
          <MenuItem
            key={`${val}-select-option`}
            value={parseFloat(val)}
            selected={val === value}
          >
            {val.toString()}
          </MenuItem>
        ))
      }
    </Select>
  );
}

PipelineStepInputRange.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputRange;
