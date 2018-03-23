import React from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';

const styles = {
  containerStyles: {
    display: 'inline-block',
    margin: 5,
  },
  textStyles: {
    marginBottom: 0,
    textAlign: 'center',
    fontSize: 12,
  },
};

const MemberAvatar = ({ name, consRole, width }) =>
  (
    <div key={`${name}-avatar`} style={{ ...styles.containerStyles, width }}>
      <Avatar name={name} size={width} />
      <p className={consRole ? 'bold' : null} style={styles.textStyles}>{name}</p>
      {consRole &&
        <p style={styles.textStyles}>{consRole}</p>
      }
    </div>
  );

MemberAvatar.propTypes = {
  name: PropTypes.string.isRequired,
  consRole: PropTypes.string,
  width: PropTypes.number.isRequired,
};

MemberAvatar.defaultProps = {
  consRole: null,
};

export default MemberAvatar;
