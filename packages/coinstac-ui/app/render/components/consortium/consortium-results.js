import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import { setExpandedComputation } from '../../state/ducks/consortia-page';

import ConsortiumResult from './consortium-result';

class ConsortiumResults extends Component {
  constructor(props) {
    super(props);

    this.goToHash = this.goToHash.bind(this);
  }

  componentWillMount() {
    const { initialComputationId, setExpandedComputation } = this.props;

    setExpandedComputation(initialComputationId);
  }

  componentDidMount() {
    this.goToHash();
  }

  goToHash() {
    if (document.querySelector('#results')) {
      document.querySelector('#results').scrollIntoView();
    }
  }

  toggleCollapse(computationId) {
    const { setExpandedComputation, expandedComputation } = this.props;

    if (computationId !== expandedComputation) setExpandedComputation(computationId);
    else setExpandedComputation('');
  }

  render() {
    const { expandedComputation, computations, remoteResults } = this.props;
    const content = !remoteResults || !remoteResults.length ?
    (
      <Alert bsStyle="info">No results.</Alert>
    ) :
    (
      <ul className="list-unstyled">
        {remoteResults
          .slice(0)
          .sort(ConsortiumResults.compareRemoteResults)
          .map((result, index) => {
            const computation = computations.find(c => {
              return c._id === result.computationId;
            });

            return (
              <li key={index} id={result.computationId}>
                <ConsortiumResult
                  computation={computation}
                  expanded={result.computationId === expandedComputation}
                  toggleCollapse={() => this.toggleCollapse(result.computationId)}
                  {...result}
                />
              </li>
            );
          })
        }
      </ul>
    );

    return (
      <section id="results">
        <h2 className="h4">Results:</h2>
        {content}
      </section>
    );
  }
}

ConsortiumResults.displayName = 'ConsortiumResults';

ConsortiumResults.propTypes = {
  expandedComputation: PropTypes.string.isRequired,
  computations: PropTypes.array,
  initialComputationId: PropTypes.string.isRequired,
  remoteResults: PropTypes.array,
  setExpandedComputation: PropTypes.func,
};

/**
 * Compare remote results for sorting purposes.
 *
 * @param {RemoteResult} a
 * @param {RemoteResult} b
 * @returns {number}
 */
ConsortiumResults.compareRemoteResults = (
  { endDate: a },
  { endDate: b }
) => {
  if (a < b) {
    return 1;
  } else if (a > b) {
    return -1;
  }

  return 0;
};

const mapStateToProps = ({ consortiaPage }) => {
  const { expandedComputation } = consortiaPage;

  return { expandedComputation };
};

export default connect(mapStateToProps, { setExpandedComputation })(ConsortiumResults);
