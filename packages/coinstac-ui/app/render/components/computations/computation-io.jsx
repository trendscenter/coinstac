import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import ReactJson from 'react-json-view';
import { withStyles } from '@material-ui/core/styles';
import { FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';
import { compIOProp } from '../../state/graphql/props';
import { Button, TextareaAutosize } from '@material-ui/core';
import { useState } from 'react';
import { useEffect } from 'react';

const styles = theme => ({
  wrapper: {
    marginTop: theme.spacing(1),
  },
});

const ComputationIO = ({ compIO, classes }) => {
  if (!compIO) {
    return null;
  }
  const inputSpec = JSON.stringify(compIO.computation.input, null, 4)
  const [textAreaValue, setTextAreaValue] = useState(inputSpec);
  const [isModified, setIsModified] = useState(false);
  
  useEffect(()=>{
    if(!inputSpec.includes(textAreaValue)){
      setIsModified(true)
    }
  }, [textAreaValue])


  return (
    <div className={classes.wrapper}>
      <TextareaAutosize value={textAreaValue} onChange={e=>{setTextAreaValue(e.target.value)}} style={{width: '100%'}}></TextareaAutosize>
    <Button disabled={!isModified}>update</Button>
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
