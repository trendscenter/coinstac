import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
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

    const { user } = props;

    this.state = {
      id: user.id,
      institution: user.institution,
      name: user.name,
      userName: user.username,
      email: user.email,
    };
  }

  handleChange = name => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleSubmit = (evt) => {
    evt.preventDefault();

    const {
      onSubmit,
      uploadedFileCloudinaryUrl,
      uploadedFileCloudinaryID,
    } = this.props;

    const {
      id,
      institution,
      email,
      name,
      userName,
    } = this.state;

    onSubmit({
      id,
      institution,
      name,
      username: userName.trim(),
      photo: uploadedFileCloudinaryUrl,
      photoID: uploadedFileCloudinaryID,
      email: email.trim(),
    });
  }

  render() {
    const {
      error,
      classes,
    } = this.props;

    const {
      institution,
      name,
      userName,
      email,
    } = this.state;

    return (
      <Paper className={classes.paper}>
        <form onSubmit={this.handleSubmit}>
          {
            error && (
              <p
                className={classNames(classes.bottomMargin, classes.error)}
                dangerouslySetInnerHTML={{ __html: error }}
              />
            )
          }
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

UserEdit.defaultProps = {
  error: null,
  uploadedFileCloudinaryID: null,
  uploadedFileCloudinaryUrl: null,
};

UserEdit.propTypes = {
  user: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.string,
  uploadedFileCloudinaryID: PropTypes.string,
  uploadedFileCloudinaryUrl: PropTypes.string,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(UserEdit);
