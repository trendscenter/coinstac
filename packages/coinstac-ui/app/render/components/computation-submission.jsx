import app from 'ampersand-app';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import {
  Alert,
  Button,
} from 'react-bootstrap';
import {
  addComputationFunc,
  fetchAllComputationsMetadataFunc,
} from '../state/graphql/functions';

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
    app.main.services.files.getSchemaFile()
      .then(metaFilePath => Promise.all([
        metaFilePath,
        app.core.computations.constructor.getJSONSchema(metaFilePath),
      ]))
      .then((res) => {
        this.setState({ activeSchema: res[1] });
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

// http://dev.apollodata.com/react/cache-updates.html
export default graphql(addComputationFunc, {
  props: ({ mutate }) => ({
    submitSchema: computationSchema => mutate({
      variables: { computationSchema },
      update: (store, { data: { addComputation } }) => {
        const data = store.readQuery({ query: fetchAllComputationsMetadataFunc });
        data.fetchAllComputations.push(addComputation);
        store.writeQuery({ query: fetchAllComputationsMetadataFunc, data });
      },
    }),
  }),
})(ComputationSubmission);
