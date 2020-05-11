import React from 'react';
import PropTypes from 'prop-types';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

class PipelineStepInputArray extends React.Component {
  componentDidMount() {
    const {
      objKey, objParams, owner, updateStep, getNewObj, getSelectList, step,
    } = this.props;

    if (!step.inputMap[objKey] && 'default' in objParams && owner) {
      updateStep({
        ...step,
        inputMap: getNewObj(
          objKey,
          { value: getSelectList(step.inputMap[objKey].value, objParams.default) }
        ),
      });
    }
  }

  render() {
    const {
      objKey, objParams, owner, updateStep, getNewObj, getSelectList, step,
    } = this.props;

    return (
      <Select
        disabled={!owner}
        multiple
        onChange={event => updateStep({
          ...step,
          inputMap: getNewObj(
            objKey,
            event.target.value
              ? { value: getSelectList(step.inputMap[objKey].value, event.target.value) }
              : 'DELETE_VAR'
          ),
        })}
        value={
          step.inputMap[objKey] && 'value' in step.inputMap[objKey]
            ? step.inputMap[objKey].value
            : [objParams.default]
        }
      >
        {
          objParams.values.map(val => (
            <MenuItem key={`${val}-select-option`} value={val}>{val}</MenuItem>
          ))
        }
      </Select>
    );
  }
}

PipelineStepInputArray.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  getSelectList: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputArray;
