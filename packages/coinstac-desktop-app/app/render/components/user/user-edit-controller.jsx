import axios from 'axios';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { update } from '../../state/ducks/auth';
import { notifyError, notifySuccess, writeLog } from '../../state/ducks/notifyAndLog';
import UserEdit from './user-edit';

const {
  CLOUDINARY_UPLOAD_PRESET,
  // CLOUDINARY_API_KEY,
  // CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_URL,
  // CLOUDINARY_DELETE_URL,
} = process.env;

class UserAccountController extends Component {
  constructor(props) {
    super(props);

    const { user } = props;

    this.state = {
      error: null,
      uploadedFileCloudinaryUrl: user.photo,
      uploadedFileCloudinaryID: user.photoID,
      uploadProgress: 0,
      uploadProgressShow: false,
      deletedCurrentImage: false,
      deleteImageQueue: [],
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.handleImageUpload = this.handleImageUpload.bind(this);
    this.destroyImage = this.destroyImage.bind(this);
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
  async onSubmit(formData) {
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

    const { update, notifySuccess } = this.props;
    const { deleteImageQueue } = this.state;

    await update(formData);

    if (deleteImageQueue.length > 0) {
      const deletePromises = deleteImageQueue.map(file => this.destroyImage(file));

      await Promise.all(deletePromises);
    }

    this.setState({ error: null, deleteImageQueue: [] });

    notifySuccess('User account changed');
  }

  handleUpdateError = (error) => {
    let { message } = error;

    if (!message) {
      if (typeof error === 'string') {
        message = error;
      } else {
        message = 'User update error occurred. Please try again.';
      }
    }

    this.setState({ error: message });
  }

  handleImageDestroy = (file) => {
    this.setState(prevState => ({
      deleteImageQueue: [
        ...prevState.deleteImageQueue,
        file,
      ],
      deletedCurrentImage: true,
    }));
  }

  // *********** Delete Cloudinary Image File ******************** //
  /* eslint-disable-next-line */
  async destroyImage(file) {
    // const date = new Date();
    // const timestamp = date.getTime();
    // const hash = crypto.createHash('sha1');
    // const sign = hash
    //   .update(`public_id=${file}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
    //   .digest('hex');

    // const fd = new FormData();
    // fd.append('public_id', file);
    // fd.append('api_key', CLOUDINARY_API_KEY);
    // fd.append('timestamp', timestamp);
    // fd.append('signature', sign);

    // try {
    //   await axios.post(
    //     CLOUDINARY_DELETE_URL,
    //     fd
    //   );
    // } catch (error) {
    //   this.handleUpdateError(error);
    // }
  }

  // *********** Upload file to Cloudinary ******************** //
  async handleImageUpload(file) {
    const fd = new FormData();
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    fd.append('tags', 'browser_upload'); // Optional - add tag for image admin in Cloudinary
    fd.append('file', file);

    try {
      const response = await axios.post(
        CLOUDINARY_UPLOAD_URL,
        fd,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100.0) / progressEvent.total);

            this.setState({
              uploadProgressShow: true,
              uploadProgress: progress,
            });
          },
        },
      );

      this.setState({
        uploadedFileCloudinaryID: response.data.public_id,
        uploadedFileCloudinaryUrl: response.data.secure_url,
        uploadProgress: 0,
        uploadProgressShow: false,
        deletedCurrentImage: false,
      });
    } catch (error) {
      this.handleUpdateError(error);
    }
  }

  render() {
    const {
      error,
      uploadedFileCloudinaryUrl,
      uploadedFileCloudinaryID,
      uploadProgress,
      uploadProgressShow,
      deletedCurrentImage,
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
        deletedCurrentImage={deletedCurrentImage}
      />
    );
  }
}

UserAccountController.contextTypes = {
  router: PropTypes.object.isRequired,
};

UserAccountController.propTypes = {
  user: PropTypes.object.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth: { user } }) => ({
  user,
});

export default connect(mapStateToProps, {
  notifyError,
  notifySuccess,
  writeLog,
  update,
})(UserAccountController);
