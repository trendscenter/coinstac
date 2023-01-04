import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export default function UserList(props) {
  const { size, users } = props;
  const className = classNames(['user-list', 'list-inline'], {
    'user-list-large': size === 'large',
  });

  return (
    <ul className={className}>
      {users.map((username, i) => {
        const tooltip = <Tooltip id={`user-item-${i}`}>{username}</Tooltip>;
        const src = `../render/images/avatar-${(i % 3) + 1}.jpg`;
        // TODO: Use users' actual avatars
        return (
          <li className="user-list-item" key={username}>
            <OverlayTrigger overlay={tooltip} placement="bottom">
              <img src={src} alt={username} />
            </OverlayTrigger>
          </li>
        );
      })}
    </ul>
  );
}

UserList.propTypes = {
  size: PropTypes.oneOf(['large', 'regular']),
  users: PropTypes.arrayOf(PropTypes.string).isRequired,
};

UserList.defaultProps = {
  size: null,
};
