import React from 'react';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import ConsortiaListItem from './consortia-list-item';
import { fetchAllConsortia } from '../../state/graphql-queries';

const isUserA = (userId, groupArr) => {

};

const ConsortiaList = ({ auth, consortia }) => (
  <div>
    {consortia.map(consortium => (
      <ConsortiaListItem
        consortium={consortium}
        owner={isUserA()}
        user={isUserA()}
      />
    ))}
  </div>
);

ConsortiaList.propTypes = {
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const ConsortiaListWithData = graphql(fetchAllConsortia, {
  props: ({ data: { fetchAllConsortia } }) => ({
    consortia: fetchAllConsortia,
  }),
})(ConsortiaList);

export default connect(mapStateToProps)(ConsortiaListWithData);
