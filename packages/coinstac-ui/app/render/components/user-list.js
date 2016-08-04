import React, { PropTypes } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { remote } from 'electron';
import path from 'path';

const APP_PATH = remote.app.getAppPath();

export default function UserList(props) {
  const { users } = props;
  return (
    <div className="user-list">
      <h5 className="user-list-title">Users:</h5>
      <ul className="list-inline">
        {users.map((username, i) => {
          const tooltip = <Tooltip id={`user-item-${i}`}>{username}</Tooltip>;
          const src = path.join(
            APP_PATH,
            `/app/render/images/avatar-${i % 3 + 1}.jpg`
          );

          // TODO: Use users' actual avatars
          return (
            <li className="user-list-item" key={i}>
              <OverlayTrigger overlay={tooltip} placement="bottom">
                <img src={src} alt={username} />
              </OverlayTrigger>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

UserList.propTypes = {
  users: PropTypes.arrayOf(PropTypes.string).isRequired,
};

