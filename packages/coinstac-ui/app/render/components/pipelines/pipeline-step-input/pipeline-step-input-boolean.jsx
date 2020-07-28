import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';

function PipelineStepInputBoolean({
  objKey, owner, updateStep, getNewObj, step,
}) {
  if (!step) {
    return null;
  }

  return (
    <Checkbox
      disabled={!owner}
      onChange={event => updateStep({
        ...step,
        inputMap: getNewObj(objKey, { value: event.target.checked }),
      })}
      checked={
        step.inputMap[objKey]
        && 'value' in step.inputMap[objKey]
        && step.inputMap[objKey].value
      }
    >
      True?
    </Checkbox>
  );
}

PipelineStepInputBoolean.propTypes = {
  objKey: PropTypes.string.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputBoolean;
