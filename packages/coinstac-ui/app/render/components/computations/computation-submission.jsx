import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import {
  Alert,
  Button,
} from 'react-bootstrap';
import ipcPromise from 'ipc-promise';
import {
  ADD_COMPUTATION_MUTATION,
} from '../../state/graphql/functions';
import { saveDocumentProp } from '../../state/graphql/props';

const styles = {
  topMargin: { marginTop: 10 },
};

class ComputationSubmission extends Component { // eslint-disable-line
  constructor(props) {
    super(props);

    this.state = { activeSchema: {}, submissionSuccess: null };
    this.getComputationSchema = this.getComputationSchema.bind(this);
    this.submitSchema = this.submitSchema.bind(this);
  }

  getComputationSchema(e) {
    e.preventDefault();
    ipcPromise.send('get-computation-schema')
      .then((res) => {
        this.setState({ activeSchema: res });
      })
      .catch(console.log);
  }

  submitSchema() {
    this.props.submitSchema(this.state.activeSchema)
    .then((res) => {
      this.setState({ activeSchema: {} });
      if (res.data.addComputation) {
        this.setState({ submissionSuccess: true });
      } else {
        this.setState({ submissionSuccess: false });
      }
    })
    .catch(({ graphQLErrors }) => {
      console.log(graphQLErrors);
      this.setState({ submissionSuccess: false });
    });
  }

  render() {
    return (
      <div style={styles.topMargin}>
        <h1 className="h2">Computation Submission:</h1>
        <p>
          Use the button below to upload your schema for review. Prior to submission,
          your schema will be validated. Please fix any errors found therein to unlock the
          <span style={{ fontWeight: 'bold' }}> Submit</span> for review.
        </p>
        <Button
          bsStyle="primary"
          type="button"
          onClick={this.getComputationSchema}
        >
          Add Computation Schema
        </Button>
        <Button
          bsStyle="success"
          type="button"
          className={'pull-right'}
          disabled={!this.state.activeSchema.meta}
          onClick={this.submitSchema}
        >
          Submit
        </Button>

        {!this.state.activeSchema.meta && this.state.submissionSuccess &&
          <Alert bsStyle="success" style={styles.topMargin}>
            <strong>Success!</strong> Try another?
          </Alert>
        }

        {!this.state.activeSchema.meta && this.state.submissionSuccess === false &&
          <Alert bsStyle="danger" style={styles.topMargin}>
            <strong>Error!</strong> Try again?
          </Alert>
        }

        {this.state.activeSchema.meta &&
          <pre style={styles.topMargin}>
            {JSON.stringify(this.state.activeSchema, null, 2)}
          </pre>
        }
      </div>
    );
  }
}

ComputationSubmission.propTypes = {
  submitSchema: PropTypes.func.isRequired,
};

export default graphql(ADD_COMPUTATION_MUTATION, saveDocumentProp('submitSchema', 'computationSchema'))(ComputationSubmission);
