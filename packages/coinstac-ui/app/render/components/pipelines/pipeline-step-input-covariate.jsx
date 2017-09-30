import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Col, ControlLabel, FormGroup, FormControl, Row } from 'react-bootstrap';

export default class PipelineStepInputCovariate extends Component {
  render() {
    const { updateCovariate } = this.props;

    return (
      <div>
        {objKey === 'covariates' &&
          this.state.covariates.map((cov, index) => (
            <Row key={`covariate-${index}`}>
              <Col sm={6}>
                <FormGroup controlId={`covariate-${index}`}>
                  
                </FormGroup>
              </Col>
              <Col sm={6}>
              
              </Col>
            </Row>
          ))
        }

        <FormGroup controlId={`${key}-form-group`}>
          {objParams.label &&
            <ControlLabel>{objParams.label}</ControlLabel>
          }

          {objParams.type === 'number' &&
            <FormControl
              disabled={!owner}
              inputRef={(input) => { this[objKey] = input; }}
              onChange={() => updateStep(step.id, {
                ...step,
                ioMap: { ...step.ioMap, [objKey]: this[objKey].value },
              })}
              type="number"
              value={objParams.defaultValue || null}
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
                ioMap: { ...step.ioMap, objKey: this[objKey].value },
              })}
              value={objParams.defaultValue || null}
            >
              <option value="select">select (multiple)</option>
              <option value="other">...</option>
            </FormControl>
          }

          {objParams.type === 'boolean' &&
            <FormControl
              componentClass="select"
              disabled={!owner}
              inputRef={(input) => { this[objKey] = input; }}
              multiple
              onChange={() => updateStep(step.id, {
                ...step,
                ioMap: { ...step.ioMap, objKey: this[objKey].value },
              })}
              value={objParams.defaultValue || null}
            >
              <option value="select">select (multiple)</option>
              <option value="other">...</option>
            </FormControl>
          }
        </FormGroup>
      </div>
    );
  }
}

PipelineStepIO.defaultProps = {
  owner: false,
  updateStep: null,
};

PipelineStepIO.propTypes = {
  key: PropTypes.string.isRequired,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func,
};
