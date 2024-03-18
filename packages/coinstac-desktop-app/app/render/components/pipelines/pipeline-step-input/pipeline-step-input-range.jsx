import React from 'react';
import PropTypes from 'prop-types';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

function makeNumberRange(min, max, step) {
  const range = [];

  while (parseFloat(min) <= parseFloat(max)) {
    range.push(min);
    min += step;
  }

  return range;
}

function PipelineStepInputRange({
  objKey, objParams, owner, updateStep, getNewObj, step,
}) {
  if (!step.inputMap[objKey] && objParams?.default && owner) {
    updateStep({
      ...step,
      inputMap: getNewObj(objKey, { value: objParams.default }),
    });
  }

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
            : 'DELETE_VAR'
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
