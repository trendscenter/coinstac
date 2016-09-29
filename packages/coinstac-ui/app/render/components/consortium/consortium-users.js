import React, { PropTypes } from 'react';

import UserList from '../user-list';

export default function ConsortiumUsers(props) {
  const { users } = props;

  return (
    <div className="consortium-users">
      <h2 className="h4">Users:</h2>
      <UserList size="large" users={users} />
    </div>
  );
}

ConsortiumUsers.displayName = 'ConsortiumUsers';

ConsortiumUsers.propTypes = {
  users: PropTypes.arrayOf(PropTypes.string).isRequired,
};

