import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  avatarWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    padding: 0,
  },
});

class PipelineStates extends Component {
  componentDidMount() {
    const { currentUser } = this.props;
    const { router } = this.context;

    if (!get(currentUser, 'permissions.roles.admin')) {
      router.push('/');
    }
  }

  render() {
    return (
      <div>
        <div className="page-header">
          <Typography variant="h4">
            Pipeline States
          </Typography>
        </div>
      </div>
    );
  }
}

PipelineStates.contextTypes = {
  router: PropTypes.object.isRequired,
};

PipelineStates.propTypes = {
  currentUser: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  currentUser: auth.user,
});

const connectedComponent = connect(mapStateToProps)(PipelineStates);

export default withStyles(styles, { withTheme: true })(connectedComponent);
