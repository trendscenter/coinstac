import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Alert, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';
import ListItem from '../common/list-item';
import {
  deleteConsortiumByIdFunc,
  joinConsortiumFunc,
  leaveConsortiumFunc,
  fetchAllConsortiaFunc,
  fetchAllPipelinesFunc,
} from '../../state/graphql/functions';
import { consortiaProp, pipelinesProp } from '../../state/graphql/props';

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

const getOptions = (user, owner, id, joinConsortium, leaveConsortium) => {
  const options = [];

  if (user && !owner) {
    options.push(
      <Button
        key="leave-cons-button"
        bsStyle="warning"
        className="pull-right"
        onClick={() => leaveConsortium(id)}
      >
        Leave Consortium
      </Button>
    );
  } else if (!user && !owner) {
    options.push(
      <Button
        key="join-cons-button"
        bsStyle="primary"
        className="pull-right"
        onClick={() => joinConsortium(id)}
      >
        Join Consortium
      </Button>
    );
  }

  return options;
};

const ConsortiaList = ({
  auth: { user },
  consortia,
  pipelines,
  deleteConsortium,
  joinConsortium,
  leaveConsortium,
}) => (
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
      <ListItem
        key={`${consortium.name}-list-item`}
        itemObject={consortium}
        deleteItem={deleteConsortium}
        owner={isUserA(user.id, consortium.owners)}
        itemOptions={
          getOptions(
            isUserA(user.id, consortium.users),
            isUserA(user.id, consortium.owners),
            consortium.id,
            joinConsortium,
            leaveConsortium
          )
        }
        itemRoute={'/dashboard/consortia'}
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
  pipelines: PropTypes.array,
  deleteConsortium: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
};

ConsortiaList.defaultProps = {
  consortia: null,
  pipelines: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const ConsortiaListWithData = compose(
  graphql(fetchAllConsortiaFunc, consortiaProp),
  graphql(fetchAllPipelinesFunc, pipelinesProp),
  graphql(deleteConsortiumByIdFunc, {
    props: ({ mutate }) => ({
      deleteConsortium: consortiumId => mutate({
        variables: { consortiumId },
        update: (store, { data: { deleteConsortiumById } }) => {
          const data = store.readQuery({ query: fetchAllConsortiaFunc });
          const index = data.fetchAllConsortia.findIndex(con => con.id === deleteConsortiumById.id);
          if (index > -1) {
            data.fetchAllConsortia.splice(index, 1);
          }
          store.writeQuery({ query: fetchAllConsortiaFunc, data });
        },
      }),
    }),
  }),
  graphql(joinConsortiumFunc, {
    props: ({ mutate }) => ({
      joinConsortium: consortiumId => mutate({
        variables: { consortiumId },
        update: (store, { data: { joinConsortium } }) => {
          const data = store.readQuery({ query: fetchAllConsortiaFunc });
          const index = data.fetchAllConsortia.findIndex(con => con.id === joinConsortium.id);
          if (index > -1) {
            data.fetchAllConsortia[index].users = joinConsortium.users;
          }
          store.writeQuery({ query: fetchAllConsortiaFunc, data });
        },
      }),
    }),
  }),
  graphql(leaveConsortiumFunc, {
    props: ({ mutate }) => ({
      leaveConsortium: consortiumId => mutate({
        variables: { consortiumId },
        update: (store, { data: { leaveConsortium } }) => {
          const data = store.readQuery({ query: fetchAllConsortiaFunc });
          const index = data.fetchAllConsortia.findIndex(con => con.id === leaveConsortium.id);
          if (index > -1) {
            data.fetchAllConsortia[index].users = leaveConsortium.users;
          }
          store.writeQuery({ query: fetchAllConsortiaFunc, data });
        },
      }),
    }),
  })
)(ConsortiaList);

export default connect(mapStateToProps)(ConsortiaListWithData);
