import React, { Component, PropTypes } from 'react';
import { Panel } from 'react-bootstrap';

class ConsortiumResult extends Component {
  render() {
    const { result } = this.props;
    return (
      <Panel>
        <h2 className="h4">RESULT</h2>
        <ul>
          <li><pre>{JSON.stringify(result, null, 2)}</pre></li>
        </ul>
      </Panel>
    );
  }
}

ConsortiumResult.displayName = 'ConsortiumResult';

ConsortiumResult.propTypes = {
  result: PropTypes.object.isRequired,
};

export default ConsortiumResult;
