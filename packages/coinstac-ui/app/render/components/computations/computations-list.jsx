import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Button,
  Table,
} from 'react-bootstrap';
import {
  COMPUTATION_CHANGED_SUBSCRIPTION,
  FETCH_ALL_COMPUTATIONS_METADATA_QUERY,
} from '../../state/graphql/functions';
import { getAllAndSubProp } from '../../state/graphql/props';
import ComputationIO from './computation-io';

const styles = {
  outputBox: { marginTop: 10, height: 400, overflowY: 'scroll' },
  topMargin: { marginTop: 10 },
};

class ComputationsList extends Component { // eslint-disable-line
  constructor(props) {
    super(props);

    this.state = {
      activeComp: null,
      unsubscribeComputations: null,
    };

    this.setActiveComp = this.setActiveComp.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.computations && !this.state.unsubscribeComputations) {
      this.setState({ unsubscribeComputations: this.props.subscribeToComputations(null) });
    }
  }

  componentWillUnmount() {
    this.state.unsubscribeComputations();
  }

  setActiveComp(comp) {
    this.setState({ activeComp: comp });
  }

  render() {
    const { computations } = this.props;

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">Computations</h1>
          <LinkContainer className="pull-right" to="/dashboard/computations/new">
            <Button bsStyle="primary" className="pull-right">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              Create Computation
            </Button>
          </LinkContainer>
        </div>
        {computations.length > 0 &&
          <Table striped bordered condensed style={styles.topMargin}>
            <thead>
              <tr>
                <th>Computation Name</th>
                <th>Get IO</th>
              </tr>
            </thead>
            <tbody>
              {computations.map((comp) => {
                return (
                  <tr key={`${comp.id}-row`}>
                    <td>{comp.meta.name}</td>
                    <td>
                      <Button bsStyle="primary" onClick={() => this.setActiveComp(comp)}>
                        Get IO
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        }

        {this.state.activeComp &&
          <div>
            {this.state.activeComp.meta.name}
            <ComputationIO computationId={this.state.activeComp.id} />
          </div>
        }
      </div>
    );
  }
}

ComputationsList.defaultProps = {
  computations: null,
};

ComputationsList.propTypes = {
  computations: PropTypes.array,
};

function mapStateToProps({ featureTest: { dockerOut } }) {
  return { dockerOut };
}

const ComputationsListWithData = graphql(FETCH_ALL_COMPUTATIONS_METADATA_QUERY, getAllAndSubProp(
  COMPUTATION_CHANGED_SUBSCRIPTION,
  'computations',
  'fetchAllComputations',
  'subscribeToComputations',
  'computationChanged'
))(ComputationsList);


export default connect(mapStateToProps)(ComputationsListWithData);
