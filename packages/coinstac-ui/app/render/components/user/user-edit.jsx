import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import memoize from 'memoize-one';
import UserImage from './user-image';

const styles = theme => ({
  bottomMargin: {
    marginBottom: 10,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    maxWidth: 300,
    marginBottom: theme.spacing.unit * 2,
  },
  formControl: {
    marginBottom: theme.spacing.unit * 2,
  },
  error: {
    textAlign: 'center',
    color: 'red',
  },
});

class UserEdit extends Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.user.id,
      institution: this.props.user.institution,
      name: this.props.user.name,
      userName: this.props.user.username,
      email: this.props.user.email,
    };
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleSubmit = (evt) => {
    evt.preventDefault();

    const {
      onSubmit,
      uploadedFileCloudinaryUrl,
      uploadedFileCloudinaryID
    } = this.props;

    const {
      id,
      institution,
      email,
      name,
      userName,
      userPhoto,
    } = this.state;

    onSubmit({
      id: id,
      institution: institution,
      name: name,
      username: userName.trim(),
      photo: uploadedFileCloudinaryUrl,
      photoID: uploadedFileCloudinaryID,
      email: email.trim(),
    });
  }

  checkPasswordsMatch = memoize(
    (password, confirmPassword) => password === confirmPassword
  );

  render() {
    const {
      error,
      classes,
      user,
      handleImageUpload,
      handleImageDestroy,
      uploadedFileCloudinaryUrl,
      uploadedFileCloudinaryID,
      uploadProgress,
      uploadProgressShow
    } = this.props;

    const {
      id,
      institution,
      name,
      userName,
      userPhoto,
      email,
    } = this.state;

    return (
      <Paper className={classes.paper}>
        <form onSubmit={this.handleSubmit}>
          {
            error &&
            <p
              className={classNames(classes.bottomMargin, classes.error)}
              dangerouslySetInnerHTML={{ __html: error }}
            />
          }
          <TextField
            type='hidden'
            value={id}
          />
          <TextField
            label="Name"
            value={name}
            onChange={this.handleChange('name')}
            fullWidth
            className={classes.formControl}
          />
          <TextField
            label="Institution"
            value={institution}
            onChange={this.handleChange('institution')}
            fullWidth
            className={classes.formControl}
          />
          <TextField
            label="Username"
            value={userName}
            onChange={this.handleChange('userName')}
            fullWidth
            className={classes.formControl}
          />
          <TextField
            label="Email"
            value={email}
            onChange={this.handleChange('email')}
            fullWidth
            className={classes.formControl}
          />
          <UserImage
            {...this.props}
            setPhoto={this.setPhoto}
            handleImageUpload={handleImageUpload}
            handleImageDestroy={handleImageDestroy}
            uploadedFileCloudinaryUrl={uploadedFileCloudinaryUrl}
            uploadedFileCloudinaryID={uploadedFileCloudinaryID}
            uploadProgress={uploadProgress}
            uploadProgressShow={uploadProgressShow}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={!userName || !email}
          >
            Submit
          </Button>
        </form>
      </Paper>
    );
  }
}

UserEdit.displayName = 'UserEdit';

UserEdit.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(UserEdit);
