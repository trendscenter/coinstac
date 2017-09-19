import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';

export default class Consortium extends Component {
  constructor(props) {
    super(props);

    this.maybeRenderResults = this.maybeRenderResults.bind(this);
    this.maybeRenderUsers = this.maybeRenderUsers.bind(this);
    this.renderDetails = this.renderDetails.bind(this);
  }
  
  render() {
    return (
      <div className="consortium">
        {this.renderDetails()}
        {this.maybeRenderUsers()}
        {this.maybeRenderResults()}
      </div>
    );
  }
}

Consortium.displayName = 'Consortium';

Consortium.propTypes = {
  addUser: PropTypes.func.isRequired,
  initialResultId: PropTypes.string,
  computations: PropTypes.arrayOf(PropTypes.object).isRequired,
  consortium: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    activeComputationInputs: PropTypes.array.isRequired,
    description: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    owners: PropTypes.arrayOf(PropTypes.string).isRequired,
    users: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
  isLoading: PropTypes.bool.isRequired,
  isMember: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  remoteResults: PropTypes.arrayOf(PropTypes.object).isRequired,
  removeUser: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
};

Consortium.defaultProps = {
  initialResultId: null,
  consortium: null,
};
