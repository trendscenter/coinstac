import React from 'react';
import PropTypes from 'prop-types';
import Select from '../../common/react-select';

function calculateSelectOutputValue(value, isMulti) {
  if (!value) {
    return null;
  }

  const computedValue = isMulti ? value.map(v => v.value) : value.value;

  return { value: computedValue };
}

function PipelineStepInputUsers({
  objKey, objParams, updateStep, getNewObj, step, users,
}) {
  if (!step) {
    return null;
  }

  const stepInputMapItem = step.inputMap[objKey];

  let value;

  if (!stepInputMapItem || !stepInputMapItem.value || !stepInputMapItem.value.length) {
    value = null;
  } else {
    value = objParams.multi
      ? stepInputMapItem.value.map(v => ({ label: v, value: v }))
      : { label: stepInputMapItem.value, value: stepInputMapItem.value };
  }

  return (
    <Select
      value={value}
      placeholder="Select User(s)"
      options={users ? users.map(u => ({ label: u.id, value: u.id })) : null}
      isMulti={objParams.multi}
      onChange={value => updateStep({
        ...step,
        inputMap: getNewObj(
          objKey,
          calculateSelectOutputValue(value)
        ),
      })}
    />
  );
}

PipelineStepInputUsers.defaultProps = {
  users: null,
};

PipelineStepInputUsers.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  step: PropTypes.object.isRequired,
  users: PropTypes.array,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputUsers;
