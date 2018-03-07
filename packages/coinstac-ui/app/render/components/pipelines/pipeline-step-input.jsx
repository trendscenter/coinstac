import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Col,
  ControlLabel,
  Checkbox,
  DropdownButton,
  FormGroup,
  FormControl,
  MenuItem,
  Row,
} from 'react-bootstrap';
import update from 'immutability-helper';
import PipelineStepMemberTable from './pipeline-step-member-table';

const styles = {
  covariateColumns: { textAlign: 'center' },
};

export default class PipelineStepInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isClientProp: props.objKey === 'covariates' || props.objKey === 'data',
    };

    this.addClientProp = this.addClientProp.bind(this);
    this.getNewObj = this.getNewObj.bind(this);
  }

  // TODO: This overwrites other objects in state inputMap, init arrays on in call to getNewObj?
  // componentWillMount() {
  //   const { objKey, objParams, step, updateStep } = this.props;

  //   // Initialize array of length input min if array of inputs required
  //   if (!step.inputMap[objKey] && objParams.type === 'array' &&
  //       !objParams.values && !(objKey === 'covariates' || objKey === 'data')) {
  //     let initArray = [];

  //     if (objParams.defaultValue && Array.isArray(objParams.defaultValue)) {
  //       initArray = Array.from({ length: objParams.min }, (v, i) => objParams.defaultValue[i]);
  //     }

  //     console.log({
  //       ...step,
  //       inputMap: {
  //         ...step.inputMap,
  //         [objKey]: initArray,
  //       },
  //     });

  //     updateStep({
  //       ...step,
  //       inputMap: {
  //         ...step.inputMap,
  //         [objKey]: initArray,
  //       },
  //     });
  //   }

  //   // console.log(objKey);

  //   // if (!step.inputMap[objKey] && (objKey === 'covariates' || objKey === 'data')) {
  //   //   updateStep({
  //   //     ...step,
  //   //     inputMap: {
          
  //   //     }this.getNewObj(
  //   //       objKey,
  //   //       { ownerMappings: [] }
  //   //     ),
  //   //   });
  //   // }
  // }

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

  render() {
    const {
      objKey,
      objParams,
      parentKey,
      possibleInputs,
      owner,
      step,
      updateStep,
    } = this.props;
    let sourceDropDownLabel = null;
    let isValue = false;
    let isFromCache;

    if (step.inputMap[objKey] && step.inputMap[objKey].fromCache) {
      sourceDropDownLabel = `Computation ${step.inputMap[objKey].fromCache.step + 1}: ${step.inputMap[objKey].fromCache.label}`;
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].value) {
      isValue = true;
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].fromCache) {
      isFromCache = true;
    }

    return (
      <div>
        {(objKey === 'covariates' || objKey === 'data') &&
          <div style={{ paddingLeft: 10 }}>
            <p className="bold">{objParams.label}</p>
            <Button
              disabled={!owner}
              bsStyle="primary"
              onClick={this.addClientProp}
              style={{ marginBottom: 10, marginLeft: 10 }}
            >
              <span aria-hidden="true" className="glphicon glyphicon-plus" /> Add {objParams.label}
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
        }

        {objKey !== 'covariates' && objKey !== 'data' &&
          <Row style={{ paddingLeft: 10 }}>
            <Col xs={6}>
              <FormGroup controlId={`${parentKey}-form-group`}>
                {objParams.label &&
                  <ControlLabel>{objParams.label}</ControlLabel>
                }

                {objParams.description &&
                  <p>{objParams.description}</p>
                }

                {objParams.type === 'number' &&
                  <FormControl
                    disabled={!owner || isFromCache}
                    inputRef={(input) => { this[objKey] = input; }}
                    onChange={() => updateStep({
                      ...step,
                      inputMap: this.getNewObj(objKey,
                        this[objKey].value ? { value: parseFloat(this[objKey].value) } : 'DELETE_VAR'
                      ),
                    })}
                    type="number"
                    value={
                      step.inputMap[objKey] && 'value' in step.inputMap[objKey] ?
                      step.inputMap[objKey].value : ''
                    }
                  />
                }

                {objParams.type === 'array' && objParams.values &&
                  <FormControl
                    componentClass="select"
                    disabled={!owner}
                    inputRef={(input) => { this[objKey] = input; }}
                    multiple
                    onChange={() => updateStep({
                      ...step,
                      inputMap: this.getNewObj(
                        objKey,
                        this[objKey].value ?
                          { value: this.getSelectList(step.inputMap[objKey].value, this[objKey].value) } : 'DELETE_VAR'
                      ),
                    })}
                    value={
                      step.inputMap[objKey] && 'value' in step.inputMap[objKey] ?
                      step.inputMap[objKey].value : []
                    }
                  >
                    {objParams.values.map(val =>
                      <option key={`${val}-select-option`} value={val}>{val}</option>
                    )}
                  </FormControl>
                }

                {objParams.type === 'array' && !objParams.values && objParams.items === 'number' &&
                  step.inputMap[objKey] && step.inputMap[objKey].value.map((val, i) => (
                    <FormControl
                      key={`${objKey}-${i}`}
                      disabled={!owner}
                      inputRef={(input) => { this[i] = input; }}
                      onChange={() => updateStep({
                        ...step,
                        inputMap: {
                          [objKey]: {
                            value: update(step.inputMap[objKey].value, {
                              $splice: [[i, 1, parseFloat(this[i].value)]],
                            }),
                          },
                        },
                      })}
                      type="number"
                      value={
                        step.inputMap[objKey] && step.inputMap[objKey][i] && 'value' in step.inputMap[objKey][i] ?
                        step.inputMap[objKey][i].value : ''
                      }
                    />
                  ))
                }

                {objParams.type === 'boolean' &&
                  <Checkbox
                    disabled={!owner}
                    inputRef={(input) => { this[objKey] = input; }}
                    onChange={() => updateStep({
                      ...step,
                      inputMap: this.getNewObj(objKey,
                        this[objKey].value ? { value: this[objKey].value } : 'DELETE_VAR'
                      ),
                    })}
                    value={
                      step.inputMap[objKey] && 'value' in step.inputMap[objKey] ?
                      step.inputMap[objKey].value : ''
                    }
                  >
                    True?
                  </Checkbox>
                }
              </FormGroup>
            </Col>
            <Col xs={6} style={{ paddingTop: 25 }}>
              <DropdownButton
                id={`input-source-${objKey}-dropdown`}
                title={(!isValue && !isFromCache) ? 'Data Source' : (sourceDropDownLabel || 'Owner Defined Value')}
                disabled={!owner || !objParams.type || isValue}
              >
                {
                  <MenuItem
                    disabled={!owner}
                    eventKey={`clear-Computation-${objKey}-inputs-menuitem`}
                    key={`clear-Computation-${objKey}-inputs-menuitem`}
                    onClick={() => updateStep({
                      ...step,
                      inputMap: this.getNewObj(objKey, 'DELETE_VAR'),
                    })}
                  >
                    None
                  </MenuItem>
                }
                {possibleInputs.map(itemObj => (
                  // Iterate over possible computation inputs
                  Object.entries(itemObj.inputs)
                    // Filter out inputs that don't match type
                    .filter(filterIn => filterIn[1].type === objParams.type)
                    .map(itemInput => (
                      <MenuItem
                        disabled={!owner}
                        eventKey={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
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
                ))}
              </DropdownButton>
            </Col>
          </Row>
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
