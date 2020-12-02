import React from 'react';
import PropTypes from 'prop-types';
import { startCase, toLower } from 'lodash';
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

function MapsStepFieldFixedValue(props) {
  const {
    step,
    fieldName,
    classes,
  } = props;

  // eslint-disable-next-line no-useless-escape
  const label = fieldName.replace(/\_/g, ' ');

  return (
    <Paper
      className={classes.rootPaper}
      elevation={1}
    >
      <List>
        <div>
          <strong className={classes.mediumWeight}>
            { `${startCase(toLower(label))}: ` }
          </strong>
        </div>
        <div>
          <span>{ JSON.stringify(step.value) }</span>
        </div>
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
