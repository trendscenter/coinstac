/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import update from 'immutability-helper';

function PipelineStepInputMatrix({
  objKey, owner, isFromCache, updateStep, getNewObj, step,
}) {
  if (!step.inputMap[objKey] && 'default' in objParams && owner) {
    updateStep({
      ...step,
      inputMap: getNewObj(
        objKey,
        { value: objParams.default }
      ),
    });
  }

  return (
    <div>
      {
        step.inputMap[objKey] && step.inputMap[objKey].value.map((line, i) => (
          <div key={`${objKey}-${i}`}>
            {
              line.map((cell, j) => (
                <TextField
                  key={`${objKey}-${i}-${j}`}
                  disabled={!owner || isFromCache}
                  name={`step-${objKey}-${i}-${j}`}
                  value={cell}
                  onChange={event => updateStep({
                    ...step,
                    inputMap: getNewObj(objKey, {
                      value: update(step.inputMap[objKey].value, {
                        [i]: { $splice: [[j, 1, event.target.value]] },
                      }),
                    }),
                  })}
                  style={{ marginRight: '10px', maxWidth: '50px' }}
                />
              ))
            }
          </div>
        ))
      }
    </div>
  );
}

PipelineStepInputMatrix.defaultProps = {
  isFromCache: false,
};

PipelineStepInputMatrix.propTypes = {
  isFromCache: PropTypes.bool,
  objKey: PropTypes.string.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputMatrix;
