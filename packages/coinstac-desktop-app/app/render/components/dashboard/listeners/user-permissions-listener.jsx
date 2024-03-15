import { useSubscription } from '@apollo/client';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { setUser } from '../../../state/ducks/auth';
import {
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_USER_RUNS_QUERY,
  USER_CHANGED_SUBSCRIPTION,
} from '../../../state/graphql/functions';

function UserPermissionsListener({ userId, client }) {
  const dispatch = useDispatch();

  useSubscription(USER_CHANGED_SUBSCRIPTION, {
    variables: { userId },
    onSubscriptionData({ subscriptionData }) {
      if (!subscriptionData.data.userChanged) return;
      dispatch(setUser(subscriptionData.data.userChanged));

      // refetch client data behind permssion changes
      client.refetchQueries({
        include: [
          FETCH_ALL_PIPELINES_QUERY,
          FETCH_ALL_USER_RUNS_QUERY,
        ],
      });
    },
  });

  return null;
}

UserPermissionsListener.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserPermissionsListener;
