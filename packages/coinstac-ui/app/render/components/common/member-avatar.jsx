import React from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';

const styles = {
  containerStyles: {
    display: 'inline-block',
    margin: 5,
    verticalAlign: 'top',
    textAlign: 'center',
  },
  textStyles: {
    marginBottom: 0,
    textAlign: 'center',
    fontSize: 12,
  },
};

const MemberAvatar = ({ name, consRole, showDetails, width }) =>
  (
    <div key={`${name}-avatar`} style={{ ...styles.containerStyles, width }}>
      <Avatar name={name} size={width} />
      {consRole && showDetails &&
        <p className="bold" style={styles.textStyles}>{consRole}</p>
      }
      {showDetails && <p style={styles.textStyles}><em>{name}</em></p>}
    </div>
  );

MemberAvatar.propTypes = {
  name: PropTypes.string.isRequired,
  consRole: PropTypes.string,
  showDetails: PropTypes.bool,
  width: PropTypes.number.isRequired,
};

MemberAvatar.defaultProps = {
  consRole: null,
  showDetails: false,
};

export default MemberAvatar;
