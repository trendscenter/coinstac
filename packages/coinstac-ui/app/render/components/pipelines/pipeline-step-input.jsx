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

export default class PipelineStepInput extends Component {
  constructor(props) {
    super(props);

    this.addCovariate = this.addCovariate.bind(this);
    this.getNewObj = this.getNewObj.bind(this);
  }

  componentWillMount() {
    const { objKey, objParams, step, updateStep } = this.props;

    // Initialize array of length input min if array of inputs required
    if (!step.ioMap[objKey] && objParams.type === 'array' &&
        !objParams.values && objParams.items === 'number') {
      let initArray = [];

      if (objParams.defaultValue && Array.isArray(objParams.defaultValue)) {
        initArray = Array.from({ length: objParams.min }, (v, i) => objParams.defaultValue[i]);
      }

      updateStep({
        ...step,
        ioMap: this.getNewObj(
          objKey,
          initArray
        ),
      });
    }
  }

  getNewObj(objKey, value, covarIndex) { // eslint-disable-line class-methods-use-this
    const { isCovariate, step: { ioMap } } = this.props;

    if (!isCovariate) {
      return { ...ioMap, [objKey]: value };
    }

    const covars = [...ioMap.covariates];
    covars.splice(covarIndex, 1, { ...covars[covarIndex], [objKey]: value });
    return { ...ioMap, covariates: [...covars] };
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

  addCovariate() {
    const {
      pipelineIndex,
      step,
      updateStep,
    } = this.props;

    updateStep({
      ...step,
      ioMap: {
        ...step.ioMap,
        covariates:
        [
          ...step.ioMap.covariates,
          {
            type: '',
            source: {
              pipelineIndex: -1,
              inputKey: pipelineIndex === 0 ? 'file' : '',
              inputLabel: pipelineIndex === 0 ? 'File' : '',
            },
          },
        ],
      },
    });
  }

  render() {
    const {
      objKey,
      objParams,
      parentKey,
      pipelineIndex,
      possibleInputs,
      owner,
      step,
      updateStep,
    } = this.props;

    return (
      <div>
        {objKey === 'covariates' &&
          <div>
            <p style={{ fontWeight: 'bold' }}>Covariates</p>
            <Button
              bsStyle="primary"
              onClick={this.addCovariate}
              style={{ marginBottom: 10 }}
            >
              <span aria-hidden="true" className="glphicon glyphicon-plus" /> Add Covariate
            </Button>
            {step.ioMap.covariates.map((cov, index) => (
              <Row key={`covariate-${index}`}>
                <Col sm={3}>
                  <DropdownButton
                    bsStyle="info"
                    id={`covariate-${index}-dropdown`}
                    title={cov.type || 'Covariate Type'}
                  >
                    {objParams.items.map(item => (
                      <MenuItem
                        eventKey={`${item}-menuitem`}
                        key={`${item}-menuitem`}
                        onClick={() => updateStep({
                          ...step,
                          ioMap: this.getNewObj('type', item, index),
                        })}
                      >
                        {item}
                      </MenuItem>
                    ))}
                  </DropdownButton>
                </Col>
                {cov.type &&
                  <div>
                    <Col sm={3}>
                      <FormGroup controlId={`${parentKey}-form-group`}>
                        <FormControl
                          disabled={!owner}
                          placeholder="Covariate Label"
                          type="input"
                          value={cov.name || ''}
                          inputRef={(input) => { this[index] = input; }}
                          onChange={() => updateStep({
                            ...step,
                            ioMap: this.getNewObj('name', this[index].value, index),
                          })}
                        />
                      </FormGroup>
                    </Col>
                    <Col sm={3}>
                      <DropdownButton
                        id={`input-source-${index}-dropdown`}
                        title={cov.source.inputLabel || 'Data Source'}
                      >
                        <MenuItem
                          eventKey={'covariate-file-inputs-menuitem'}
                          key={'covariate-file-inputs-menuitem'}
                          onClick={() => updateStep({
                            ...step,
                            ioMap: this.getNewObj(
                              'source',
                              { pipelineIndex: -1, inputKey: 'file', inputLabel: 'File' },
                              index
                            ),
                          })}
                        >
                          File
                        </MenuItem>
                        {possibleInputs.map(itemObj => (
                          Object.entries(itemObj.inputs)
                            .filter(filterIn => filterIn[1].type === cov.type)
                            .map(itemInput => (
                              <MenuItem
                                eventKey={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                                key={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                                onClick={() => updateStep({
                                  ...step,
                                  ioMap: this.getNewObj(
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
                    </Col>
                    <Col sm={3}>
                      <Button className="pull-right" bsStyle="danger">
                        Remove
                      </Button>
                    </Col>
                  </div>
                }

              </Row>
            ))}
          </div>
        }

        {objKey !== 'covariates' &&
          <FormGroup controlId={`${parentKey}-form-group`}>
            {objParams.label &&
              <ControlLabel>{objParams.label}</ControlLabel>
            }

            {objParams.description &&
              <p>{objParams.description}</p>
            }

            {objParams.type === 'number' &&
              <FormControl
                disabled={!owner}
                inputRef={(input) => { this[objKey] = input; }}
                onChange={() => updateStep({
                  ...step,
                  ioMap: this.getNewObj(objKey, this[objKey].value),
                })}
                type="number"
                value={step.ioMap[objKey] || ''}
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
                  ioMap: this.getNewObj(
                    objKey,
                    this.getSelectList(step.ioMap[objKey], this[objKey].value)
                  ),
                })}
                value={step.ioMap[objKey] || []}
              >
                {objParams.values.map(val =>
                  <option key={`${val}-select-option`} value={val}>{val}</option>
                )}
              </FormControl>
            }

            {objParams.type === 'array' && !objParams.values && objParams.items === 'number' &&
              step.ioMap[objKey] && step.ioMap[objKey].map((val, i) => (
                <FormControl
                  disabled={!owner}
                  inputRef={(input) => { this[i] = input; }}
                  onChange={() => updateStep({
                    ...step,
                    ioMap: {
                      [objKey]: update(step.ioMap[objKey], {
                        $splice: [[i, 1, this[i].value]],
                      }),
                    },
                  })}
                  type="number"
                  value={step.ioMap[objKey][i] || ''}
                />
              ))
            }

            {objParams.type === 'boolean' &&
              <Checkbox
                disabled={!owner}
                inputRef={(input) => { this[objKey] = input; }}
                onChange={() => updateStep({
                  ...step,
                  ioMap: this.getNewObj(objKey, this[objKey].value),
                })}
                value={step.ioMap[objKey] || ''}
              >
                True?
              </Checkbox>
            }
          </FormGroup>
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
  isCovariate: PropTypes.bool.isRequired,
  parentKey: PropTypes.string,
  pipelineIndex: PropTypes.number.isRequired,
  possibleInputs: PropTypes.array,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func,
};
