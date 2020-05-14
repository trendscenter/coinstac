import React, { Component } from 'react';
import PropTypes from 'prop-types';
import InputLabel from '@material-ui/core/InputLabel';
import LinearProgress from '@material-ui/core/LinearProgress';
import { withStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import classNames from 'classnames';
import Dropzone from 'react-dropzone';

const styles = () => ({
  fileUpload: {
    borderColor: 'grey',
    borderStyle: 'dashed',
    borderWidth: '2px',
    padding: '1rem',
    marginTop: '0.5rem',
    marginBottom: '1rem',
  },
  filePreview: {
    position: 'relative',
    float: 'left',
    marginTop: '0.5rem',
    marginBottom: '1rem',
  },
  filePreviewImg: {
    width: '100px',
    height: '100px',
  },
  filePreviewDeleteButton: {
    padding: 0,
    border: 'none',
  },
  progressBarContainer: {
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
  },
  timesIcon: {
    color: '#f05a29 !important',
    fontSize: '1.25rem',
    position: 'absolute',
    top: '-0.75rem',
    right: '-0.75rem',
    background: 'white',
    borderRadius: '50%',
    border: '2px solid white',
    width: '1.5rem',
    height: '1.5rem',
  },
});

class UserImage extends Component {
  onImageDrop = (files) => {
    const { handleImageUpload } = this.props;

    handleImageUpload(files[0]);
  }

  removeImage = () => {
    const { handleImageDestroy, uploadedFileCloudinaryID } = this.props;

    handleImageDestroy(uploadedFileCloudinaryID);
  }

  render() {
    const {
      classes,
      uploadedFileCloudinaryUrl,
      uploadProgress,
      uploadProgressShow,
    } = this.props;

    return (
      <div>
        {
          uploadProgressShow && (
            <div className={classes.progressBarContainer}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
              />
            </div>
          )
        }
        {
          !uploadedFileCloudinaryUrl ? (
            <div className={classes.fileUploadContainer}>
              <InputLabel>Profile Image</InputLabel>
              <div className={classes.fileUpload}>
                <Dropzone
                  onDrop={this.onImageDrop}
                  multiple={false}
                  accept="image/*"
                >
                  {
                    ({ getRootProps, getInputProps }) => (
                      <section>
                        <div {...getRootProps()}>
                          <input {...getInputProps()} />
                          <p>{ 'Drag \'n\' drop some files here, or click to select files' }</p>
                        </div>
                      </section>
                    )
                  }
                </Dropzone>
              </div>
            </div>
          ) : (
            <div className={classes.filePreviewContainer}>
              <div className={classes.filePreview}>
                <img className={classes.filePreviewImg} src={uploadedFileCloudinaryUrl} alt="user" />
                <button
                  className={classes.filePreviewDeleteButton}
                  onClick={this.removeImage}
                  type="button"
                >
                  <Icon className={classNames('fa fa-times-circle', classes.timesIcon)} />
                </button>
              </div>
            </div>
          )
        }
      </div>
    );
  }
}

UserImage.defaultProps = {
  uploadedFileCloudinaryID: null,
  uploadedFileCloudinaryUrl: null,
  uploadProgress: 0,
  uploadProgressShow: false,
};

UserImage.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  handleImageUpload: PropTypes.func.isRequired,
  handleImageDestroy: PropTypes.func.isRequired,
  uploadedFileCloudinaryID: PropTypes.string,
  uploadedFileCloudinaryUrl: PropTypes.string,
  uploadProgress: PropTypes.number,
  uploadProgressShow: PropTypes.bool,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(UserImage);
