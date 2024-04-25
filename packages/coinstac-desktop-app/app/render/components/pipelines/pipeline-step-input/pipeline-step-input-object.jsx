import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { JsonEditor } from 'jsoneditor-react';
// import 'jsoneditor-react/es/editor.min.css';

function PipelineStepInputObject({
  objKey, objParams, owner, isFromCache, updateStep, getNewObj, step,
}) {
  useEffect(() => {
    if (!step.inputMap[objKey] && objParams?.default && owner) {
      updateStep({
        ...step,
        inputMap: getNewObj(objKey, { value: objParams.default }),
      });
    }
  }, []);

  if (!step) {
    return null;
  }

  const value = step.inputMap[objKey]?.value || objParams.default;

  const handleChange = (value) => {
    if (!owner || isFromCache) {
      return;
    }

    updateStep({
      ...step,
      inputMap: getNewObj(objKey, value ? { value } : 'DELETE_VAR'),
    });
  };

  return (
    <JsonEditor
      value={value}
      onChange={handleChange}
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
