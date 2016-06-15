import React, { PropTypes } from 'react';
import FormAddConsortium from './form-add-consortium';
import { saveConsortium } from 'app/render/state/ducks/consortium';
import { connect } from 'react-redux';

class FormAddConsortiumController extends React.Component {

  handleClickCancel() {
    // hashHistory.push('/consortia');
    // @TODO why is onClick called immediately on cancel button
  }

  submit(consortium) {
    const { dispatch } = this.props;
    const { router } = this.context;
    const tium = Object.assign({}, consortium, {
      owners: [this.props.auth.user.username],
      users: [this.props.auth.user.username],
    });
    dispatch(saveConsortium(tium))
    .then((newTium) => {
      router.push(`/consortia/${newTium._id}`);
    });
  }

  render() {
    const { loading } = this.props;
    return (
      <FormAddConsortium
        ref="add"
        loading={loading}
        onCancel={this.handleClickCancel.bind(this)}
        onSubmit={this.submit.bind(this)}
      />
    );
  }
}

FormAddConsortiumController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormAddConsortiumController.propTypes = {
  auth: PropTypes.object.isRequired,
  loading: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  const { auth, loading } = state;
  return { auth, loading };
};

export default connect(mapStateToProps)(FormAddConsortiumController);
