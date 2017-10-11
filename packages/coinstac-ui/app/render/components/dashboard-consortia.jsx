import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux';
import ConsortiumCard from './consortium-card';
import {
  deleteConsortium,
  joinConsortium,
  leaveConsortium,
} from '../state/ducks/consortia';

class DashboardConsortia extends Component {
  renderConsortia() {
    const {
      consortia,
      deleteConsortium,
      joinConsortium,
      leaveConsortium,
      user: { username },
    } = this.props;

    return (
      <div>
        {consortia.map((consortium) => {
          const { _id: id, owners, users } = consortium;
          const isMember = users.indexOf(username) > -1;
          const isOwner = owners.indexOf(username) > -1;

          return (
            <ConsortiumCard
              deleteConsortium={() => deleteConsortium(id)}
              isMember={isMember}
              isOwner={isOwner}
              joinConsortium={() => joinConsortium(id, username)}
              key={id}
              leaveConsortium={() => leaveConsortium(id, username)}
              {...consortium}
            />
          );
        })}
      </div>
    );
  }

  render() {
    const { consortia, loading } = this.props;
    let content;
    if (loading.isLoading) {
      content = (<span />);
    } else if (consortia) {
      content = this.renderConsortia();
    }

    return (
      <div className="dashboard-consortia">
        <div className="page-header clearfix">
          <h1 className="pull-left">Consortia</h1>
          <LinkContainer className="pull-right" to="/dashboard/consortia/new">
            <Button bsStyle="primary" className="pull-right">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              Add Consortium
            </Button>
          </LinkContainer>
        </div>
        {content}
      </div>
    );
  }
}

DashboardConsortia.propTypes = {
  consortia: PropTypes.array,
  deleteConsortium: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
  loading: PropTypes.object,
  user: PropTypes.object.isRequired,
};

DashboardConsortia.defaultProps = {
  loading: null,
  consortia: null,
};

function mapStateToProps({ loading, consortia: { allConsortia }, auth: { user } }) {
  return { consortia: allConsortia, loading, user };
}

export default connect(mapStateToProps, {
  deleteConsortium,
  joinConsortium,
  leaveConsortium,
})(DashboardConsortia);
