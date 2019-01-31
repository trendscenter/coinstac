import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import update from 'immutability-helper';
import PipelineStepMemberTable from './pipeline-step-member-table';

const styles = theme => ({
  addObjButton: {
    marginBottom: theme.spacing.unit,
    marginLeft: theme.spacing.unit,
  },
  lambdaContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    marginLeft: theme.spacing.unit,
  },
});

class PipelineStepInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isClientProp: props.objKey === 'covariates' || props.objKey === 'data',
      openInputSourceMenu: false,
    };

    this.addClientProp = this.addClientProp.bind(this);
    this.getNewObj = this.getNewObj.bind(this);
  }

  getNewObj(
    prop, value, clientPropIndex, isValueArray
  ) { // eslint-disable-line class-methods-use-this
    const { objKey, possibleInputs, step: { inputMap } } = this.props;
    const inputCopy = { ...inputMap };

    // Remove alternate source prop
    if (value.fromCache) {
      delete inputCopy.value;
    } else if (value.value) {
      delete inputCopy.fromCache;
    }

    if (!this.state.isClientProp && value === 'DELETE_VAR') {
      delete inputCopy[prop];
      return { ...inputCopy };
    } else if (!this.state.isClientProp) {
      return { ...inputCopy, [prop]: value };
    }

    let newArr = [];

    // Prop to change is an array type, add or remove new value to/from existing array
    if (isValueArray) {
      const newValue = value;

      if (inputCopy[objKey].ownerMappings[clientPropIndex][prop]) {
        value = [...inputCopy[objKey].ownerMappings[clientPropIndex][prop]];
      } else {
        value = [];
      }

      const index = value.indexOf(newValue);
      if (index > -1) {
        value.splice(index, 1);
      } else {
        value.push(newValue);
      }
    }

    if (inputCopy[objKey]) {
      newArr = [...inputCopy[objKey].ownerMappings];

      let newObj = { ...newArr[clientPropIndex], [prop]: value };
      if (prop === 'fromCache') {
        newObj = { [prop]: value };
      } else if ('fromCache' in newObj) {
        newObj.type = possibleInputs[newObj.fromCache.step].inputs[newObj.fromCache.variable].type;
        delete newObj.fromCache;
      }

      newArr.splice(clientPropIndex, 1, newObj);
    }

    return { ...inputCopy, [objKey]: { ownerMappings: [...newArr] } };
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

  // Covars or data items
  addClientProp() {
    const {
      objKey,
      step,
      updateStep,
    } = this.props;

    let ownerMappings = [{}];
    if (step.inputMap[objKey] && 'ownerMappings' in step.inputMap[objKey]) {
      ownerMappings = [
        ...step.inputMap[objKey].ownerMappings,
        {},
      ];
    }

    updateStep({
      ...step,
      inputMap: {
        ...step.inputMap,
        [objKey]: {
          ownerMappings,
        },
      },
    });
  }

  openInputSourceMenu(event) {
    this.inputSourceButtonElement = event.currentTarget;
    this.setState({ openInputSourceMenu: true });
  }

  closeInputSourceMenu() {
    this.setState({ openInputSourceMenu: false });
  }

  render() {
    const {
      objKey,
      objParams,
      parentKey,
      possibleInputs,
      owner,
      step,
      updateStep,
      classes,
    } = this.props;

    const { openInputSourceMenu } = this.state;

    let sourceDropDownLabel = null;
    let isValue = false;
    let isFromCache;

    if (step.inputMap[objKey] && step.inputMap[objKey].fromCache) {
      const cacheLabel = possibleInputs[step.inputMap[objKey].fromCache.step]
        .inputs[step.inputMap[objKey].fromCache.variable].label;
      sourceDropDownLabel = `Computation ${step.inputMap[objKey].fromCache.step + 1}: ${cacheLabel}`;
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].value) {
      isValue = true;
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].fromCache) {
      isFromCache = true;
    }

    return (
      <div>
        {
          (objKey === 'covariates' || objKey === 'data')
          && (
            <div style={{ paddingLeft: 10 }}>
              <Typography variant="subtitle2">{ objParams.label }</Typography>
              <Button
                variant="contained"
                color="primary"
                disabled={!owner}
                onClick={this.addClientProp}
                className={classes.addObjButton}
              >
                <AddIcon />
                {`Add ${objParams.label}`}
              </Button>
              <PipelineStepMemberTable
                getNewObj={this.getNewObj}
                objKey={objKey}
                objParams={objParams}
                owner={owner}
                parentKey={parentKey}
                possibleInputs={possibleInputs}
                step={step}
                updateStep={updateStep}
              />
            </div>
          )
        }

        {
          objKey !== 'covariates' && objKey !== 'data'
          && (
            <div className={classes.lambdaContainer}>
              <div>
                {
                  objParams.label
                  && <Typography variant="subtitle2">{ objParams.label }</Typography>
                }
                {
                  objParams.description
                  && <Typography variant="body1">{ objParams.description }</Typography>
                }
                {
                  objParams.type === 'number'
                  && (
                    <TextField
                      disabled={!owner || isFromCache}
                      name={`step-${objKey}`}
                      onChange={event => updateStep({
                        ...step,
                        inputMap: this.getNewObj(objKey,
                          event.target.value ? { value: parseFloat(event.target.value) } : 'DELETE_VAR'
                        ),
                      })}
                      type="number"
                      value={
                        step.inputMap[objKey] && 'value' in step.inputMap[objKey]
                          ? step.inputMap[objKey].value
                          : ''
                      }
                    />
                  )
                }
                {
                  objParams.type === 'array' && objParams.values
                  && (
                    <Select
                      disabled={!owner}
                      multiple
                      onChange={event => updateStep({
                        ...step,
                        inputMap: this.getNewObj(
                          objKey,
                          event.target.value
                            ? { value: this.getSelectList(step.inputMap[objKey].value, event.target.value) }
                            : 'DELETE_VAR'
                        ),
                      })}
                      value={
                        step.inputMap[objKey] && 'value' in step.inputMap[objKey]
                          ? step.inputMap[objKey].value
                          : []
                      }
                    >
                      {
                        objParams.values.map(val => (
                          <MenuItem key={`${val}-select-option`} value={val}>{val}</MenuItem>
                        ))
                      }
                    </Select>
                  )
                }
                {
                  objParams.type === 'array' && !objParams.values && objParams.items === 'number'
                  && step.inputMap[objKey] && step.inputMap[objKey].value.map((val, i) => (
                    <TextField
                      key={`${objKey}-${i}`}
                      disabled={!owner}
                      onChange={event => updateStep({
                        ...step,
                        inputMap: {
                          [objKey]: {
                            value: update(step.inputMap[objKey].value, {
                              $splice: [[i, 1, parseFloat(event.target.value)]],
                            }),
                          },
                        },
                      })}
                      type="number"
                      value={
                        step.inputMap[objKey] && step.inputMap[objKey][i] && 'value' in step.inputMap[objKey][i]
                          ? step.inputMap[objKey][i].value
                          : ''
                      }
                    />
                  ))
                }
                {
                  objParams.type === 'boolean'
                  && (
                    <Checkbox
                      disabled={!owner}
                      onChange={event => updateStep({
                        ...step,
                        inputMap: this.getNewObj(objKey,
                          event.target.checked ? { value: event.target.checked } : 'DELETE_VAR'
                        ),
                      })}
                      value={
                        step.inputMap[objKey] && 'value' in step.inputMap[objKey]
                          ? step.inputMap[objKey].value
                          : ''
                      }
                    >
                      True?
                    </Checkbox>
                  )
                }
              </div>
              <div>
                <Button
                  id={`input-source-${objKey}-dropdown`}
                  disabled={!owner || !objParams.type || isValue}
                >
                  {(!isValue && !isFromCache) ? 'Data Source' : (sourceDropDownLabel || 'Owner Defined Value')}
                </Button>
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
                                }
                              ),
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
          )
        }
      </div>
    );
  }
}

PipelineStepInput.defaultProps = {
  parentKey: '',
  owner: false,
  possibleInputs: [],
  updateStep: null,
};

PipelineStepInput.propTypes = {
  parentKey: PropTypes.string,
  pipelineIndex: PropTypes.number.isRequired,
  possibleInputs: PropTypes.array,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func,
};

export default withStyles(styles)(PipelineStepInput);
