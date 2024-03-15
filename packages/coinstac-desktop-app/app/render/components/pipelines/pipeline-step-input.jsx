import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import InfoIcon from '@material-ui/icons/Info';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import PipelineStepInputArray from './pipeline-step-input/pipeline-step-input-array';
import PipelineStepInputBoolean from './pipeline-step-input/pipeline-step-input-boolean';
import PipelineStepInputCsv from './pipeline-step-input/pipeline-step-input-csv';
import PipelineStepInputDirectory from './pipeline-step-input/pipeline-step-input-directory';
import PipelineStepInputFiles from './pipeline-step-input/pipeline-step-input-files';
import PipelineStepInputFreesurfer from './pipeline-step-input/pipeline-step-input-freesurfer';
import PipelineStepInputMatrix from './pipeline-step-input/pipeline-step-input-matrix';
import PipelineStepInputNumberTextField from './pipeline-step-input/pipeline-step-input-number-textfield';
import PipelineStepInputObject from './pipeline-step-input/pipeline-step-input-object';
import PipelineStepInputRadio from './pipeline-step-input/pipeline-step-input-radio';
import PipelineStepInputRange from './pipeline-step-input/pipeline-step-input-range';
import PipelineStepInputSelect from './pipeline-step-input/pipeline-step-input-select';
import PipelineStepInputSet from './pipeline-step-input/pipeline-step-input-set';
import PipelineStepInputTextField from './pipeline-step-input/pipeline-step-input-textfield';
import PipelineStepInputUsers from './pipeline-step-input/pipeline-step-input-users';

const styles = theme => ({
  pipelineStep: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing(2),
  },
  pipelineStepSection: {
    width: '100%',
  },
  pipelineStepLabel: {
    marginBottom: theme.spacing(1),
  },
  pipelineStepActions: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});

class PipelineStepInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      openInputSourceMenu: false,
    };

    this.addClientProp = this.addClientProp.bind(this);
    this.getNewObj = this.getNewObj.bind(this);
  }

  componentDidUpdate = () => {
    const {
      objParams, updateStep, step,
    } = this.props;
    if (step && (objParams.type === 'freesurfer' || objParams.type === 'files') && !step.dataMeta) {
      updateStep({
        ...step,
        dataMeta: objParams,
      });
    }
  }

  getNewObj(
    prop, value, clientPropIndex, isValueArray,
  ) { // eslint-disable-line class-methods-use-this
    const {
      objKey, objParams, possibleInputs, step: { inputMap },
    } = this.props;
    const inputCopy = { ...inputMap };

    // Close alternate source prop
    if (value.fromCache) {
      delete inputCopy.value;
    } else if (value.value) {
      delete inputCopy.fromCache;
    }

    if (objParams.source === 'owner' && objParams.type !== 'freesurfer' && objParams.type !== 'files') {
      if (value === 'DELETE_VAR') {
        delete inputCopy[prop];
        return { ...inputCopy };
      }

      if (prop in inputCopy) {
        return {
          ...inputCopy,
          [prop]: {
            ...inputCopy[prop],
            ...value,
          },

        };
      }

      return {
        ...inputCopy,
        [prop]: {
          fulfilled: true,
          ...value,
        },
      };
    }

    let newArr = [];

    // Prop to change is an array type, add or remove new value to/from existing array
    if (isValueArray) {
      const newValue = value;

      // eslint-disable-next-line no-param-reassign
      value = [...(inputCopy[objKey].value[clientPropIndex][prop] || [])];

      const index = value.indexOf(newValue);
      if (index > -1) {
        value.splice(index, 1);
      } else {
        value.push(newValue);
      }
    }

    if (inputCopy[objKey]) {
      newArr = [...inputCopy[objKey].value];

      let newObj = { ...newArr[clientPropIndex], [prop]: value };
      if (prop === 'fromCache') {
        newObj = { [prop]: value };
      } else if ('fromCache' in newObj) {
        newObj.type = possibleInputs[newObj.fromCache.step].inputs[newObj.fromCache.variable].type;
        delete newObj.fromCache;
      }

      newArr.splice(clientPropIndex, 1, newObj);
    }

    if (objKey in inputCopy) {
      return {
        ...inputCopy,
        [objKey]: {
          ...inputCopy[objKey],
          value: [...newArr],
        },
      };
    }

    return {
      ...inputCopy,
      [objKey]: {
        fulfilled: objParams.source === 'owner',
        value: [...newArr],
      },
    };
  }

  getSelectList(array, value) { // eslint-disable-line class-methods-use-this
    if (array) {
      const index = array.indexOf(value);
      if (index > -1) {
        return [...array.splice(index, 1)];
      }
      return [...array, value];
    }

    return [value];
  }

  openInputSourceMenu = (event) => {
    this.inputSourceButtonElement = event.currentTarget;
    this.setState({ openInputSourceMenu: true });
  }

  closeInputSourceMenu = () => {
    this.setState({ openInputSourceMenu: false });
  }

  // Covars or data items
  addClientProp() {
    const {
      objKey,
      objParams,
      step,
      updateStep,
    } = this.props;

    let value = [{}];
    if (step.inputMap[objKey] && 'value' in step.inputMap[objKey]) {
      value = [
        ...step.inputMap[objKey].value,
        {},
      ];
    }

    updateStep({
      ...step,
      inputMap: {
        ...step.inputMap,
        [objKey]: {
          fulfilled: objParams.source === 'owner',
          value,
        },
      },
    });
  }

  render() {
    const {
      objKey,
      objParams,
      possibleInputs,
      owner,
      step,
      updateStep,
      users,
      classes,
      headlessMembers,
    } = this.props;

    const { openInputSourceMenu } = this.state;

    let sourceDropDownLabel = null;
    let isValue = false;
    let isFromCache;
    let visibility = 'block';

    if (objParams.conditional
      && objParams.conditional.variable
      && step.inputMap) {
      visibility = 'none';
      if (step.inputMap[objParams.conditional.variable]
        && step.inputMap[objParams.conditional.variable].value
        === objParams.conditional.value) {
        visibility = 'block';
      }
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].fromCache) {
      const cacheLabel = possibleInputs[step.inputMap[objKey].fromCache.step]
        .inputs[step.inputMap[objKey].fromCache.variable].label;
      sourceDropDownLabel = `Computation ${step.inputMap[objKey].fromCache.step + 1}: ${cacheLabel}`;
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].value) {
      isValue = true;
    }

    if (step.inputMap[objKey] && typeof step.inputMap[objKey].value === 'boolean'
      && step.inputMap[objKey].value === false) {
      isValue = true;
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].fromCache) {
      isFromCache = true;
    }

    return (
      <div className={classes.pipelineStep} style={{ display: visibility }} key={`pipestep-${objKey}`}>
        <div className={classes.pipelineStepSection}>
          <Typography variant="subtitle2" className={classes.pipelineStepLabel}>
            <span>{objParams.label}</span>
            {
              objParams.tooltip && (
                <Tooltip title={objParams.tooltip} placement="right-start">
                  <InfoIcon />
                </Tooltip>
              )
            }
          </Typography>
          {
            objParams.description
            && <Typography variant="body2">{objParams.description}</Typography>
          }
          {
            objParams.type === 'csv' && (
              <PipelineStepInputCsv
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                addClientProp={this.addClientProp}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {
            objParams.type === 'freesurfer' && (
              <PipelineStepInputFreesurfer
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                addClientProp={this.addClientProp}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
                headlessMembers={headlessMembers}
              />
            )
          }
          {
            objParams.type === 'files' && (
              <PipelineStepInputFiles
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                addClientProp={this.addClientProp}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {objParams.type === 'directory' && (
            <PipelineStepInputDirectory />
          )}
          {
            objParams.type === 'string' && (
              <PipelineStepInputTextField
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                isFromCache={isFromCache}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {
            objParams.type === 'number'
            && (
              <PipelineStepInputNumberTextField
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                isFromCache={isFromCache}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {
            objParams.type === 'array' && objParams.values && (
              <PipelineStepInputArray
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                getSelectList={this.getSelectList}
                step={step}
              />
            )
          }
          {
            objParams.type === 'set' && (
              <PipelineStepInputSet
                objKey={objKey}
                owner={owner}
                isFromCache={isFromCache}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {
            objParams.type === 'range' && (
              <PipelineStepInputRange
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {
            objParams.type === 'matrix'
            && (
              <PipelineStepInputMatrix
                objKey={objKey}
                owner={owner}
                isFromCache={isFromCache}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {
            objParams.type === 'select' && (
              <PipelineStepInputSelect
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {
            objParams.type === 'radio' && (
              <PipelineStepInputRadio
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {
            objParams.type === 'boolean' && (
              <PipelineStepInputBoolean
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
              />
            )
          }
          {
            objParams.type === 'users' && (
              <PipelineStepInputUsers
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
                users={users}
              />
            )
          }
          {
            objParams.type === 'object' && (
              <PipelineStepInputObject
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                updateStep={updateStep}
                getNewObj={this.getNewObj}
                step={step}
                users={users}
              />
            )
          }
        </div>
        <div className={classes.pipelineStepActions}>
          {(isValue || isFromCache) && (
            <Typography variant="subtitle1" color="textSecondary">
              {(sourceDropDownLabel || 'Owner Defined Value')}
            </Typography>
          )}
          <Menu
            anchorEl={this.inputSourceButtonElement}
            open={openInputSourceMenu}
            onClose={this.closeInputSourceMenu}
          >
            <MenuItem
              onClick={() => updateStep({
                ...step,
                inputMap: this.getNewObj(objKey, 'DELETE_VAR'),
              })}
            >
              None
            </MenuItem>
            {
              possibleInputs.map(itemObj => (
                // Iterate over possible computation inputs
                Object.entries(itemObj.inputs)
                  // Filter out inputs that don't match type
                  .filter(filterIn => filterIn[1].type === objParams.type)
                  .map(itemInput => (
                    <MenuItem
                      key={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                      onClick={() => updateStep({
                        ...step,
                        inputMap: this.getNewObj(objKey,
                          {
                            fromCache: {
                              step: itemObj.possibleInputIndex,
                              variable: itemInput[0],
                            },
                          }),
                      })}
                    >
                      {`Computation ${itemObj.possibleInputIndex + 1}: ${itemInput[1].label}`}
                    </MenuItem>
                  ))
              ))
            }
          </Menu>
        </div>
      </div>
    );
  }
}

PipelineStepInput.defaultProps = {
  owner: false,
  possibleInputs: [],
  users: [],
  headlessMembers: {},
  updateStep: null,
};

PipelineStepInput.propTypes = {
  classes: PropTypes.object.isRequired,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool,
  possibleInputs: PropTypes.array,
  step: PropTypes.object.isRequired,
  users: PropTypes.array,
  headlessMembers: PropTypes.object,
  updateStep: PropTypes.func,
};

export default withStyles(styles)(PipelineStepInput);
