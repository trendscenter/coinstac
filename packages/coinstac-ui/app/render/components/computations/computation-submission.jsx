import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose, graphql, withApollo } from 'react-apollo'
import ReactJson from 'react-json-view'
import ipcPromise from 'ipc-promise'
import { Button, Typography } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { services } from 'coinstac-common'
import {
  CREATE_COMPUTATION_MUTATION,
} from '../../state/graphql/functions'
import { saveDocumentProp } from '../../state/graphql/props'
import { notifySuccess, notifyError } from '../../state/ducks/notifyAndLog'
import { getGraphQLErrorMessage } from '../../utils/helpers'

const styles = theme => ({
  topMargin: {
    marginTop: theme.spacing.unit * 2,
  },
  description: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
})

class ComputationSubmission extends Component {
  state = {
    activeSchema: {},
    validationErrors: null,
    isSubmitting: false,
  }

  getComputationSchema = () => {
    ipcPromise.send('open-dialog', 'jsonschema')
      .then((res) => {
        let error = null
        const validationReults = services.validator.validate(res, 'computation')

        if (validationReults.error) {
          error = validationReults.error.details
        }

        this.setState({ activeSchema: res, validationErrors: error })
      })
      .catch(console.log)
  }

  submitSchema = () => {
    const { activeSchema } = this.state

    this.setState({ isSubmitting: true })

    this.props.submitSchema(activeSchema)
      .then((res) => {
        this.setState({ activeSchema: {} })
        this.props.router.push('/dashboard/computations')
        this.props.notifySuccess('Computation Submission Successful')
      })
      .catch((error) => {
        this.props.notifyError(getGraphQLErrorMessage(error))
      })
      .finally(() => {
        this.setState({ isSubmitting: false })
      })
  }

  render() {
    const { classes } = this.props
    const { activeSchema, validationErrors, submissionSuccess } = this.state

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4">
            Computation Submission:
          </Typography>
        </div>
        <Typography variant="body1" className={classes.description}>
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
    )
  }
}

ComputationSubmission.propTypes = {
  notifySuccess: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  submitSchema: PropTypes.func.isRequired,
}

const ComputationSubmissionWithAlert = compose(
  graphql(CREATE_COMPUTATION_MUTATION, saveDocumentProp('submitSchema', 'computationSchema')),
  withApollo
)(ComputationSubmission)

const connectedComponent = connect(null, {
  notifySuccess,
  notifyError,
})(ComputationSubmissionWithAlert)

export default withStyles(styles)(connectedComponent)
