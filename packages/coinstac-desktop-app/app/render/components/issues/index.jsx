/* eslint-disable no-console */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { graphql, withApollo } from '@apollo/react-hoc';
import { flowRight as compose, trim } from 'lodash';
import axios from 'axios';
import crypto from 'crypto';
import classNames from 'classnames';
import Dropzone from 'react-dropzone';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Icon from '@material-ui/core/Icon';
import InputLabel from '@material-ui/core/InputLabel';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import {
  CREATE_ISSUE_MUTATION,
} from '../../state/graphql/functions';
import {
  saveDocumentProp,
} from '../../state/graphql/props';
import { notifySuccess, notifyError } from '../../state/ducks/notifyAndLog';
import StatusButtonWrapper from '../common/status-button-wrapper';
import MarkdownValidator from './markdown-validator';

const {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_URL,
  CLOUDINARY_DELETE_URL,
} = process.env;

const styles = theme => ({
  tabTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  textField: {
    marginTop: theme.spacing(2),
  },
  logs: {
    width: '100%',
    borderColor: theme.palette.grey[300],
    resize: 'none',
    minHeight: 500,
    fontSize: 13,
    padding: theme.spacing(1),
    '&:focus': {
      outline: 'none',
    },
  },
  imageUploadContainer: {
    marginTop: theme.spacing(6),
  },
  membersContainer: {
    marginTop: theme.spacing(4),
  },
  imageUploadLabel: {
    color: theme.palette.grey[600],
    fontSize: 16,
  },
  imageUpload: {
    borderColor: theme.palette.grey[600],
    borderStyle: 'dashed',
    borderWidth: '2px',
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  imagePreviewContainer: {
    display: 'flex',
  },
  imagePreview: {
    margin: theme.spacing(2),
    marginLeft: 0,
    position: 'relative',
  },
  imagePreviewImg: {
    width: 100,
    height: 100,
  },
  imagePreviewDeleteButton: {
    padding: 0,
    border: 'none',
  },
  timesIcon: {
    color: '#f05a29',
    fontSize: 20,
    position: 'absolute',
    top: -theme.spacing(3) / 2,
    right: -theme.spacing(3) / 2,
    background: 'white',
    borderRadius: '50%',
    border: '2px solid white',
    width: theme.spacing(3),
    height: theme.spacing(3),
    cursor: 'pointer',
  },
  dragDrop: {
    cursor: 'pointer',
    textAlign: 'center',
    '&:focus': {
      outline: 'none',
    },
  },
  progress: {
    margin: 'auto 0',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  addMemberButton: {
    marginLeft: theme.spacing(2),
  },
});

const issueTemplate = `**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Desktop (please complete the following information):**
 - OS: [e.g. Windows 10, OSX 11.15]
 - Version [eg 5.0.1] - in the very top menu got to Coinstac -> about

**Additional context**
Add any other context about the problem here.
`;

const INITIAL_STATE = {
  title: '',
  content: issueTemplate,
  isOpenDialog: false,
  screenshots: [],
  savingStatus: 'init',
};

class Issue extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ...INITIAL_STATE,
      logs: '',
    };
  }

  handleChange = (name, value) => {
    this.setState({ [name]: value });
  }

  toggleDialog = () => {
    const { logs } = this.props;
    const { isOpenDialog } = this.state;
    this.setState({ isOpenDialog: !isOpenDialog, logs: logs.join('\n') });
  }

  handleSubmit = (includeLogs) => {
    const {
      title, content, logs, screenshots,
    } = this.state;
    const { createIssue, notifySuccess, notifyError } = this.props;

    this.setState({ savingStatus: 'pending', isOpenDialog: false });

    let body = content;

    if (screenshots.length > 0) {
      body = `${body}\n**Screenshots**`;
      screenshots.forEach((screenshot) => {
        body = `${body}\n${screenshot.imageUrl}`;
      });

      body = `${body}\n`;
    }

    if (includeLogs) {
      // eslint-disable-next-line prefer-template
      body = body + '\n**Logs**\n```' + logs + '```';
    }

    createIssue({ title: trim(title), body })
      .then(() => {
        this.setState({
          ...INITIAL_STATE,
          savingStatus: 'success',
        });
        notifySuccess('Issue is created on Github successfully');
        this.issueCreateForm.resetValidations();
      })
      .catch(() => {
        this.setState({ savingStatus: 'fail' });
        notifyError('Failed to create the issue on Github');
      });
  }

  uploadImage = async (image) => {
    const fd = new FormData();
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    fd.append('tags', 'browser_upload');
    fd.append('file', image);

    try {
      const response = await axios.post(CLOUDINARY_UPLOAD_URL, fd);
      return {
        imageId: response.data.public_id,
        imageUrl: response.data.secure_url,
      };
    } catch (error) {
      console.log(error);
    }
  }

  handleImageDrop = (images) => {
    const { screenshots } = this.state;
    const imageCount = images.length;

    if (imageCount === 0 || imageCount + screenshots.length > 5) {
      return;
    }

    this.setState({ uploading: true });

    const uploadPromises = images.map(image => this.uploadImage(image));

    Promise.all(uploadPromises)
      .then((screenshots) => {
        this.setState({ uploading: false, screenshots });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  removeImage = (imageId) => {
    const date = new Date();
    const timestamp = date.getTime();
    const hash = crypto.createHash('sha1');
    const sign = hash.update(`public_id=${imageId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`).digest('hex');

    const fd = new FormData();
    fd.append('public_id', imageId);
    fd.append('api_key', CLOUDINARY_API_KEY);
    fd.append('timestamp', timestamp);
    fd.append('signature', sign);

    axios.post(CLOUDINARY_DELETE_URL, fd)
      .then(() => {
        const { screenshots } = this.state;
        this.setState({
          screenshots: screenshots.filter(screenshot => screenshot.imageId !== imageId),
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    const { classes } = this.props;
    const {
      title, content, logs, isOpenDialog, uploading, screenshots, savingStatus,
    } = this.state;

    return (
      <ValidatorForm
        instantValidate
        noValidate
        ref={(ref) => { this.issueCreateForm = ref; }}
        onSubmit={this.toggleDialog}
      >
        <div className={classes.tabTitleContainer}>
          <Typography variant="h5">
            Bug Report
          </Typography>
          <StatusButtonWrapper status={savingStatus}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={savingStatus === 'pending'}
            >
              Save
            </Button>
          </StatusButtonWrapper>
        </div>
        <TextValidator
          id="title"
          label="Title"
          fullWidth
          value={title}
          name="name"
          required
          validators={['required']}
          errorMessages={['Bug report title is required']}
          className={classes.textField}
          withRequiredValidator
          onChange={evt => this.handleChange('title', evt.target.value)}
        />
        <MarkdownValidator
          id="content"
          label="Content"
          fullWidth
          value={content}
          required
          validators={['required']}
          errorMessages={['Bug report content is required']}
          className={classes.textField}
          withRequiredValidator
          onChange={content => this.handleChange('content', content)}
        />
        <div className={classes.imageUploadContainer}>
          <InputLabel>
            Screenshots (Max 5 images)
          </InputLabel>
          <div className={classes.imageUpload}>
            <Dropzone
              onDrop={this.handleImageDrop}
              multiple
              accept="image/*"
              maxSize={1024 * 1024 * 3}
              disabled={uploading || savingStatus === 'pending'}
            >
              {
                ({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()} className={classes.dragDrop}>
                    {uploading ? <CircularProgress className={classes.progress} /> : (
                      <div>
                        <input {...getInputProps()} />
                        <div>
                          Drag and drop some images here, or click to select images
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
            </Dropzone>
          </div>
          <div className={classes.imagePreviewContainer}>
            {screenshots.map(screenshot => (
              <div key={screenshot.imageId} className={classes.imagePreview}>
                <img className={classes.imagePreviewImg} src={screenshot.imageUrl} alt="user" />
                <button
                  className={classes.imagePreviewDeleteButton}
                  onClick={() => this.removeImage(screenshot.imageId)}
                  type="button"
                >
                  <Icon className={classNames('fa fa-times-circle', classes.timesIcon)} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <Dialog
          open={isOpenDialog}
          maxWidth="md"
          fullWidth
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          onClose={this.toggleDialog}
        >
          <DialogTitle id="alert-dialog-title">
            Do you agree to include logs with the issue?
          </DialogTitle>
          <DialogContent>
            <textarea
              id="alert-dialog-description"
              value={logs}
              className={classes.logs}
              onChange={evt => this.handleChange('logs', evt.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.handleSubmit(true)} color="primary" autoFocus>
              Yes
            </Button>
            <Button onClick={() => this.handleSubmit(false)} color="primary">
              No
            </Button>
            <Button onClick={this.toggleDialog} color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </ValidatorForm>
    );
  }
}

Issue.defaultProps = {
  logs: [],
};

Issue.propTypes = {
  createIssue: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  logs: PropTypes.any,
};

const IssueWithData = compose(
  graphql(CREATE_ISSUE_MUTATION, saveDocumentProp('createIssue', 'issue')),
  withApollo
)(Issue);


const mapStateToProps = ({ app }) => ({
  logs: app.logs,
});

const connectedComponent = connect(mapStateToProps, {
  notifySuccess,
  notifyError,
})(IssueWithData);

export default withStyles(styles)(connectedComponent);
