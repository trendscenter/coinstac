import React from 'react';
import Checkbox from '@material-ui/core/Checkbox';

function PipelineStepInputBoolean(objKey, objParams, owner, updateStep, getNewObj, step) {
  if (!objParams.values) {
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

export default PipelineStepInputBoolean;
