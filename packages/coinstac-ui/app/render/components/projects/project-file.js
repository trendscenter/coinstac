import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import path from 'path';

/**
 * Project file.
 *
 * @param {Object} props
 * @param {string} props.filename Full file path
 * @param {Function} [props.onRemove]
 * @returns {React.Component}
 */
export default function ProjectFile({ filename, onRemove }) {
  const { base, dir } = path.parse(filename);
  const className = classnames({
    'project-file': true,
    'project-file-has-btn': !!onRemove,
  });
  const removeButton = onRemove ?
  (
    <Button
      aria-label="Remove file"
      bsStyle="link"
      className="project-file-btn"
      onClick={onRemove}
      title="Remove file"
    >
      <span
        aria-hidden="true"
        className="glyphicon glyphicon-remove-circle"
      ></span>
    </Button>
  ) :
  undefined;

  return (
    <div className={className}>
      <span
        aria-hidden="true"
        className="project-file-icon glyphicon glyphicon-file"
      ></span>
      <strong className="project-file-base">{base}</strong>
      <span className="project-file-dir">{dir}</span>
      {removeButton}
    </div>
  );
}

ProjectFile.propTypes = {
  filename: PropTypes.string.isRequired,
  onRemove: PropTypes.func,
};
