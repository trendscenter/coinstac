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

    if (props.objKey === 'covariates') {
      this.state = { covariates: [] };
    }

    this.addCovariate = this.addCovariate.bind(this);
    this.updateCovariate = this.updateCovariate.bind(this);
  }

  getNewObj(ioMap, objKey, value, isCovariate) { // eslint-disable-line class-methods-use-this
    if (!isCovariate) {
      return { ...ioMap, [objKey]: value };
    }

    const covariates = [...ioMap.covariates];
    covariates.splice(objKey, 1, value);
    return { ...ioMap, covariates: [...covariates] };
  }

  addCovariate() {
    this.setState(prevState => ({
      covariates: [...prevState.covariates, { type: '', value: '' }],
    }));
  }

  updateCovariate(index, item) {
    this.setState(prevState => ({
      covariates: update(prevState.covariates, {
        $splice: [[index, 1, item]],
      }),
    }));
  }

  render() {
    const { isCovariate, objKey, objParams, parentKey, owner, step, updateStep } = this.props;

    return (
      <div>
        {objKey === 'covariates' &&
          <div>
            <h4>Covariates</h4>
            <Button
              bsStyle="primary"
              onClick={this.addCovariate}
            >
              <span aria-hidden="true" className="glphicon glyphicon-plus" /> Add Covariate
            </Button>
            {this.state.covariates.map((cov, index) => (
              <Row key={`covariate-${index}`}>
                <Col sm={6}>
                  <DropdownButton
                    bsStyle="primary"
                    id={`covariate-${index}-dropdown`}
                    title="Covariate Type"
                  >
                    {objParams.items.map(item => (
                      <MenuItem
                        eventKey={`${item}-menuitem`}
                        key={`${item}-menuitem`}
                        onClick={() => this.updateCovariate(index, { ...cov, type: item })}
                      >
                        {item}
                      </MenuItem>
                    ))}
                  </DropdownButton>
                </Col>
                {cov.type &&
                  <Col sm={6}>
                    <PipelineStepInput
                      objKey={index}
                      isCovariate
                      objParams={{ type: cov.type, defaultValue: this.state.covariates.defaultValue || null }}
                      owner={owner}
                      step={step}
                      updateStep={updateStep}
                    />
                  </Col>
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
                onChange={() => updateStep(step.id, {
                  ...step,
                  ioMap: this.getNewObj(step.ioMap, objKey, this[objKey].value, isCovariate),
                })}
                type="number"
                value={objParams.defaultValue || ''}
              />
            }

            {objParams.type === 'select' &&
              <FormControl
                componentClass="select"
                disabled={!owner}
                inputRef={(input) => { this[objKey] = input; }}
                multiple
                onChange={() => updateStep(step.id, {
                  ...step,
                  ioMap: this.getNewObj(step.ioMap, objKey, this[objKey].value, isCovariate),
                })}
                value={objParams.defaultValue || ''}
              >
                <option value="select">select (multiple)</option>
                <option value="other">...</option>
              </FormControl>
            }

            {objParams.type === 'boolean' &&
              <Checkbox
                disabled={!owner}
                inputRef={(input) => { this[objKey] = input; }}
                onChange={() => updateStep(step.id, {
                  ...step,
                  ioMap: this.getNewObj(step.ioMap, objKey, this[objKey].value, isCovariate),
                })}
                value={objParams.defaultValue || ''}
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
  isCovariate: false,
  parentKey: '',
  owner: false,
  updateStep: null,
};

PipelineStepInput.propTypes = {
  isCovariate: PropTypes.bool,
  parentKey: PropTypes.string,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func,
};
