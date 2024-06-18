import { useMutation, useQuery } from '@apollo/client';
import Fab from '@material-ui/core/Fab';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import { get } from 'lodash';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';

import {
  DELETE_HEADLESS_CLIENT_MUTATION,
  FETCH_ACCESSIBLE_HEADLESS_CLIENTS,
  HEADLESS_CLIENT_CHANGED_SUBSCRIPTION,
} from '../../../state/graphql/functions';
import useEntityListSubscription from '../../../utils/effects/use-entity-list-subscription';
import { isAdmin } from '../../../utils/helpers';
import ListDeleteModal from '../../common/list-delete-modal';
import ListItem from '../../common/list-item';

function HeadlessList() {
  const user = useSelector(state => state.auth.user);

  const { data, subscribeToMore } = useQuery(FETCH_ACCESSIBLE_HEADLESS_CLIENTS, {
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      /* eslint-disable-next-line no-console */
      console.error({ error });
    },
  });
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
          Vault Users
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
        itemName="vault user"
        show={showDeleteConfirmationModal}
      />
    </div>
  );
}

export default HeadlessList;
