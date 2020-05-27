import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  login,
  setAppDirectory,
  checkApiVersion,
} from '../../state/ducks/auth';
import FormLogin from './form-login';
import LayoutNoauth from '../layout-noauth';

class FormLoginController extends Component {
  constructor(props) {
    super(props);

    this.submit = this.submit.bind(this);
    this.checkForUser = this.checkForUser.bind(this);
    this.changeAppDirectory = this.changeAppDirectory.bind(this);
  }

  componentDidMount() {
    const { checkApiVersion } = this.props;

    checkApiVersion();
    this.checkForUser();
  }

  componentDidUpdate() {
    this.checkForUser();
  }

  checkForUser() {
    const { router } = this.context;
    const { auth: { user } } = this.props;
    if (user && user.email.length) {
      router.push('/dashboard');
    }
  }

  submit(data) {
    const { login } = this.props;
    login(data);
  }

  changeAppDirectory(appDirectory) {
    const { setAppDirectory } = this.props;
    setAppDirectory(appDirectory);
  }

  render() {
    const { auth, loading } = this.props;

    return (
      <LayoutNoauth>
        <FormLogin
          auth={auth}
          loading={loading}
          submit={this.submit}
          changeAppDirectory={this.changeAppDirectory}
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
  checkApiVersion: PropTypes.func.isRequired,
  login: PropTypes.func.isRequired,
  setAppDirectory: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, loading }) => ({
  auth, loading,
});

export default connect(mapStateToProps, {
  login,
  setAppDirectory,
  checkApiVersion,
})(FormLoginController);
