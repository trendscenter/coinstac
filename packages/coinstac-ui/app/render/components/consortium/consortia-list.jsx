import React from 'react';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Alert, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';
import ConsortiaListItem from './consortia-list-item';
import { fetchAllConsortiaFunc } from '../../state/graphql/functions';
import { consortiaProp } from '../../state/graphql/props';

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

const ConsortiaList = ({ auth: { user }, consortia }) => (
  <div>
    <div className="page-header clearfix">
      <h1 className="pull-left">Consortia</h1>
      <LinkContainer className="pull-right" to="/dashboard/consortia/new">
        <Button bsStyle="primary" className="pull-right">
          <span aria-hidden="true" className="glphicon glyphicon-plus" />
          {' '}
          Create Consortium
        </Button>
      </LinkContainer>
    </div>
    {consortia && consortia.map(consortium => (
      <ConsortiaListItem
        key={`${consortium.name}-list-item`}
        consortium={consortium}
        owner={isUserA(user.id, consortium.owners)}
        user={isUserA(user.id, consortium.users)}
      />
    ))}
    {!consortia &&
      <Alert bsStyle="info">
        No consortia found
      </Alert>
    }
  </div>
);

ConsortiaList.propTypes = {
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array,
};

ConsortiaList.defaultProps = {
  consortia: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const ConsortiaListWithData = graphql(fetchAllConsortiaFunc, consortiaProp)(ConsortiaList);

export default connect(mapStateToProps)(ConsortiaListWithData);
