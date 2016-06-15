import React, { Component, PropTypes } from 'react';
import { Panel, ProgressBar } from 'react-bootstrap';

/**
 * Convert an object to a React `ul`.
 */
function toList(data) {
  return (
    <ul>
      {Object.keys(data).map((key) => {
        let value;
        if (Array.isArray(data)) {
          value = (<span>{data.map(toList)}</span>);
        } else if (data[key] instanceof Object) {
          value = toList(data[key]);
        } else {
          value = data[key];
        }
        return (
          <li key={key}><strong>{key}:</strong>{' '}{value}</li>
        );
      })}
    </ul>
  );
}

class ConsortiumSingleResult extends Component {
  constructor(props) {
    super(props);
    this.renderData = this.renderData.bind(this);
    this.renderProgress = this.renderProgress.bind(this);
  }
  renderData() {
    const { data } = this.props;
    return toList(data);
  }
  renderProgress() {
    const { error, history, maxIterations } = this.props;
    const now = Math.round(100 * (history.length) / maxIterations);
    let label;

    if (now === 100) {
      label = 'Complete';
    } else if (now > 0) {
      label = `${now}% complete`;
    }

    if (error) {
      return (
        <div>
          <ProgressBar bsStyle="danger" label="Error" now={now} />
          <p className="text-danger">{error}</p>
        </div>
      );
    }

    return (
      <ProgressBar bsStyle="success" label={label} now={now} />
    );
  }
  render() {
    const {
      _id: id,
      files,
      history,
      maxIterations,
      sampleSize,
    } = this.props;

    return (
      <Panel key={id}>
        {this.renderProgress()}
        {this.renderData()}
        <ul className="list-unstyled">
          <li>ID: <code>{id}</code></li>
          <li>Files: <strong>{files.length}</strong></li>
          <li>Sample Size: <strong>{sampleSize}</strong></li>
          <li>Current Iteration: <strong>{history.length}</strong></li>
          <li>Max Iteration: <strong>{maxIterations}</strong></li>
        </ul>
      </Panel>
    );
  }
}

ConsortiumSingleResult.defaultProps = {
  contributors: [],
  data: {},
  files: [],
  history: [],
  sampleSize: 0,
};

ConsortiumSingleResult.displayName = 'ConsortiumSingleResult';

ConsortiumSingleResult.propTypes = {
  _id: PropTypes.string.isRequired,
  contributors: PropTypes.array.isRequired,
  data: PropTypes.object.isRequired,
  error: PropTypes.any,
  files: PropTypes.array.isRequired,
  history: PropTypes.array.isRequired,
  maxIterations: PropTypes.number.isRequired,
  sampleSize: PropTypes.number.isRequired,
};

export default ConsortiumSingleResult;
