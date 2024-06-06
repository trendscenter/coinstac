import Checkbox from '@material-ui/core/Checkbox';
import PropTypes from 'prop-types';
import React from 'react';

function PipelineStepInputBoolean({
  objKey, objParams, owner, updateStep, getNewObj, step,
}) {
  if (!step.inputMap[objKey] && objParams?.default && owner) {
    updateStep({
      ...step,
      inputMap: getNewObj(
        objKey,
        { value: objParams.default },
      ),
    });
  }

  const value = step.inputMap[objKey]
    && typeof step.inputMap[objKey].value === 'boolean'
    ? step.inputMap[objKey].value : objParams.default;

  const [checked, setChecked] = React.useState(value);

  const handleChange = (event) => {
    setChecked(event.target.checked);
    updateStep({
      ...step,
      inputMap: getNewObj(objKey, { value: event.target.checked }),
    });
  };

  return (
    <div>
      <Checkbox
        disabled={!owner}
        onChange={handleChange}
        checked={checked}
      />
    </div>
  );
}

PipelineStepInputBoolean.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputBoolean;
