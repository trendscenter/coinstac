import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { get } from 'lodash';
import Typography from '@material-ui/core/Typography';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';

import ListItem from '../../common/list-item';
import ListDeleteModal from '../../common/list-delete-modal';
import useEntityListSubscription from '../../../utils/effects/use-entity-list-subscription';
import { isAdmin } from '../../../utils/helpers';
import {
  FETCH_ALL_HEADLESS_CLIENTS,
  HEADLESS_CLIENT_CHANGED_SUBSCRIPTION,
  DELETE_HEADLESS_CLIENT_MUTATION,
} from '../../../state/graphql/functions';

function HeadlessList({ auth }) {
  const { user } = auth;

  const { data, subscribeToMore } = useQuery(FETCH_ALL_HEADLESS_CLIENTS, { fetchPolicy: 'cache-and-network' });
  const [submitDelete] = useMutation(DELETE_HEADLESS_CLIENT_MUTATION);

  useEntityListSubscription(subscribeToMore, HEADLESS_CLIENT_CHANGED_SUBSCRIPTION, 'fetchAllHeadlessClients', 'headlessClientChanged');

  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [headlessClientToDelete, setHeadlessClientToDelete] = useState(null);

  const openDeleteConfirmationModal = id => () => {
    setShowDeleteConfirmationModal(true);
    setHeadlessClientToDelete(id);
  };

  function closeDeleteConfirmationModal() {
    setShowDeleteConfirmationModal(false);
    setHeadlessClientToDelete(null);
  }

  function deleteHeadlessClient() {
    submitDelete({ variables: { headlessClientId: headlessClientToDelete } });
    closeDeleteConfirmationModal();
  }

  const headlessClients = get(data, 'fetchAllHeadlessClients');

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          Cloud Users
        </Typography>
        <Fab
          color="primary"
          component={Link}
          to="/dashboard/headlessClients/new"
          name="create-headless-client-button"
          aria-label="add"
        >
          <AddIcon />
        </Fab>
      </div>
      {headlessClients && headlessClients.map(client => (
        <ListItem
          key={client.id}
          itemObject={client}
          owner={isAdmin(user)}
          deleteItem={openDeleteConfirmationModal}
          itemRoute="/dashboard/headlessClients"
        />
      ))}
      <ListDeleteModal
        close={closeDeleteConfirmationModal}
        deleteItem={deleteHeadlessClient}
        itemName="cloud user"
        show={showDeleteConfirmationModal}
      />
    </div>
  );
}

HeadlessList.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps)(HeadlessList);
