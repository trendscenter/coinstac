import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    height: '100%',
    overflow: 'scroll',
  },
  nestedListItem: {
    paddingLeft: theme.spacing(4),
  },
  mediumWeight: {
    fontWeight: 500,
  },
});

function MapsStepFixedValueField(props) {
  const {
    fieldPipeline,
    fieldCompSpec,
    classes,
  } = props;

  let value = '';

  if (typeof fieldPipeline.value === 'boolean') {
    value = fieldPipeline.value.toString();
  } else if (Array.isArray(fieldPipeline.value)) {
    if (fieldCompSpec.type === 'freesurfer') {
      value = fieldPipeline.value.map(v => v.value).join(',');
    } else if (fieldCompSpec.type === 'files') {
      value = fieldPipeline.value.map(v => v.type).join(',');
    } else {
      value = fieldPipeline.value.join(', ');
    }
  } else if (typeof fieldPipeline.value === 'object') {
    value = JSON.stringify(fieldPipeline.value);
  } else {
    value = fieldPipeline.value; // eslint-disable-line prefer-destructuring
  }

  return (
    <Paper
      className={classes.rootPaper}
      elevation={1}
    >
      <List>
        <span>{ value }</span>
      </List>
    </Paper>
  );
}

MapsStepFixedValueField.propTypes = {
  classes: PropTypes.object.isRequired,
  fieldPipeline: PropTypes.object.isRequired,
  fieldCompSpec: PropTypes.object.isRequired,
};

export default withStyles(styles)(MapsStepFixedValueField);
