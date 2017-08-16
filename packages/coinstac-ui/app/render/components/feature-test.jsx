import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { Form, FormGroup, FormControl, Col, Button, Panel, Table } from 'react-bootstrap';
import {
  pullComputations,
  updateDockerOutput,
  getLocalImages,
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

  componentWillMount() {
    const {
      getLocalImages,
    } = this.props;

    getLocalImages();
  }

  pullComps(e) {
    e.preventDefault();
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
    const { dockerOut, localImages } = this.props;

    return (
      <div style={styles.topMargin}>
        {localImages &&
          <Panel style={styles.topMargin}>
            <h2 style={{ marginTop: 0 }}>Locally Saved Images:</h2>
            <Table striped bordered condensed hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Repository</th>
                  <th>Tag</th>
                  <th>Size</th>
                  <th>Used by Container ID</th>
                </tr>
              </thead>
              <tbody>
                {localImages.map((row) => {
                  return (
                    <tr key={`${row[0]}-row`}>
                      {row.map(column => <td key={`${column}-col`}>{column}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Panel>}

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
          <pre style={styles.outputBox}>{dockerOut}</pre>
        }
      </div>
    );
  }
}

FeatureTest.propTypes = {
  dockerOut: PropTypes.string.isRequired,
  getLocalImages: PropTypes.func.isRequired,
  localImages: PropTypes.array.isRequired,
  pullComputations: PropTypes.func.isRequired,
  updateDockerOutput: PropTypes.func.isRequired,
};

function mapStateToProps({ featureTest: { dockerOut, localImages } }) {
  return { dockerOut, localImages };
}

export default connect(mapStateToProps, {
  getLocalImages,
  pullComputations,
  updateDockerOutput,
})(FeatureTest);
