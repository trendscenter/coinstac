import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Panel } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { startCase, toLower } from 'lodash';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
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
  }
});

class MapsStepValue extends Component {
  componentDidUpdate() {
    if (this.refs.Container) {
      let Container = ReactDOM.findDOMNode(this.refs.Container);
      this.props.getContainers(Container);
    }
  }

  render() {
    const {
      step,
      type,
      classes,
    } = this.props;

    let value = '';

    switch(step.value) {
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
        value = step.value;
    }

    let label = type.replace(/\_/g, ' ');

    return (
      <Paper
        className={classes.rootPaper}
        elevation={1}
      >
        <List>
          <strong className={classes.mediumWeight}>
            {`${startCase(toLower(label))}: `}
          </strong>
          <span>{value}</span>
        </List>
      </Paper>
    );
  }
}

MapsStepValue.propTypes = {
  step: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MapsStepValue);
