import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import crypto from 'crypto';
import axios from 'axios';
import { notifySuccess, notifyError, writeLog } from '../../state/ducks/notifyAndLog';
import { update } from '../../state/ducks/auth';
import UserEdit from './user-edit';

const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_UPLOAD_URL = process.env.CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_DELETE_URL = process.env.CLOUDINARY_DELETE_URL;

class UserAccountController extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      uploadedFileCloudinaryUrl: this.props.user.photo,
      uploadedFileCloudinaryID: this.props.user.photoID,
      uploadProgress: 0,
      uploadProgressShow: false,
    };
  }

  /**
   * Handle new user edit submits.
   *
   * @todo  Improve form validation, move Redux action or middleware.
   *
   * @param  {object}    formData
   * @param  {string}    formData.email
   * @param  {string}    formData.institution
   * @param  {string}    formData.id
   * @param  {string}    formData.name
   * @param  {string}    formData.photo
   * @param  {string}    formData.photoID
   * @param  {string}    formData.password
   * @param  {string}    formData.username
   * @return {undefined}
   */
  onSubmit = (formData) => {
    let error;

    if (!formData.id) {
      error = 'ID required';
    } else if (!formData.username) {
      error = 'Username required';
    } else if (!formData.email) {
      error = 'Email required';
    }

    if (error) {
      return this.handleUpdateError(error);
    }

    this.setState({ error: null })

    return this.props.update(formData)
      .then((res) => {
        this.props.notifySuccess('User account changed');
      });
  }

  // *********** Upload file to Cloudinary ******************** //
  handleImageUpload = (file) => {
    let url = CLOUDINARY_UPLOAD_URL;
    let xhr = new XMLHttpRequest();
    let fd = new FormData();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    // Update progress (can be used to show progress indicator)
    xhr.upload.addEventListener("progress", (e) => {
      let progress = Math.round((e.loaded * 100.0) / e.total);
      this.setState({
        uploadProgressShow: true,
        uploadProgress: progress
      });
    });

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState == 4 && xhr.status == 200) {
        // File uploaded successfully
        let response = JSON.parse(xhr.response);
        if (url !== '') {
          this.setState({
            uploadedFileCloudinaryID: response.public_id,
            uploadedFileCloudinaryUrl: response.secure_url,
            uploadProgress: 0,
            uploadProgressShow: false,
          });
        }
      }
    };

    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    fd.append('tags', 'browser_upload'); // Optional - add tag for image admin in Cloudinary
    fd.append('file', file);
    xhr.send(fd);
  }

  // *********** Delete Cloudinary Image File ******************** //
  handleImageDestroy = (file) => {
    let url = CLOUDINARY_DELETE_URL;
    let xhr = new XMLHttpRequest();
    let fd = new FormData();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState == 4 && xhr.status == 200) {
        // File uploaded successfully
        let response = JSON.parse(xhr.responseText);
        if (response.result === 'ok') {
          this.setState({
            uploadedFileCloudinaryID: null,
            uploadedFileCloudinaryUrl: null,
            uploadProgress: 0,
            uploadProgressShow: false,
          });
        }
      }
    };

    const date = new Date();
    const timestamp = date.getTime();
    const hash = crypto.createHash('sha1');
    const sign = hash.update(`public_id=${file}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`).digest('hex');

    fd.append('public_id', file);
    fd.append('api_key', CLOUDINARY_API_KEY);
    fd.append('timestamp', timestamp);
    fd.append('signature', sign);
    xhr.send(fd);
  }

  handleUpdateError = error => {
    let message;

    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = 'User update error occurred. Please try again.';
    }

    this.setState({ error: message });
  }

  render() {
    const {
      error,
      uploadedFileCloudinaryUrl,
      uploadedFileCloudinaryID,
      uploadProgress,
      uploadProgressShow,
    } = this.state;
    return (
      <UserEdit
        {...this.props}
        error={error}
        onSubmit={this.onSubmit}
        handleImageUpload={this.handleImageUpload}
        handleImageDestroy={this.handleImageDestroy}
        uploadedFileCloudinaryUrl={uploadedFileCloudinaryUrl}
        uploadedFileCloudinaryID={uploadedFileCloudinaryID}
        uploadProgress={uploadProgress}
        uploadProgressShow={uploadProgressShow}
      />
    );
  }
}

UserAccountController.contextTypes = {
  router: PropTypes.object.isRequired,
};

UserAccountController.displayName = 'UserAccountController';

UserAccountController.propTypes = {
  notifySuccess: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth: { user } }) => {
  return {
    user,
  };
};

export default connect(mapStateToProps, {
  notifyError,
  notifySuccess,
  writeLog,
  update,
})(UserAccountController);
