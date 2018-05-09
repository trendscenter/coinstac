import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  DropdownButton,
  FormGroup,
  FormControl,
  MenuItem,
  Table,
} from 'react-bootstrap';
import update from 'immutability-helper';
import variableOptions from './pipeline-variable-data-options.json';
import MultiSelectField from '../common/react-select';

export default class PipelineStepMemberTable extends Component {
  static getCovarSourceTitle(obj) {
    if (obj.fromCache) {
      return `Step: ${obj.fromCache.step + 1}`;
    } else if (obj.source) {
      return 'File';
    }

    return 'Data Source';
  }

  render() {
    const {
      getNewObj,
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
        {step.inputMap[objKey] && 'ownerMappings' in step.inputMap[objKey] && step.inputMap[objKey].ownerMappings.length > 0 &&
          <thead>
            {objKey === 'covariates' &&
              <tr>
                <th>Data Type</th>
                <th>Source</th>
                <th>Name</th>
                <th />
              </tr>
            }
            {objKey === 'data' &&
              <tr>
                <th>Data Type</th>
                <th>Interest</th>
                <th />
              </tr>
            }
          </thead>
        }
        {step.inputMap[objKey] && 'ownerMappings' in step.inputMap[objKey] && step.inputMap[objKey].ownerMappings.map((obj, index) => (
          <tbody style={{ border: 'none' }} key={`${objKey}-${index}`}>
            <tr>
              <td>
                <DropdownButton
                  bsStyle="info"
                  id={`${objKey}-${index}-data-dropdown`}
                  title={obj.type ||
                    (obj.fromCache && possibleInputs.length ?
                      possibleInputs[obj.fromCache.step].inputs[obj.fromCache.variable].type :
                      false) ||
                    'Data Type'
                  }
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
                    <div>
                      {console.log(obj)}
                      <MultiSelectField
                        placeholder={'Select Area(s) of Interest'}
                        options={variableOptions.freesurferROIs}
                        change={(value) => updateStep({
                          ...step,
                          inputMap: getNewObj('value', value, index, true),
                        })}
                      />
                    </div>
                  }
                  {obj.type !== 'FreeSurfer' && <span>-</span>}
                </td>
              }
              {objKey === 'covariates' &&
                <td>
                  <DropdownButton
                    id={`input-source-${index}-dropdown`}
                    title={this.constructor.getCovarSourceTitle(obj)}
                    disabled={!owner}
                  >
                    <MenuItem
                      eventKey={'file-source-menuitem'}
                      key={'file-source-menuitem'}
                      onClick={() => this.props.updateStep({
                        ...step,
                        inputMap: getNewObj(
                          'source',
                          'file',
                          index
                        ),
                      })}
                    >
                      File
                    </MenuItem>
                    {possibleInputs.map(itemObj => (
                      Object.entries(itemObj.inputs)
                        .filter(filterIn =>
                          (obj.fromCache && possibleInputs.length ?
                          filterIn[1].type && filterIn[1].type ===
                            possibleInputs[obj.fromCache.step].inputs[obj.fromCache.variable].type :
                          filterIn[1].type && filterIn[1].type === obj.type)
                        )
                        .map(itemInput => (
                          <MenuItem
                            disabled={!owner}
                            eventKey={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                            key={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                            onClick={() => updateStep({
                              ...step,
                              inputMap: getNewObj(
                                'fromCache',
                                { variable: itemInput[0], step: itemObj.possibleInputIndex },
                                index
                              ),
                            })}
                          >
                            {`Step ${itemObj.possibleInputIndex + 1}: ${itemInput[1].label}`}
                          </MenuItem>
                        ))
                    ))}
                  </DropdownButton>
                </td>
              }
              {objKey === 'covariates' &&
                <td>
                  {!obj.fromCache &&
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
                  }
                  {obj.fromCache && possibleInputs.length > 0 &&
                    <span>
                      Variable:
                        {` ${possibleInputs[obj.fromCache.step].inputs[obj.fromCache.variable].label}`}
                    </span>
                  }
                </td>
              }
              <td>
                <Button
                  disabled={!owner || !obj.type}
                  bsStyle="danger"
                  onClick={() => updateStep({
                    ...step,
                    inputMap: {
                      ...step.inputMap,
                      [objKey]: {
                        ownerMappings: update(step.inputMap[objKey].ownerMappings, {
                          $splice: [[index, 1]],
                        }),
                      },
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
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  parentKey: PropTypes.string.isRequired,
  possibleInputs: PropTypes.array.isRequired,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func.isRequired,
};
