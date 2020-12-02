import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import update from 'immutability-helper';

function PipelineStepInputSet({
  objKey, objParams, owner, isFromCache, updateStep, getNewObj, step
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

  let val = step.inputMap[objKey] && step.inputMap[objKey].value ?
    step.inputMap[objKey].value : objParams.default;

  const [value, setValue] = React.useState(val);

  const handleChange = (event) => {
    updateStep({
      ...step,
      inputMap: getNewObj(objKey, {
        value: update(step.inputMap[objKey].value, {
          $splice: [[i, 1, event.target.value]],
        }),
      }),
    });
    React.useEffect(() => {
      setValue(step.inputMap[objKey].value);
    }, [step]);
  }

  return (
    <div className="input-set">
      {
        value && value.map((item, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${objKey}-${i}`}>
            <TextField
              disabled={!owner || isFromCache}
              name={`step-${objKey}-${i}`}
              value={item}
              onChange={handleChange}
            />
          </div>
        ))
      }
    </div>
  );
}

PipelineStepInputSet.defaultProps = {
  isFromCache: false,
};

PipelineStepInputSet.propTypes = {
  isFromCache: PropTypes.bool,
  objKey: PropTypes.string.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputSet;
