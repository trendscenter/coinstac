import app from 'ampersand-app';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
import { addComputationMetadata } from '../state/graphql-queries';

const styles = {
  topMargin: { marginTop: 10 },
};

class ComputationSubmission extends Component { // eslint-disable-line
  constructor(props) {
    super(props);

    this.state = { activeSchema: {} };
    this.getComputationSchema = this.getComputationSchema.bind(this);
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

  render() {
    const { dockerOut, computations, submitSchema } = this.props;

    return (
      <div style={styles.topMargin}>
        <h1 className="h2">Computation Submission:</h1>
        <p>
          Use the button below to upload your schema for review. Prior to submission, your schema will be
          validated. Please fix any errors found therein to unlock the
          <span style={{fontWeight: 'bold'}}> Submit</span> for review.
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
          onClick={() => submitSchema(this.state.activeSchema)}
        >
          Submit
        </Button>
        {this.state.activeSchema.meta &&
          <pre style={styles.topMargin}>
            {JSON.stringify(this.state.activeSchema, null, 2)}
          </pre>
        }
      </div>
    );
  }
}

export default graphql(addComputationMetadata, {
  props: ({ mutate }) => ({
    submitSchema: (computationSchema) => mutate({ variables: { computationSchema } }),
  }),
})(ComputationSubmission);
