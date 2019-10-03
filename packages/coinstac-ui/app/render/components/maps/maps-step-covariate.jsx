import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core/styles';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import classNames from 'classnames';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 1.5,
    paddingBottom: theme.spacing.unit * 1.5,
    marginTop: theme.spacing.unit * 1.5,
    height: '100%',
    overflow: 'scroll',
  },
  title: {
    marginBottom: theme.spacing.unit * 1.5,
  },
  nestedListItem: {
    paddingLeft: theme.spacing.unit * 3,
  },
  listDropzoneContainer: {
    display: 'flex',
  },
  interestList: {
    width: '50%',
    flex: '0 0 auto',
    marginRight: theme.spacing.unit,
  },
  dropZone: {
    flex: '1 0 auto',
  },
});

class MapsStepCovariate extends Component {
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
      isMapped,
      classes,
    } = this.props;

    let name = step.name;

    return (
      <Paper
        className={classNames('drop-panel', classes.rootPaper)}
        elevation={1}
      >
        <Typography variant="headline" className={classes.title}>
          {name}
        </Typography>
        <div className={classes.listDropzoneContainer}>
          <List className={classes.interestList}>
            <ListItem><ListItemText primary="Source:" /></ListItem>
            <ListItem className={classes.nestedListItem}><ListItemText secondary={step.source} /></ListItem>
            <ListItem><ListItemText primary="Type:" /></ListItem>
            <ListItem className={classes.nestedListItem}><ListItemText secondary={step.type} /></ListItem>
          </List>
          <div className={classNames('drop-zone', classes.dropZone)}>
            {
              isMapped === -1
                ? <div ref="Container" className={`acceptor acceptor-${name}`} data-type={type} data-name={name} />
                : <div className="card-draggable"><FileCopyIcon /> {name}</div>}
          </div>
        </div>
      </Paper>
    );
  }
}

MapsStepCovariate.propTypes = {
  step: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MapsStepCovariate);
