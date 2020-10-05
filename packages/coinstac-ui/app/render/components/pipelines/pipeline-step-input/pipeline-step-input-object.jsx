import React from 'react';
import PropTypes from 'prop-types';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';

function PipelineStepInputObject({
  objKey, objParams, owner, updateStep, getNewObj, step, isFromCache
}) {
  if (!step || !objParams.default) {
    return null;
  }

  if (!step.inputMap[objKey] && 'default' in objParams && owner) {
    updateStep({
      ...step,
      inputMap: getNewObj(
        objKey,
        { value: objParams.default }
      ),
    });
  }

  if (!step) {
    return null;
  }

  let value = step.inputMap[objKey] && 'value' in step.inputMap[objKey]
    ? step.inputMap[objKey].value
    : objParams.default;

  return (
    <TextareaAutosize
      disabled={!owner || isFromCache}
      name={`step-${objKey}`}
      onChange={event => updateStep({
        ...step,
        inputMap: getNewObj(objKey, event.target.value ? { value: JSON.parse(event.target.value) } : 'DELETE_VAR'),
      })}
      value={JSON.stringify(value)}
    />
  );
}


PipelineStepInputObject.defaultProps = {
  isFromCache: false,
};

PipelineStepInputObject.propTypes = {
  isFromCache: PropTypes.bool,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputObject;
