import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import app from 'ampersand-app';

import FormConsortium from './form-consortium';
import { saveConsortium } from '../state/ducks/consortia';

class FormConsortiumController extends Component {
  constructor(props) {
    super(props);

    this.onReset = this.onReset.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(consortium) {
    const { auth, consortiumId, dispatch } = this.props;

    const toSave = consortiumId ?
      // Editing consortium:
      consortium :

      // New consortium:
      Object.assign({}, consortium, {
        owners: [auth.user.username],
        users: [auth.user.username],
      });

    dispatch(saveConsortium(toSave))
      .then(() => {
        this.context.router.push('/consortia');
      })
      .catch(error => {
        app.notify('error', error.message);
        console.error(error); // eslint-disable-line no-console
      });
  }

  onReset() {
    this.context.router.push('/consortia');
  }

  render() {
    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">Add New Consortium</h1>
        </div>
        <FormConsortium
          consortiumId={this.props.consortiumId}
          onSubmit={this.onSubmit}
          onReset={this.onReset}
        />
      </div>
    );
  }
}

FormConsortiumController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormConsortiumController.propTypes = {
  auth: PropTypes.object.isRequired,
  consortiumId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state, { params: { consortiumId } }) {
  const { auth, consortia } = state;

  return { auth, consortia, consortiumId };
}

export default connect(mapStateToProps)(FormConsortiumController);
