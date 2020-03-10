import React, { createRef, Component } from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import InputLabel from '@material-ui/core/InputLabel';
import LinearProgress from '@material-ui/core/LinearProgress';
import { withStyles } from '@material-ui/core/styles';
import RootRef from '@material-ui/core/RootRef';
import Icon from '@material-ui/core/Icon';
import classNames from 'classnames';
import Dropzone from 'react-dropzone';

const dropzoneRef = createRef();

const styles = theme => ({
  fileUpload: {
    borderColor: 'grey',
    borderStyle: 'dashed',
    borderWidth: '2px',
    padding: '1rem',
    marginTop: '0.5rem',
    marginBottom: '1rem'
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

  constructor(props) {
    super(props);

    this.state = {
      uploadedFile: null,
    };
  }

  onImageDrop = (files) => {
    this.props.handleImageUpload(files[0]);
  }

  render() {
    const {
      error,
      classes,
      user,
      handleImageDestroy,
      unSetPhoto,
      uploadedFileCloudinaryUrl,
      uploadedFileCloudinaryID,
      uploadProgress,
      uploadProgressShow
    } = this.props;

    const { uploadedFile } = this.state;

    return (
      <div>
        {uploadProgressShow &&
          <div className={classes.progressBarContainer}>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
            />
          </div>
        }
        {!uploadedFileCloudinaryUrl ?
        <div className={classes.fileUploadContainer}>
          <InputLabel>Profile Image</InputLabel>
          <div className={classes.fileUpload}>
            <Dropzone
              onDrop={this.onImageDrop.bind(this)}
              multiple={false}
              accept="image/*">
              {({getRootProps, getInputProps}) => (
                <section>
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <p>Drag 'n' drop some files here, or click to select files</p>
                  </div>
                </section>
              )}
            </Dropzone>
          </div>
        </div> :
        <div className={classes.filePreviewContainer}>
          <div className={classes.filePreview}>
            <img className={classes.filePreviewImg} src={uploadedFileCloudinaryUrl} />
            <div
              className={classes.filePreviewDeleteButton}
              onClick={() => {
                handleImageDestroy(uploadedFileCloudinaryID);
                unSetPhoto();
              }}
            >
            <Icon
              className={classNames('fa fa-times-circle', classes.timesIcon)} />
            </div>
          </div>
        </div>}
      </div>
    );
  }
}

UserImage.displayName = 'UserImage';

UserImage.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(UserImage);
