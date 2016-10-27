import React, { PropTypes } from 'react';

export default function ConsortiumTags(props) {
  const { tags } = props;

  return (
    <ul className="list-inline">
      {tags.map((tag, index) => {
        return (
          <li key={index}>
            <span className="label label-default">{tag}</span>
          </li>
        );
      })}
    </ul>
  );
}

ConsortiumTags.displayName = 'ConsortiumTags';

ConsortiumTags.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
};

