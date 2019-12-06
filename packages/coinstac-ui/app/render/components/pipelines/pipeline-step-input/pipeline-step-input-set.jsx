import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import update from 'immutability-helper';

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
          <div>
            <TextField
              key={`${objKey}-${i}`}
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

PipelineStepInputSet.propTypes = {
  objKey: PropTypes.string.isRequired,
  owner: PropTypes.bool.isRequired,
  isFromCache: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func.isRequired,
  getNewObj: PropTypes.func.isRequired,
};

export default PipelineStepInputSet;
