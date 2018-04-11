import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { compose, graphql, withApollo } from 'react-apollo';
import {
  Alert,
  Button,
} from 'react-bootstrap';
import ipcPromise from 'ipc-promise';
import { services } from 'coinstac-common';
import {
  ADD_COMPUTATION_MUTATION,
} from '../../state/graphql/functions';
import { saveDocumentProp } from '../../state/graphql/props';
import { notifySuccess } from '../../state/ducks/notifyAndLog';

const styles = {
  topMargin: { marginTop: 10 },
};

class ComputationSubmission extends Component { // eslint-disable-line
  constructor(props) {
    super(props);

    this.state = { activeSchema: {}, submissionSuccess: null, validationErrors: null };
    this.getComputationSchema = this.getComputationSchema.bind(this);
    this.submitSchema = this.submitSchema.bind(this);
  }

  getComputationSchema(e) {
    e.preventDefault();
    ipcPromise.send('open-dialog', 'jsonschema')
      .then((res) => {
        let error = null;
        const validationReults = services.validator.validate(res, 'computation');

        if (validationReults.error) {
          error = validationReults.error.details;
        }

        this.setState({ activeSchema: res, validationErrors: error });
      })
      .catch(console.log);
  }

  submitSchema() {
    this.props.submitSchema(this.state.activeSchema)
    .then((res) => {
      this.setState({ activeSchema: {} });
      if (res.data.addComputation) {
        this.setState({ submissionSuccess: true });
        this.props.router.push('/dashboard/computations');
        this.props.notifySuccess({
          message: 'Computation Submission Successful',
          autoDismiss: 5,
        });
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
          disabled={!this.state.activeSchema.meta || this.state.validationErrors !== null}
          onClick={this.submitSchema}
        >
          Submit
        </Button>

        {this.state.validationErrors &&
          (<Alert bsStyle="danger" style={{ ...styles.topMargin, textAlign: 'left' }}>
            <h4 style={{ fontStyle: 'normal' }}>Validation Error</h4>
            <ul>
              {this.state.validationErrors.map(error =>
                <li key={error.path}>Error at {error.path}: {error.message}</li>
              )}
            </ul>
          </Alert>)
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
  notifySuccess: PropTypes.func.isRequired,
  submitSchema: PropTypes.func.isRequired,
};

const mapStateToProps = ({ notifySuccess, submitSchema }) => {
  return { notifySuccess, submitSchema };
};

const ComputationSubmissionWithAlert = compose(
graphql(ADD_COMPUTATION_MUTATION, saveDocumentProp('submitSchema', 'computationSchema')),
withApollo
)(ComputationSubmission);

export default connect(mapStateToProps,
  {
    notifySuccess
  }
)(ComputationSubmissionWithAlert);
