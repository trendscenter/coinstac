import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import {
  Form,
  FormGroup,
  FormControl,
  Col,
  Button,
} from 'react-bootstrap';
import {
  pullComputations,
  updateDockerOutput,
} from '../state/ducks/feature-test';

const styles = {
  outputBox: { marginTop: 10, height: 400, overflowY: 'scroll' },
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

  pullComps(e) {
    e.preventDefault();
    this.props.pullComputations([this.img1.value, this.img2.value, this.img3.value])
    .then(() => {
      this.img1.value = null;
      this.img2.value = null;
      this.img3.value = null;
    })
    .catch(console.log);
  }

  render() {
    const { dockerOut } = this.props;

    return (
      <div>
        <p style={{ fontWeight: 'bold' }}>Be sure to include tags (eg: ':latest') or you'll be downloading all versions.</p>

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
          <pre style={styles.outputBox}>
            {dockerOut.map(elem => (
              <div
                key={elem.id && elem.id !== 'latest' ? elem.id : elem.status}
                style={elem.isErr ? { color: 'red' } : {}}
              >
                {elem.id ? `${elem.id}: ` : ''}{elem.status} {elem.progress}
              </div>
            ))}
          </pre>
        }
      </div>
    );
  }
}

FeatureTest.propTypes = {
  dockerOut: PropTypes.array.isRequired,
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
