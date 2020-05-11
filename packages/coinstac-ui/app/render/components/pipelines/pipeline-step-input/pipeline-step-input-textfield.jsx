import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';

class PipelineStepInputTextField extends React.Component {
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
      objKey, objParams, owner, isFromCache, updateStep, getNewObj, step,
    } = this.props;

    if (!step) {
      return null;
    }

    return (
      <TextField
        disabled={!owner || isFromCache}
        name={`step-${objKey}`}
        onChange={event => updateStep({
          ...step,
          inputMap: getNewObj(objKey, event.target.value ? { value: event.target.value } : 'DELETE_VAR'),
        })}
        value={
          step.inputMap[objKey] && 'value' in step.inputMap[objKey]
            ? step.inputMap[objKey].value
            : objParams.default
        }
      />
    );
  }
}

PipelineStepInputTextField.defaultProps = {
  isFromCache: false,
};

PipelineStepInputTextField.propTypes = {
  isFromCache: PropTypes.bool,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputTextField;
