import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ControlLabel,
  DropdownButton,
  FormGroup,
  FormControl,
  MenuItem,
  Table,
} from 'react-bootstrap';
import update from 'immutability-helper';
import variableOptions from './pipeline-variable-data-options.json';

export default class PipelineStepMemberTable extends Component {
  render() {
    const {
      getNewObj,
      getSourceMenuItem,
      objKey,
      objParams,
      owner,
      parentKey,
      possibleInputs,
      step,
      updateStep,
    } = this.props;

    return (
      <Table style={{ marginLeft: 10 }}>
        {step.inputMap[objKey] && step.inputMap[objKey].length > 0 &&
          <thead>
            {objKey === 'covariates' &&
              <tr>
                <th>Data Type</th>
                <th>Name</th>
                <th>Variable Type</th>
                <th>Operation</th>
                <th>Operator</th>
                <th>Source</th>
                <th />
              </tr>
            }
            {objKey === 'data' &&
              <tr>
                <th>Data Type</th>
                <th>Interest</th>
                <th>Source</th>
                <th />
              </tr>
            }
          </thead>
        }
        {step.inputMap[objKey] && step.inputMap[objKey].map((obj, index) => (
          <tbody style={{ border: 'none' }} key={`${objKey}-${index}`}>
            <tr>
              <td>
                <DropdownButton
                  bsStyle="info"
                  id={`${objKey}-${index}-data-dropdown`}
                  title={obj.type || 'Data Type'}
                  disabled={!owner}
                >
                  {objParams.items.map(item => (
                    <MenuItem
                      eventKey={`${item}-menuitem`}
                      key={`${item}-menuitem`}
                      onClick={() => updateStep({
                        ...step,
                        inputMap: getNewObj('type', item, index),
                      })}
                    >
                      {item}
                    </MenuItem>
                  ))}
                </DropdownButton>
              </td>
              {objKey === 'data' &&
                <td>
                  {obj.type === 'FreeSurfer' &&
                    <FormControl
                      componentClass="select"
                      multiple
                      disabled={!owner}
                      inputRef={(input) => { this[obj.type] = input; }}
                      value={obj.value || []}
                      onChange={() => updateStep({
                        ...step,
                        inputMap: getNewObj('value', this[obj.type].value, index, true),
                      })}
                    >
                      <option key="none-select-option" value="none">None</option>
                      {variableOptions.freesurferROIs.map(name => (
                        <option key={`${name}-select-option`} value={name}>
                          {name}
                        </option>
                      ))}
                    </FormControl>
                  }
                </td>
              }
              {objKey === 'covariates' &&
                <td>
                  <FormGroup controlId={`${parentKey}-form-group`}>
                    <FormControl
                      disabled={!owner}
                      placeholder="Variable Name"
                      type="input"
                      value={obj.name || ''}
                      inputRef={(input) => { this[`${index}-name`] = input; }}
                      onChange={() => updateStep({
                        ...step,
                        inputMap: getNewObj('name', this[`${index}-name`].value, index),
                      })}
                    />
                  </FormGroup>
                </td>
              }
              {objKey === 'covariates' &&
                <td>
                  <DropdownButton
                    id={`${objKey}-${index}-vartype-dropdown`}
                    title={obj.varType || 'Variable Type'}
                    disabled={!owner}
                  >
                    {['Dependent', 'Independent'].map(name => (
                      <MenuItem
                        eventKey={`${name}-vartype-menuitem`}
                        key={`${name}-vartype-menuitem`}
                        onClick={() => updateStep({
                          ...step,
                          inputMap: getNewObj('varType', name, index),
                        })}
                      >
                        {name}
                      </MenuItem>
                    ))}
                  </DropdownButton>
                </td>
              }
              {objKey === 'covariates' &&
                <td>
                  <DropdownButton
                    id={`${objKey}-${index}-operation-dropdown`}
                    title={obj.operation || 'Operation'}
                    disabled={!owner || obj.type !== 'number'}
                  >
                    <MenuItem
                      eventKey={'none-operation-menuitem'}
                      key={'none-operation-menuitem'}
                      onClick={() => updateStep({
                        ...step,
                        inputMap: getNewObj('operation', '', index),
                      })}
                    >
                      None
                    </MenuItem>
                    {variableOptions.operations.map(name => (
                      <MenuItem
                        eventKey={`${name}-operation-menuitem`}
                        key={`${name}-operation-menuitem`}
                        onClick={() => updateStep({
                          ...step,
                          inputMap: getNewObj('operation', name, index),
                        })}
                      >
                        {name}
                      </MenuItem>
                    ))}
                  </DropdownButton>
                </td>
              }
              {objKey === 'covariates' &&
                <td>
                  <FormGroup controlId={`${parentKey}-operation-form-group`}>
                    <FormControl
                      disabled={!owner || !obj.operation}
                      placeholder="Operator"
                      type="number"
                      value={obj.operator || ''}
                      inputRef={(input) => { this[`${index}-operator`] = input; }}
                      onChange={() => updateStep({
                        ...step,
                        inputMap: getNewObj('operator', this[`${index}-operator`].value, index),
                      })}
                    />
                  </FormGroup>
                </td>
              }
              <td>
                <DropdownButton
                  id={`input-source-${index}-dropdown`}
                  title={obj.source.inputLabel || 'Data Source'}
                  disabled={!owner || !obj.type || !obj.name}
                >
                  <MenuItem
                    eventKey={`${obj.name}-file-source-menuitem`}
                    key={`${obj.name}-file-source-menuitem`}
                    onClick={() => this.props.updateStep({
                      ...step,
                      inputMap: getNewObj(
                        'source',
                        {
                          pipelineIndex: itemObj.possibleInputIndex,
                          inputKey: itemInput[0],
                          inputLabel: `Computation ${itemObj.possibleInputIndex + 1}: ${itemInput[1].label}`,
                        },
                        index
                      ),
                    })}
                  >
                    {type}
                  </MenuItem>
                  {getSourceMenuItem('File', step, index)}
                  {possibleInputs.map(itemObj => (
                    Object.entries(itemObj.inputs)
                      .filter(filterIn => filterIn[1].type === obj.type)
                      .map(itemInput => (
                        <MenuItem
                          disabled={!owner}
                          eventKey={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                          key={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                          onClick={() => updateStep({
                            ...step,
                            inputMap: getNewObj(
                              'source',
                              {
                                pipelineIndex: itemObj.possibleInputIndex,
                                inputKey: itemInput[0],
                                inputLabel: `Computation ${itemObj.possibleInputIndex + 1}: ${itemInput[1].label}`,
                              },
                              index
                            ),
                          })}
                        >
                          {`Computation ${itemObj.possibleInputIndex + 1}: ${itemInput[1].label}`}
                        </MenuItem>
                      ))
                  ))}
                </DropdownButton>
              </td>
              <td>
                <Button
                  disabled={!owner || !obj.type}
                  bsStyle="danger"
                  onClick={() => updateStep({
                    ...step,
                    inputMap: {
                      ...step.inputMap,
                      [objKey]: update(step.inputMap[objKey], {
                        $splice: [[index, 1]],
                      }),
                    },
                  })}
                >
                  Remove
                </Button>
              </td>
            </tr>
          </tbody>
        ))}
      </Table>
    );
  }
}

PipelineStepMemberTable.propTypes = {
  getNewObj: PropTypes.func.isRequired,
  getSourceMenuItem: PropTypes.func.isRequired,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  parentKey: PropTypes.string.isRequired,
  possibleInputs: PropTypes.array.isRequired,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func.isRequired,
};
