import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { compose, graphql, withApollo } from 'react-apollo';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import ipcPromise from 'ipc-promise';
import { services } from 'coinstac-common';
import {
  ADD_COMPUTATION_MUTATION,
} from '../../state/graphql/functions';
import { saveDocumentProp } from '../../state/graphql/props';
import { notifySuccess } from '../../state/ducks/notifyAndLog';

const styles = theme => ({
  topMargin: {
    marginTop: theme.spacing(1),
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
      });
  }

  submitSchema() {
    const { router, submitSchema, notifySuccess } = this.props;
    const { activeSchema } = this.state;

    submitSchema(activeSchema)
      .then((res) => {
        this.setState({ activeSchema: {} });
        if (res.data.addComputation) {
          this.setState({ submissionSuccess: true });
          router.push('/dashboard/computations');
          notifySuccess('Computation Submission Successful');
        } else {
          this.setState({ submissionSuccess: false });
        }
      })
      .catch(() => {
        this.setState({ submissionSuccess: false });
      });
  }

  render() {
    const { classes } = this.props;
    const { activeSchema, validationErrors, submissionSuccess } = this.state;

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4">
            Computation Submission:
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
            disabled={!activeSchema.meta || validationErrors !== null}
            onClick={this.submitSchema}
          >
            Submit
          </Button>
        </div>

        {
          validationErrors
          && (
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
          )
        }

        {
          !activeSchema.meta && submissionSuccess === false
          && (
            <Typography variant="h6">
              <strong>Error!</strong>
              Try again?
            </Typography>
          )
        }

        {
          activeSchema.meta
          && (
            <pre className={classes.topMargin}>
              {JSON.stringify(activeSchema, null, 2)}
            </pre>
          )
        }
      </div>
    );
  }
}

ComputationSubmission.propTypes = {
  classes: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  submitSchema: PropTypes.func.isRequired,
};

const ComputationSubmissionWithAlert = compose(
  graphql(ADD_COMPUTATION_MUTATION, saveDocumentProp('submitSchema', 'computationSchema')),
  withApollo
)(ComputationSubmission);

const connectedComponent = connect(null, {
  notifySuccess,
})(ComputationSubmissionWithAlert);

export default withStyles(styles)(connectedComponent);
