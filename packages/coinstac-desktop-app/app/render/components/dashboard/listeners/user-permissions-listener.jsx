import { connect } from 'react-redux';
import { useSubscription } from '@apollo/client';
import PropTypes from 'prop-types';

import {
  USER_CHANGED_SUBSCRIPTION,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_USER_RUNS_QUERY,
} from '../../../state/graphql/functions';
import { setUser } from '../../../state/ducks/auth';

function UserPermissionsListener({ userId, setUser, client }) {
  useSubscription(USER_CHANGED_SUBSCRIPTION, {
    variables: { userId },
    onSubscriptionData({ subscriptionData }) {
      if (!subscriptionData.data.userChanged) return;
      setUser(subscriptionData.data.userChanged);

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

export default connect(null,
  {
    setUser,
  })(UserPermissionsListener);
