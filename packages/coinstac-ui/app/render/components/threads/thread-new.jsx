import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import ThreadReply from './thread-reply';

const styles = theme => ({
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    textAlign: 'center',
    padding: theme.spacing.unit * 2,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  input: {
    width: '100%',
  },
});

class ThreadNew extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: '',
    };
  }

  handleTitleChange = evt => {
    this.setState({ title: evt.target.value });
  }

  validateTitle = () => {
    const { title } = this.state;

    if (!title) {
      return 'Please input title';
    }

    return null;
  }

  render() {
    const { classes } = this.props;
    const { title } = this.state;

    const allUsers = ['Ross', 'Eduardo', 'Eric', 'Javier'];

    const error = this.validateTitle();

    return (
      <div className={classes.wrapper}>
        <div className={classes.title}>
          <TextField
            className={classes.input}
            value={title}
            label='Title'
            variant='outlined'
            onChange={this.handleTitleChange}
          />
        </div>
        <div style={{ flex: 1 }}></div>
        <ThreadReply users={allUsers} parentError={error} />
      </div>
    );
  }
}

ThreadNew.propTypes = {
  classes: PropTypes.object,
}

export default withStyles(styles)(ThreadNew);
