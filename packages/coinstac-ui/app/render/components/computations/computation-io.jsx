import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { graphql, useMutation } from '@apollo/react-hoc';
import ReactJson from 'react-json-view';
import { Button, TextareaAutosize } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { useQuery } from '@apollo/client';
import { FETCH_COMPUTATION_QUERY, ADD_COMPUTATION_MUTATION } from '../../state/graphql/functions';
import { compIOProp } from '../../state/graphql/props';

const styles = theme => ({
  wrapper: {
    marginTop: theme.spacing(1),
  },
});

const ComputationIO = ({ computationId, classes }) => {
  const fetchComputationQueryObj = useQuery(FETCH_COMPUTATION_QUERY,
    {
      variables:
      {
        computationIds: computationId,
      },
    });

  if (fetchComputationQueryObj.loading) {
    return <div>loading</div>;
  }
  if (fetchComputationQueryObj.error) {
    return `Error! ${fetchComputationQueryObj.error}`;
  }
  if (fetchComputationQueryObj.data) {
    const compspec = fetchComputationQueryObj.data.fetchComputation[0];
    return (
      <div className={classes.wrapper}>
        <ComputationInner data={compspec} />
      </div>
    );
  }
};

const ComputationInner = ({ data }) => {
  const compSpecDbObject = JSON.parse(JSON.stringify(data));
  delete compSpecDbObject.id;
  const inputSpec = JSON.stringify(compSpecDbObject, null, 4);
  const [textAreaValue, setTextAreaValue] = useState(inputSpec);
  const [isModified, setIsModified] = useState(false);
  const [addComputation, { data: addComputationData, loading, error }] = useMutation(ADD_COMPUTATION_MUTATION);

  const updateComputation = () => {
    addComputation({ variables: { computationSchema: JSON.parse(textAreaValue) } });
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
        disabled={!isModified}
        onClick={updateComputation}
      >
        update
      </Button>
    </div>
  );
};

ComputationIO.defaultProps = {
  computationId: null,
};

ComputationIO.propTypes = {
  computationId: PropTypes.string,
  classes: PropTypes.object.isRequired,
};

// const ComputationIOWithData = graphql(FETCH_COMPUTATION_QUERY, compIOProp)(ComputationIO);

export default withStyles(styles)(ComputationIO);
