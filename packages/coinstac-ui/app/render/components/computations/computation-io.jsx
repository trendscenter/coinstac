import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { graphql, useMutation } from '@apollo/react-hoc';
import ReactJson from 'react-json-view';
import { Button, TextareaAutosize } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';
import { ADD_COMPUTATION_MUTATION } from '../../state/graphql/functions';
import { compIOProp } from '../../state/graphql/props';

const styles = theme => ({
  wrapper: {
    marginTop: theme.spacing(1),
  },
});

const ComputationIO = ({ compIO, classes }) => {
  if (!compIO) {
    return null;
  }

  // get the complete compspec
  // display the complete compspec
  const compSpecDbObject = JSON.parse(JSON.stringify(compIO));
  const inputSpec = JSON.stringify(compSpecDbObject.computation.input, null, 4);
  const [textAreaValue, setTextAreaValue] = useState(inputSpec);
  const [isModified, setIsModified] = useState(false);

  const [addComputation, { data, loading, error }] = useMutation(ADD_COMPUTATION_MUTATION);

  useEffect(() => {
    if (!inputSpec.includes(textAreaValue)) {
      setIsModified(true);
    }
  }, [textAreaValue]);

  const updateComputation = () => {
    // merge what has been changed into the complete compspec
    compSpecDbObject.computation.input = JSON.parse(textAreaValue);
    compSpecDbObject.meta = { id: compSpecDbObject.id };
    addComputation({ variables: { computationSchema: compSpecDbObject } });
  };


  return (
    <div className={classes.wrapper}>
      <TextareaAutosize
        value={textAreaValue}
        onChange={(e) => { setTextAreaValue(e.target.value); }}
        style={{ width: '100%' }}
      />

      <Button
        disabled={!isModified}
        onClick={updateComputation}
      >
        update
      </Button>
    </div>
  );
};

ComputationIO.defaultProps = {
  compIO: null,
};

ComputationIO.propTypes = {
  compIO: PropTypes.object,
  classes: PropTypes.object.isRequired,
};

const ComputationIOWithData = graphql(FETCH_COMPUTATION_QUERY, compIOProp)(ComputationIO);

export default withStyles(styles)(ComputationIOWithData);
