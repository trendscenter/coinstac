import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
    height: '100%',
  },
  title: {
    marginBottom: theme.spacing.unit,
  },
  nestedListItem: {
    paddingLeft: theme.spacing.unit * 4,
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

class MapsStepData extends Component {
  componentDidUpdate() {
    if (this.refs.Container) {
      let Container = ReactDOM.findDOMNode(this.refs.Container);
      this.props.getContainers(Container);
    }
  }

  render() {
    const { step, isMapped, type, classes } = this.props;

    const name = step.type;

    return (
      <Paper
        className={classNames('drop-panel', classes.rootPaper)}
        elevation={1}
      >
        <Typography variant="headline" className={classes.title}>
          {step.type}
        </Typography>
        <div className={classes.listDropzoneContainer}>
          <List className={classes.interestList}>
            <ListItem><ListItemText primary="Interest(s):" /></ListItem>
            {
              step.value.map((key, i) => (
                <ListItem key={key} className={classes.nestedListItem}><ListItemText secondary={step.value[i]} /></ListItem>
              ))
            }
          </List>
          <div className={classNames('drop-zone', classes.dropZone)}>
            {
              isMapped === -1
                ? <div ref="Container" className={`acceptor acceptor-${name}`} data-type={type} data-name={name} />
                : <div className="card-draggable"><span className="glyphicon glyphicon-file" /> {name}</div>
            }
          </div>
        </div>
      </Paper>
    );
  }
}

MapsStepData.propTypes = {
  step: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MapsStepData);
