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

export default class PipelineStepInput extends Component {
  constructor(props) {
    super(props);

    this.addCovariate = this.addCovariate.bind(this);
    this.getNewObj = this.getNewObj.bind(this);
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
    const { step, updateStep } = this.props;

    updateStep({
      ...step,
      ioMap: {
        ...step.ioMap,
        covariates:
        [
          ...step.ioMap.covariates,
          {
            type: '',
          },
        ],
      },
    });
  }

  render() {
    const { objKey, objParams, parentKey, owner, step, updateStep } = this.props;

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
                <Col sm={4}>
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
                    <Col sm={4}>
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
                    <Col sm={4}>
                      <Button bsStyle="danger">
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

            {objParams.type === 'select' &&
              <FormControl
                componentClass="select"
                disabled={!owner}
                inputRef={(input) => { this[objKey] = input; }}
                multiple
                onChange={() => updateStep({
                  ...step,
                  ioMap: this.getNewObj(objKey, this.getSelectList(step.ioMap[objKey], this[objKey].value)),
                })}
                value={step.ioMap[objKey] || []}
              >
                {objParams.values.map(val =>
                  <option key={`${val}-select-option`} value={val}>{val}</option>
                )}
              </FormControl>
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
  updateStep: null,
};

PipelineStepInput.propTypes = {
  isCovariate: PropTypes.bool.isRequired,
  parentKey: PropTypes.string,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func,
};
