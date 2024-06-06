import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import PropTypes from 'prop-types';
import React from 'react';

function PipelineStepInputSelect({
  objKey, objParams, owner, updateStep, getNewObj, step,
}) {
  if (!step.inputMap[objKey] && objParams?.default && owner) {
    updateStep({
      ...step,
      inputMap: getNewObj(objKey, { value: objParams.default }),
    });
  }

  if (!step || !objParams.values) {
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
            : 'DELETE_VAR',
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

PipelineStepInputSelect.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputSelect;
