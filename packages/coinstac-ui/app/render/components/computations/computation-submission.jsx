import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import ReactJson from 'react-json-view';
import ipcPromise from 'ipc-promise';
import { Button, CircularProgress, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { services } from 'coinstac-common';
import {
  ADD_COMPUTATION_MUTATION,
} from '../../state/graphql/functions';
import { saveDocumentProp } from '../../state/graphql/props';
import { notifySuccess, notifyError } from '../../state/ducks/notifyAndLog';
import { getGraphQLErrorMessage } from '../../utils/helpers';

const styles = theme => ({
  topMargin: {
    marginTop: theme.spacing(2),

  },
  description: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
});

class ComputationSubmission extends Component {
  state = {
    activeSchema: {},
    validationErrors: null,
    isSubmitting: false,
  }

  getComputationSchema = () => {
    ipcPromise.send('open-dialog', { org: 'jsonschema' })
      .then((res) => {
        let error = null;
        const validationReults = services.validator.validate(res, 'computation');

        if (validationReults.error) {
          error = validationReults.error.details;
        }

        this.setState({ activeSchema: res, validationErrors: error });
      })
      .catch((e) => {
        notifyError(e.message);
      });
  }

  addComputation = () => {
    const {
      router, addComputation, notifySuccess, notifyError,
    } = this.props;
    const { activeSchema } = this.state;

    this.setState({ isSubmitting: true });

    addComputation(activeSchema)
      .then(() => {
        this.setState({ activeSchema: {} });
        router.push('/dashboard/computations');
        notifySuccess('Created Computation Successfully');
      })
      .catch((error) => {
        notifyError(getGraphQLErrorMessage(error));
      })
      .finally(() => {
        this.setState({ isSubmitting: false });
      });
  }

  render() {
    const { classes } = this.props;
    const { activeSchema, validationErrors, isSubmitting } = this.state;

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4">
            Add Computation
          </Typography>
        </div>
        <Typography variant="body2" className={classes.description}>
          Use the button below to upload your schema for review. Prior to submission,
          your schema will be validated. Please fix any errors found therein to unlock the
          <span style={{ fontWeight: 'bold' }}> Submit </span>
          for review.
        </Typography>
        <div className={classes.actionsContainer}>
          <Button
            variant="contained"
            color="secondary"
            onClick={this.getComputationSchema}
          >
            Add Computation Schema
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!activeSchema.meta || validationErrors !== null || isSubmitting}
            onClick={this.addComputation}
          >
            {isSubmitting ? <CircularProgress size={15} /> : 'Submit'}
          </Button>
        </div>

        {validationErrors && (
          <div>
            <Typography variant="h6">
              Validation Error
            </Typography>
            <ul>
              {
                validationErrors.map(error => (
                  <li key={error.path}>
                    {`Error at ${error.path}: ${error.message}`}
                  </li>
                ))
              }
            </ul>
          </div>
        )}

        {activeSchema.meta && (
          <div className={classes.topMargin}>
            <ReactJson
              src={activeSchema}
              theme="monokai"
              displayDataTypes={false}
              displayObjectSize={false}
              enableClipboard={false}
            />
          </div>
        )}
      </div>
    );
  }
}

ComputationSubmission.propTypes = {
  classes: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  addComputation: PropTypes.func.isRequired,
};

const ComputationSubmissionWithAlert = compose(
  graphql(
    ADD_COMPUTATION_MUTATION,
    saveDocumentProp('addComputation', 'computationSchema')
  ),
  withApollo
)(ComputationSubmission);

const connectedComponent = connect(null, {
  notifySuccess,
  notifyError,
})(ComputationSubmissionWithAlert);

export default withStyles(styles)(connectedComponent);
