import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { graphql, useMutation } from '@apollo/react-hoc';
import ReactJson from 'react-json-view';
import { withStyles } from '@material-ui/core/styles';
import { Button, TextareaAutosize } from '@material-ui/core';
import { ADD_COMPUTATION_MUTATION, FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';
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

  const compSpecDbObject = JSON.parse(JSON.stringify(compIO));
  delete compSpecDbObject.id;
  delete compSpecDbObject.__typename;
  delete compSpecDbObject.computation.__typename;
  delete compSpecDbObject.computation.remote.__typename;
  delete compSpecDbObject.meta.__typename;
  const inputSpec = JSON.stringify(compSpecDbObject, null, 4);
  const [textAreaValue, setTextAreaValue] = useState(inputSpec);
  const [isModified, setIsModified] = useState(false);
  const [addComputation] = useMutation(ADD_COMPUTATION_MUTATION);

  const updateComputation = () => {
    const val = JSON.parse(textAreaValue);

    addComputation({ variables: { computationSchema: val } });
  };

  useEffect(() => {
    if (!inputSpec.includes(textAreaValue)) {
      setIsModified(true);
    }
  }, [textAreaValue]);

  return (
    <div>
      <TextareaAutosize
        value={textAreaValue}
        onChange={(e) => { setTextAreaValue(e.target.value); }}
        style={{ width: '100%' }}
      />

      <Button
        color="primary"
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
