import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { graphql, compose } from 'react-apollo';
import {
  Form,
  FormGroup,
  FormControl,
  Col,
  Button,
  Table,
} from 'react-bootstrap';
import { fetchComputationMetadata, deleteAllComputations } from '../state/graphql-queries';
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
    .then(() => {
      this.img1.value = null;
      this.img2.value = null;
      this.img3.value = null;
    })
    .catch(console.log);
  }

  render() {
    const { dockerOut, computations, deleteAllComputations } = this.props;

    return (
      <div style={styles.topMargin}>
        {computations.length > 0 &&
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
                    <td>
                      <Button bsStyle="primary" onClick={() => this.setActiveComp(comp)}>
                        Get IO
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        }

        {computations.length > 0 &&
          <div className={'clearfix'}>
            <Button
              bsStyle="danger"
              onClick={() => deleteAllComputations()}
              className={'pull-right'}
            >
              Delete All Computations
            </Button>
          </div>
        }

        {this.state.activeComp &&
          <div>
            {this.state.activeComp.meta.name}
            <ComputationIO computationName={this.state.activeComp.meta.name} />
          </div>
        }

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
  computations: PropTypes.array.isRequired,
  deleteAllComputations: PropTypes.func.isRequired,
  dockerOut: PropTypes.array.isRequired,
  pullComputations: PropTypes.func.isRequired,
  updateDockerOutput: PropTypes.func.isRequired,
};

function mapStateToProps({ featureTest: { dockerOut } }) {
  return { dockerOut };
}

const FeatureTestWithData = compose(
  graphql(fetchComputationMetadata, {
    props: ({ ownProps, data: { loading, fetchAllComputations } }) => ({
      loading,
      computations: fetchAllComputations,
    }),
  }),
  graphql(deleteAllComputations, {
    props: ({ mutate }) => ({
      deleteAllComputations: () => mutate({
        update: (store) => {
          const data = store.readQuery({ query: fetchComputationMetadata });
          data.fetchAllComputations.length = 0;
          store.writeQuery({ query: fetchComputationMetadata, data });
        },
      }),
    }),
  })
)(FeatureTest);


export default connect(mapStateToProps, {
  getCompIO,
  pullComputations,
  updateDockerOutput,
})(FeatureTestWithData);
