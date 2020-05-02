import React from 'react';
import PropTypes from 'prop-types';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';

class PipelineStepInputRadio extends React.Component {
  componentDidMount() {
    const {
      objKey, objParams, owner, updateStep, getNewObj, step,
    } = this.props;

    if (!step.inputMap[objKey] && 'default' in objParams && owner) {
      updateStep({
        ...step,
        inputMap: getNewObj(objKey, { value: objParams.default }),
      });
    }
  }

  render() {
    const {
      objKey, objParams, owner, updateStep, getNewObj, step,
    } = this.props;

    return (
      <RadioGroup
        disabled={!owner}
        onChange={event => updateStep({
          ...step,
          inputMap: getNewObj(objKey, event.target.checked ? { value: event.target.checked } : 'DELETE_VAR'),
        })}
        value={
          step.inputMap[objKey] && 'value' in step.inputMap[objKey]
            ? step.inputMap[objKey].value
            : objParams.default
        }
      >
        {
          objParams.values.map(val => (
            <FormControlLabel
              value={val}
              control={<Radio />}
              label={val}
              labelPlacement="start"
            />
          ))
        }
      </RadioGroup>
    );
  }
}

PipelineStepInputRadio.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputRadio;
