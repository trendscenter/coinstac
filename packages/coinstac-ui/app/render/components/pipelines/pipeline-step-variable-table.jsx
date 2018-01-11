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

export default class PipelineStepVariableTable extends Component {
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
      <Table>
        {step.ioMap.covariates && step.ioMap.covariates.length > 0 &&
          <thead>
            <tr>
              <th>Data Type</th>
              <th>Name</th>
              <th>Variable Type</th>
              <th>Operation</th>
              <th>Operator</th>
              <th>Source</th>
              <th>-</th>
            </tr>
          </thead>
        }
        {step.ioMap.covariates.map((cov, index) => (
          <tbody style={{ border: 'none' }} key={`covariate-${index}`}>
            <tr>
              <td>
                <DropdownButton
                  bsStyle="info"
                  id={`covariate-${index}-data-dropdown`}
                  title={cov.type || 'Data Type'}
                >
                  {objParams.items.map(item => (
                    <MenuItem
                      eventKey={`${item}-menuitem`}
                      key={`${item}-menuitem`}
                      onClick={() => updateStep({
                        ...step,
                        ioMap: getNewObj('type', item, index),
                      })}
                    >
                      {item}
                    </MenuItem>
                  ))}
                </DropdownButton>
              </td>
              <td>
                <FormGroup controlId={`${parentKey}-form-group`}>
                  <FormControl
                    disabled={!owner}
                    placeholder="Variable Name"
                    type="input"
                    value={cov.name || ''}
                    inputRef={(input) => { this[`${index}-name`] = input; }}
                    onChange={() => updateStep({
                      ...step,
                      ioMap: getNewObj('name', this[`${index}-name`].value, index),
                    })}
                  />
                </FormGroup>
              </td>
              <td>
                <DropdownButton
                  id={`covariate-${index}-vartype-dropdown`}
                  title={cov.varType || 'Variable Type'}
                >
                  {['Dependent', 'Independent'].map(name => (
                    <MenuItem
                      eventKey={`${name}-vartype-menuitem`}
                      key={`${name}-vartype-menuitem`}
                      onClick={() => updateStep({
                        ...step,
                        ioMap: getNewObj('varType', name, index),
                      })}
                    >
                      {name}
                    </MenuItem>
                  ))}
                </DropdownButton>
              </td>
              <td>
                <DropdownButton
                  id={`covariate-${index}-operation-dropdown`}
                  title={cov.operation || 'Operation'}
                  disabled={!owner || cov.type !== 'number'}
                >
                  <MenuItem
                    eventKey={'none-operation-menuitem'}
                    key={'none-operation-menuitem'}
                    onClick={() => updateStep({
                      ...step,
                      ioMap: getNewObj('operation', '', index),
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
                        ioMap: getNewObj('operation', name, index),
                      })}
                    >
                      {name}
                    </MenuItem>
                  ))}
                </DropdownButton>
              </td>
              <td>
                <FormGroup controlId={`${parentKey}-operation-form-group`}>
                  <FormControl
                    disabled={!owner || !cov.operation}
                    placeholder="Operator"
                    type="number"
                    value={cov.operator || ''}
                    inputRef={(input) => { this[`${index}-operator`] = input; }}
                    onChange={() => updateStep({
                      ...step,
                      ioMap: getNewObj('operator', this[`${index}-operator`].value, index),
                    })}
                  />
                </FormGroup>
              </td>
              <td>
                <DropdownButton
                  id={`input-source-${index}-dropdown`}
                  title={cov.source.inputLabel || 'Data Source'}
                  disabled={!owner || !cov.type}
                >
                  {getSourceMenuItem('File', step, index)}
                  {cov.type === 'number' && getSourceMenuItem('Freesurfer Data', step, index)}
                  {cov.type === 'number' && getSourceMenuItem('VBM Data', step, index)}
                  {possibleInputs.map(itemObj => (
                    Object.entries(itemObj.inputs)
                      .filter(filterIn => filterIn[1].type === cov.type)
                      .map(itemInput => (
                        <MenuItem
                          disabled={!owner}
                          eventKey={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                          key={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                          onClick={() => updateStep({
                            ...step,
                            ioMap: getNewObj(
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
                  disabled={!owner || !cov.type}
                  bsStyle="danger"
                  onClick={() => updateStep({
                    ...step,
                    ioMap: {
                      ...step.ioMap,
                      covariates: update(step.ioMap[objKey], {
                        $splice: [[index, 1]],
                      }),
                    },
                  })}
                >
                  Remove
                </Button>
              </td>
            </tr>
            {cov.source.inputKey === 'freesurferData' &&
              <tr>
                <td colSpan="2" style={{ border: 'none' }}>
                  <ControlLabel>Freesurfer ROI</ControlLabel>
                  <FormControl
                    componentClass="select"
                    disabled={!owner}
                    inputRef={(input) => { this.freesurferROI = input; }}
                    value={cov.freesurferROI || ''}
                    onChange={() => updateStep({
                      ...step,
                      ioMap: getNewObj('freesurferROI', this.freesurferROI.value, index),
                    })}
                  >
                    {variableOptions.freesurferROIs.map(name => (
                      <option key={`${name}-select-option`} value={name}>
                        {name}
                      </option>
                    ))}
                  </FormControl>
                </td>
              </tr>
            }
          </tbody>
        ))}
      </Table>
    );
  }
}

PipelineStepVariableTable.propTypes = {
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
