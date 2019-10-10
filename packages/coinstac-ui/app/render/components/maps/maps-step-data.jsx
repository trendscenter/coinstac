import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Icon from '@material-ui/core/Icon';
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
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
    height: '100%',
  },
  title: {
    marginBottom: theme.spacing.unit,
  },
  nestedListItem: {
    paddingLeft: theme.spacing.unit * 2,
    paddingTop: 0,
    paddingBottom: 0,
  },
  listDropzoneContainer: {
    display: 'flex',
  },
  interestList: {
    width: '50%',
    flex: '0 0 auto',
    marginRight: theme.spacing.unit,
    paddingLeft: 0,
  },
  dropZone: {
    flex: '1 0 auto',
  },
  timesIcon: {
    color: '#f05a29 !important',
    fontSize: '1.25rem',
    position: 'absolute',
    top: '-0.75rem',
    right: '-0.75rem',
    background: 'white',
    borderRadius: '50%',
    border: '2px solid white',
    width: '1.5rem',
    height: '1.5rem',
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
    const { step, type, classes, column, index } = this.props;

    const name = step.type;

    return (
      <Paper
        className={classNames('drop-panel', classes.rootPaper)}
        elevation={1}
      >
        <Typography style={{fontWeight: '500', fontSize: '1rem'}} className={classes.title}>
          {step.type}
        </Typography>
        <div className={classes.listDropzoneContainer}>
          <div className={classNames('drop-zone', classes.dropZone)}>
            {
              !column
                ? <div ref="Container" className={`acceptor acceptor-${name}`} data-type={type} data-name={name} />
              : <div className="card-draggable">
                <FileCopyIcon /> {column}
                <span onClick={()=>{this.props.removeMapStep(type, index, column)}}>
                  <Icon
                    className={classNames('fa fa-times-circle', classes.timesIcon)} />
                </span>
                </div>}
          </div>
        </div>
        {step.value && <div className={classes.listDropzoneContainer}>
            <List className={classes.interestList}>
              <ListItem style={{paddingLeft: 0}}><ListItemText primary="Interest(s):" /></ListItem>
              {step.value &&
                step.value.map((key, i) => (
                  <ListItem key={key} className={classes.nestedListItem}>
                    <ListItemText
                      style={{whiteSpace: 'nowrap'}}
                      secondary={step.value[i]} />
                  </ListItem>
                ))
              }
            </List>
        </div>}
      </Paper>
    );
  }
}

MapsStepData.propTypes = {
  step: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MapsStepData);
