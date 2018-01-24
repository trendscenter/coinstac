import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { clearUser, login } from '../../state/ducks/auth';
import FormLogin from './form-login';
import LayoutNoauth from '../layout-noauth';

class FormLoginController extends Component {
  constructor(props) {
    super(props);

    this.submit = this.submit.bind(this);
    this.checkForUser = this.checkForUser.bind(this);
  }

  componentDidMount() {
    this.checkForUser();
  }

  componentDidUpdate() {
    this.checkForUser();
  }

  checkForUser() {
    const { router } = this.context;
    if (this.props.auth.user.email.length) {
      router.push('/dashboard');
    }
  }

  submit(evt) {
    const userCred = this.formLogon.data();

    evt.preventDefault();

    this.props.login(userCred);
  }

  render() {
    const { auth, loading } = this.props;

    return (
      <LayoutNoauth>
        <FormLogin
          ref={(c) => { this.formLogon = c; }}
          auth={auth}
          loading={loading}
          submit={this.submit}
        />
      </LayoutNoauth>
    );
  }
}

FormLoginController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormLoginController.displayName = 'FormLoginController';

FormLoginController.propTypes = {
  auth: PropTypes.object.isRequired,
  loading: PropTypes.object.isRequired,
  login: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, loading }) => {
  return { auth, loading };
};

export default connect(mapStateToProps, {
  clearUser,
  login,
})(FormLoginController);
