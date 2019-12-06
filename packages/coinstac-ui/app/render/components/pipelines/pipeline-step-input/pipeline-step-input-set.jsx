import React from 'react';
import TextField from '@material-ui/core/TextField';
import update from 'immutability-helper';

function PipelineStepInputSet(objKey, owner, isFromCache, updateStep, getNewObj, step) {
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

export default PipelineStepInputSet;
