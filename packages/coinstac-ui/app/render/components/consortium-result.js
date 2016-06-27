import React, { Component, PropTypes } from 'react';
import { Label, Panel, ProgressBar } from 'react-bootstrap';

function toUl(items) {
  /*
   <ul>
    {Object.keys(data).map((key, i) => {
      const value = data[key];

      if (!(value instanceof Object)) {
        return <li key={i}>{key}: <strong>{data[key].toString()}</strong></li>;
      }
    })}
  </ul>
  */

  return <pre>{JSON.stringify(items, null, 2)}</pre>;
}

class ConsortiumResult extends Component {
  render() {
    const {
      _id,
      computation,
      complete,
      data,
      history,
      pipelineState,
      userErrors,
      usernames,
    } = this.props;

    let computationOutput;
    let dataOutput;
    let errors;
    let indicator;
    let progressBar;
    let stateOutput;

    if (userErrors.length) {
      indicator = <Label bsStyle="danger">Error!</Label>;
    } else if (complete) {
      indicator = <Label bsStyle="success">Complete!</Label>;
    } else {
      indicator = <Label bsStyle="default">In Progress</Label>;
    }

    if (userErrors.length) {
      errors = (
        <div>
          <h3 className="h4">User errors:</h3>
          {userErrors.map((error, i) => {
            return <p key={i} className="bg-danger">{error}</p>;
          })}
        </div>
      );
    }

    stateOutput = (
      <div>
        <h3 className="h4">Computation state:</h3>
        <ul>
          <li>Iteration #: <strong>{history.length}</strong></li>
          <li>Pipeline step: <strong>{pipelineState.step}</strong></li>
          <li>Users: <strong>{usernames.join(', ')}</strong></li>
        </ul>
      </div>
    );

    if (computation) {
      computationOutput = (
        <p><strong>{computation.name}</strong> @ {computation.version}</p>
      );
    }

    /**
     * @todo The ridge-regression is programmed to max out at 50 iterations for
     * the demo. Remove progress bar afterwards.
     */
    if (computation && computation.name.indexOf('ridge-regression') > -1) {
      const now = history.length * 2;
      let bsStyle;

      if (userErrors.length) {
        bsStyle = 'danger';
      } else if (now === 100) {
        bsStyle = 'success';
      } else {
        bsStyle = 'default';
      }

      progressBar = (
        <ProgressBar bsStyle={bsStyle} now={now} label={history.length} />
      );
    }

    if (data) {
      dataOutput = (
        <div>
          <h3 className="h4">Data:</h3>
          {toUl(data)}
        </div>
      );
    }

    const headingStyle = { marginTop: 0 };

    return (
      <Panel>
        <h2 className="h3" style={headingStyle}>Computation #{_id} {indicator}</h2>
        {progressBar}
        {computationOutput}
        {errors}
        {dataOutput}
        {stateOutput}
      </Panel>
    );
  }
}

ConsortiumResult.displayName = 'ConsortiumResult';

ConsortiumResult.propTypes = {
  _id: PropTypes.string.isRequired,
  computation: PropTypes.object,
  complete: PropTypes.bool.isRequired,
  data: PropTypes.object,
  history: PropTypes.array.isRequired,
  pipelineState: PropTypes.object.isRequired,
  pluginState: PropTypes.object.isRequired,
  usernames: PropTypes.array.isRequired,
  userErrors: PropTypes.array.isRequired,
};

export default ConsortiumResult;
