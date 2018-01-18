import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { graphql, compose } from 'react-apollo';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Alert,
  Button,
  Table,
} from 'react-bootstrap';
import {
  COMPUTATION_CHANGED_SUBSCRIPTION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  REMOVE_COMPUTATION_MUTATION,
} from '../../state/graphql/functions';
import { getAllAndSubProp, removeDocFromTableProp } from '../../state/graphql/props';
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

    this.removeComputation = this.removeComputation.bind(this);
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
    return () => {
      this.setState({ activeComp: comp });
    };
  }

  removeComputation(comp) {
    return () => {
      this.props.removeComputation(comp.id);
    };
  }

  render() {
    const { auth: { user }, computations } = this.props;

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
        {computations && computations.length > 0 &&
          <Table striped bordered condensed style={styles.topMargin}>
            <thead>
              <tr>
                <th>Computation Name</th>
                <th>Get IO</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {computations.map((comp) => {
                return (
                  <tr key={`${comp.id}-row`}>
                    <td>{comp.meta.name}</td>
                    <td>
                      <Button bsStyle="primary" onClick={this.setActiveComp(comp)}>
                        Get IO
                      </Button>
                    </td>
                    {user.id === comp.submittedBy &&
                      <td>
                        <Button bsStyle="primary" onClick={this.removeComputation(comp)}>
                          Delete
                        </Button>
                      </td>
                    }
                  </tr>
                );
              })}
            </tbody>
          </Table>
        }

        {(!computations || !computations.length) &&
          <Alert bsStyle="info">
            No computations found
          </Alert>
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
  removeComputation: null,
  subscribeToComputations: null,
};

ComputationsList.propTypes = {
  auth: PropTypes.object.isRequired,
  computations: PropTypes.array,
  removeComputation: PropTypes.func,
  subscribeToComputations: PropTypes.func,
};

function mapStateToProps({ auth, featureTest: { dockerOut } }) {
  return { auth, dockerOut };
}

const ComputationsListWithData = compose(
  graphql(FETCH_ALL_COMPUTATIONS_QUERY, getAllAndSubProp(
    COMPUTATION_CHANGED_SUBSCRIPTION,
    'computations',
    'fetchAllComputations',
    'subscribeToComputations',
    'computationChanged'
  )),
  graphql(REMOVE_COMPUTATION_MUTATION, removeDocFromTableProp(
    'computationId',
    'removeComputation',
    FETCH_ALL_COMPUTATIONS_QUERY,
    'fetchAllComputations'
  ))
)(ComputationsList);


export default connect(mapStateToProps)(ComputationsListWithData);
