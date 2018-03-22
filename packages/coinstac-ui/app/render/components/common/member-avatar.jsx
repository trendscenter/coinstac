import React from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';

const styles = {
  textStyles: {
    textAlign: 'center',
    fontSize: 12,
  },
};

const MemberAvatar = ({ name, role, width }) =>
  (
    <div key={`${name}-avatar`} style={{ width }}>
      <Avatar name={name} size={width} />
      {role &&
        <p className="bold" style={styles.textStyles}><em>{name}</em></p>
      }
      <p style={styles.textStyles}><em>{name}</em></p>
    </div>
  );

MemberAvatar.propTypes = {
  name: PropTypes.string.isRequired,
  role: PropTypes.string,
  width: PropTypes.number.isRequired,
};

MemberAvatar.defaultProps = {
  role: null,
};

export default MemberAvatar;
