import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Button,
  Table,
} from 'react-bootstrap';
import { FETCH_ALL_COMPUTATIONS_METADATA_QUERY } from '../../state/graphql/functions';
import { computationsProp } from '../../state/graphql/props';
import ComputationIO from './computation-io';

const styles = {
  outputBox: { marginTop: 10, height: 400, overflowY: 'scroll' },
  topMargin: { marginTop: 10 },
};

class ComputationsList extends Component { // eslint-disable-line
  constructor(props) {
    super(props);

    this.state = { activeComp: null };

    this.setActiveComp = this.setActiveComp.bind(this);
  }

  setActiveComp(comp) {
    this.setState({ activeComp: comp });
  }

  render() {
    const { auth: { user }, computations } = this.props;

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">Computations</h1>
          {user.permissions.computations.write &&
            <LinkContainer className="pull-right" to="/dashboard/computations/new">
              <Button bsStyle="primary" className="pull-right">
                <span aria-hidden="true" className="glphicon glyphicon-plus" />
                {' '}
                Create Computation
              </Button>
            </LinkContainer>
          }
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

ComputationsList.propTypes = {
  auth: PropTypes.object.isRequired,
  computations: PropTypes.array.isRequired,
};

function mapStateToProps({ auth, featureTest: { dockerOut } }) {
  return { auth, dockerOut };
}

const ComputationsListWithData = graphql(
  FETCH_ALL_COMPUTATIONS_METADATA_QUERY,
  computationsProp
)(ComputationsList);


export default connect(mapStateToProps)(ComputationsListWithData);
