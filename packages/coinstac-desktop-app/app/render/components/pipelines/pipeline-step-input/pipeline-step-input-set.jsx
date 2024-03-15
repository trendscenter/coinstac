import TextField from '@material-ui/core/TextField';
import update from 'immutability-helper';
import PropTypes from 'prop-types';
import React from 'react';

function PipelineStepInputSet({
  objKey, owner, isFromCache, updateStep, getNewObj, step,
}) {
  if (!step) {
    return null;
  }

  return (
    <div>
      {
        step.inputMap[objKey] && step.inputMap[objKey].value.map((item, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${objKey}-${i}`}>
            <TextField
              disabled={!owner || isFromCache}
              name={`step-${objKey}-${i}`}
              value={item}
              onChange={event => updateStep({
                ...step,
                inputMap: getNewObj(objKey, {
                  value: update(step.inputMap[objKey].value, {
                    $splice: [[i, 1, event.target.value]],
                  }),
                }),
              })}
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
