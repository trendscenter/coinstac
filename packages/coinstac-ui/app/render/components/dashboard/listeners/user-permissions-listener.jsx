import { connect } from 'react-redux';
import { useSubscription } from '@apollo/client';
import PropTypes from 'prop-types';

import { USER_CHANGED_SUBSCRIPTION } from '../../../state/graphql/functions';
import { setUser } from '../../../state/ducks/auth';

function UserPermissionsListener({ userId, setUser }) {
  useSubscription(USER_CHANGED_SUBSCRIPTION, {
    variables: { userId },
    onSubscriptionData({ subscriptionData }) {
      if (!subscriptionData.data.userChanged) return;

      setUser(subscriptionData.data.userChanged);
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
