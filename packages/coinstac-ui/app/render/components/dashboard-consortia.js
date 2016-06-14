import React, { PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import ConsortiumCard from './consortium-card';
import { connect } from 'react-redux';
import { setConsortia, fetchConsortia } from 'app/render/state/ducks/consortia.js';
import noop from 'lodash/noop';

class DashboardConsortia extends React.Component {

  componentWillMount() {
    const { dispatch } = this.props;
    dispatch(fetchConsortia(noop));
  }

  render() {
    const { consortia, loading } = this.props;
    let content;
    if (loading.isLoading) {
      content = (<span></span>);
    } else if (consortia) {
      content = consortia.map((consortium) => {
        return (
          <div className="col-xs-12 col-sm-6" key={consortium._id}>
            <ConsortiumCard
              _id={consortium._id}
              label={consortium.label}
              users={consortium.users}
              description={consortium.description}
              tags={consortium.tags}
            />
          </div>
        );
      });
    }

    return (
      <div className="dashboard-consortia">
        <div className="page-header">
          <h1>Consortia</h1>
        </div>
        <LinkContainer to="/consortia/new" id="add_consortium">
          <Button bsStyle="primary" className="pull-right">
            Add Consortium
          </Button>
        </LinkContainer>
        <div className="row">
          {content}
        </div>
      </div>
    );
  }
}

DashboardConsortia.propTypes = {
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.object,
  consortia: PropTypes.array,
};

function select(state) {
  return {
    loading: state.loading,
    consortia: state.consortia,
  };
}

export default connect(select)(DashboardConsortia);
