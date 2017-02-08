import React, { Component, PropTypes } from 'react';
import { Alert } from 'react-bootstrap';

import ConsortiumResult from './consortium-result';

export default class ConsortiumResults extends Component {
  constructor(props) {
    super(props);

    // TODO: `state` holds collapsed/expanded bool for remote results. Move to redux.
    this.state = {
      expanded: [true],
    };
  }

  toggleCollapse(index) {
    if (index in this.state.expanded) {
      this.state.expanded[index] = !this.state.expanded[index];
    } else {
      this.state.expanded[index] = true;
    }

    this.setState({
      expanded: this.state.expanded,
    });
  }

  render() {
    const { computations, remoteResults } = this.props;
    const content = !remoteResults || !remoteResults.length ?
    (
      <Alert bsStyle="info">No results.</Alert>
    ) :
    (
      <ul className="list-unstyled">
        {remoteResults.map((result, index) => {
          const computation = computations.find(c => {
            return c._id === result.computationId;
          });

          return (
            <li key={index}>
              <ConsortiumResult
                computation={computation}
                expanded={!!this.state.expanded[index]}
                toggleCollapse={() => this.toggleCollapse(index)}
                {...result}
              />
            </li>
          );
        })}
      </ul>
    );

    return (
      <section>
        <h2 className="h4">Results:</h2>
        {content}
      </section>
    );
  }
}

ConsortiumResults.displayName = 'ConsortiumResults';

ConsortiumResults.propTypes = {
  computations: PropTypes.array,
  remoteResults: PropTypes.array,
};

