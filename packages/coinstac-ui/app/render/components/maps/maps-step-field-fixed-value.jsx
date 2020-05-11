import React from 'react';
import PropTypes from 'prop-types';
import { startCase, toLower } from 'lodash';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
    height: '100%',
    overflow: 'scroll',
  },
  nestedListItem: {
    paddingLeft: theme.spacing.unit * 4,
  },
  mediumWeight: {
    fontWeight: 500,
  },
});

function MapsStepFieldFixedValue(props) {
  const {
    step,
    fieldName,
    classes,
  } = props;

  let value = '';

  switch (step.value) {
    case (typeof step.value === 'boolean' && step.value === true):
      value = 'true';
      break;
    case (typeof step.value === 'boolean' && step.value === false):
      value = 'false';
      break;
    case (typeof step.value === 'object'):
      value = JSON.stringify(step.value);
      break;
    default:
      // eslint-disable-next-line prefer-destructuring
      value = step.value;
      break;
  }

  // eslint-disable-next-line no-useless-escape
  const label = fieldName.replace(/\_/g, ' ');

  return (
    <Paper
      className={classes.rootPaper}
      elevation={1}
    >
      <List>
        <strong className={classes.mediumWeight}>
          { `${startCase(toLower(label))}: ` }
        </strong>
        <span>{ value }</span>
      </List>
    </Paper>
  );
}

MapsStepFieldFixedValue.propTypes = {
  classes: PropTypes.object.isRequired,
  fieldName: PropTypes.string.isRequired,
  step: PropTypes.object.isRequired,
};

export default withStyles(styles)(MapsStepFieldFixedValue);
