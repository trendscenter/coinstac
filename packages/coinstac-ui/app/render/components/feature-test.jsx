import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { Form, FormGroup, FormControl, Col, Button } from 'react-bootstrap';
import {
  pullComputations,
  updateDockerOutput,
} from '../state/ducks/feature-test';

const styles = {
  topMargin: { marginTop: 10 },
};

class FeatureTest extends Component { // eslint-disable-line
  constructor(props) {
    super(props);

    ipcRenderer.on('docker-out', (event, arg) => {
      this.props.updateDockerOutput(arg);
    });

    this.pullComps = this.pullComps.bind(this);
  }

  pullComps() {
    this.props.pullComputations([this.img1.value, this.img2.value, this.img3.value])
    .then((res) => {
      this.img1.value = null;
      this.img2.value = null;
      this.img3.value = null;

      console.log(res);
    })
    .catch(console.log);
  }

  render() {
    const { dockerOut } = this.props;

    return (
      <div style={styles.topMargin}>
        <Form horizontal onSubmit={this.pullComps}>
          <FormGroup controlId="img1">
            <Col sm={2}>
              Docker Image 1
            </Col>
            <Col sm={10}>
              <FormControl
                type="input"
                placeholder="Image 1"
                inputRef={(input) => { this.img1 = input; }}
              />
            </Col>
          </FormGroup>

          <FormGroup controlId="img2">
            <Col sm={2}>
              Docker Image 2
            </Col>
            <Col sm={10}>
              <FormControl
                type="input"
                placeholder="Image 2"
                inputRef={(input) => { this.img2 = input; }}
              />
            </Col>
          </FormGroup>

          <FormGroup controlId="img3">
            <Col sm={2}>
              Docker Image 3
            </Col>
            <Col sm={10}>
              <FormControl
                type="input"
                placeholder="Image 3"
                inputRef={(input) => { this.img3 = input; }}
              />
            </Col>
          </FormGroup>

          <Button bsStyle="primary" type="submit">Pull Images</Button>
        </Form>

        {dockerOut &&
          <pre style={styles.topMargin}>{dockerOut}</pre>
        }
      </div>
    );
  }
}

FeatureTest.propTypes = {
  dockerOut: PropTypes.string.isRequired,
  pullComputations: PropTypes.func.isRequired,
  updateDockerOutput: PropTypes.func.isRequired,
};

function mapStateToProps({ featureTest: { dockerOut } }) {
  return { dockerOut };
}

export default connect(mapStateToProps, {
  pullComputations,
  updateDockerOutput,
})(FeatureTest);
