import PropTypes from 'prop-types';
import React from 'react';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

function PipelineStepInputObject({
  objKey, objParams, owner, isFromCache, updateStep, getNewObj, step,
}) {
  if (!step.inputMap[objKey] && objParams?.default && owner) {
    updateStep({
      ...step,
      inputMap: getNewObj(objKey, { value: objParams.default }),
    });
  }

  if (!step) {
    return null;
  }

  return (
    <JSONInput
      disabled={!owner || isFromCache}
      name={`step-${objKey}`}
      onChange={value => updateStep({
        ...step,
        inputMap: getNewObj(objKey, value ? { value: value.jsObject } : 'DELETE_VAR'),
      })}
      placeholder={
        step.inputMap[objKey] && 'value' in step.inputMap[objKey]
          ? step.inputMap[objKey].value
          : objParams.default
      }
      id={`step-${objKey}`}
      locale={locale}
      height="250px"
      theme="light_mitsuketa_tribute"
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
