import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import ReactJson from 'react-json-view';
import { withStyles } from '@material-ui/core/styles';
import { FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';
import { compIOProp } from '../../state/graphql/props';

const styles = theme => ({
  wrapper: {
    marginTop: theme.spacing(1),
  },
});

const ComputationIO = ({ compIO, classes }) => (
  <div className={classes.wrapper}>
    <ReactJson
      src={compIO}
      theme="monokai"
      displayDataTypes={false}
      displayObjectSize={false}
      enableClipboard={false}
    />
  </div>
);

ComputationIO.defaultProps = {
  compIO: null,
};

ComputationIO.propTypes = {
  compIO: PropTypes.object,
  classes: PropTypes.object.isRequired,
};

const ComputationIOWithData = graphql(FETCH_COMPUTATION_QUERY, compIOProp)(ComputationIO);

export default withStyles(styles)(ComputationIOWithData);
