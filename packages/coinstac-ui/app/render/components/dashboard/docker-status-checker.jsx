import React from 'react';
import PropTypes from 'prop-types';
import { getDockerStatus } from '../../state/ducks/docker';

class DockerStatusChecker extends React.PureComponent {
  state = {
    dockerStatus: true,
  };

  componentWillMount() {
    const { onChangeStatus } = this.props;
    const { dockerStatus } = this.state;

    onChangeStatus(dockerStatus);

    this.timer = setInterval(async () => {
      try {
        const result = await getDockerStatus();

        this.setState({ dockerStatus: result == 'OK' });
      } catch (e) {
        this.setState({ dockerStatus: false });
      }
    }, 5000);
  }

  componentDidUpdate() {
    const { onChangeStatus } = this.props;
    const { dockerStatus } = this.state;

    onChangeStatus(dockerStatus);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return null;
  }
}

DockerStatusChecker.propTypes = {
  onChangeStatus: PropTypes.func.isRequired,
};

export default DockerStatusChecker;

