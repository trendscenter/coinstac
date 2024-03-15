import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { resetPassword } from '../../state/ducks/auth';
import LayoutNoauth from '../layout-noauth';
import FormResetPassword from './form-reset-password';

const styles = theme => ({
  paper: {
    padding: theme.spacing(2),
    maxWidth: 300,
    marginBottom: theme.spacing(2),
  },
});

class FormResetPasswordController extends Component {
  constructor(props) {
    super(props);

    this.state = {
      resettingPassword: false,
    };
  }

  handleResetPassword = (values) => {
    const { router } = this.context;
    const { resetPassword } = this.props;

    this.setState({ resettingPassword: true });

    resetPassword(values)
      .then(() => router.push('/login'))
      .finally(() => {
        this.setState({ resettingPassword: false });
      });
  }

  render() {
    const { classes } = this.props;
    const { resettingPassword } = this.state;

    return (
      <LayoutNoauth>
        <Paper className={classes.paper}>
          <FormResetPassword
            loading={resettingPassword}
            onSubmit={this.handleResetPassword}
          />
        </Paper>
      </LayoutNoauth>
    );
  }
}

FormResetPasswordController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormResetPasswordController.propTypes = {
  classes: PropTypes.object.isRequired,
  resetPassword: PropTypes.func.isRequired,
};

FormResetPasswordController.displayName = 'FormResetPasswordController';

const mapStateToProps = ({ auth, loading }) => ({
  auth,
  loading,
});

const connectedComponent = connect(mapStateToProps, {
  resetPassword,
})(FormResetPasswordController);

export default withStyles(styles)(connectedComponent);
