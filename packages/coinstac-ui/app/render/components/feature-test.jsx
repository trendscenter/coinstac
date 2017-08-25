import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { graphql } from 'react-apollo';
import {
  Form,
  FormGroup,
  FormControl,
  Col,
  Button,
  Panel,
  Table
} from 'react-bootstrap';
import { fetchComputationMetadata } from '../state/graphql-queries'; 
import {
  getCompIO,
  pullComputations,
  updateDockerOutput,
} from '../state/ducks/feature-test';
import ComputationIO from './computation-io';

const styles = {
  outputBox: { marginTop: 10, height: 400, overflowY: 'scroll' },
  topMargin: { marginTop: 10 },
};

class FeatureTest extends Component { // eslint-disable-line
  constructor(props) {
    super(props);

    this.state = { activeComp: null };

    ipcRenderer.on('docker-out', (event, arg) => {
      this.props.updateDockerOutput(arg);
    });

    this.pullComps = this.pullComps.bind(this);
    this.setActiveComp = this.setActiveComp.bind(this);
  }
  
  setActiveComp(comp) {
    this.setState({ activeComp: comp });
  }

  pullComps(e) {
    e.preventDefault();
    this.props.pullComputations([this.img1.value, this.img2.value, this.img3.value])
    .then((res) => {
      this.img1.value = null;
      this.img2.value = null;
      this.img3.value = null;
    })
    .catch(console.log);
  }

  render() {
    const { dockerOut, computations } = this.props;

    return (
      <div style={styles.topMargin}>
        {computations &&
          <Table striped bordered condensed style={styles.topMargin}>
            <thead>
              <tr>
                <th>Computation Name</th>
                <th>Get IO</th>
              </tr>
            </thead>
            <tbody>
              {computations.map((comp) => {
                return (
                  <tr key={`${comp.id}-row`}>
                    <td>{comp.meta.name}</td>
                    <td><Button bsStyle="primary" onClick={() => this.setActiveComp(comp)}>Get IO</Button></td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        }

        {this.state.activeComp && 
          <div>
            {this.state.activeComp.meta.name}
            <ComputationIO computationName={this.state.activeComp.meta.name} />
          </div>
        }

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
  pullComputations: PropTypes.func.isRequired,
  updateDockerOutput: PropTypes.func.isRequired,
};

function mapStateToProps({ featureTest: { dockerOut } }) {
  return { dockerOut };
}

const FeatureTestWithData = graphql(fetchComputationMetadata, {
  props: ({ ownProps, data: { loading, fetchAllComputations } }) => ({
    loading,
    computations: fetchAllComputations,
  }),
})(FeatureTest);

export default connect(mapStateToProps, {
  getCompIO,
  pullComputations,
  updateDockerOutput,
})(FeatureTestWithData);
