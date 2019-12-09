import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { find } from 'lodash';
import moment from 'moment';
import { withStyles } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
} from '@material-ui/core';
import ThreadList from './thread-list';
import ThreadContent from './thread-content';
import ThreadNew from './thread-new';

const styles = theme => ({
  wrapper: {
    height: '100vh',
    maxHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    margin: -15,
    padding: 15,
  },
  title: {
    marginBottom: theme.spacing.unit * 2,
  },
  container: {
    flex: 1,
    display: 'flex',
    border: `1px solid ${theme.palette.grey[300]}`,
  },
});

class Threads extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedThread: null,
      creatingNewThread: false,
      openDialog: false,
    };
  }

  handleThreadClick = (threadId) => {
    const { creatingNewThread } = this.state;

    if (creatingNewThread) {
      this.toggleDialog(threadId);
    } else {
      this.setState({ selectedThread: threadId });
    }
  }

  handleThreadNewClick = () => {
    this.setState({ creatingNewThread: true });
  }

  handleConfirm = () => {
    this.setState({
      openDialog: false,
      creatingNewThread: false,
    });
  }

  toggleDialog = threadId => {
    const { openDialog } = this.state;

    this.setState(
      Object.assign(
        { openDialog: !openDialog },
        threadId && { selectedThread: threadId },
      )
    );
  }

  getThreads = () => {
    let threads = [];

    const thread = {
      owner: 'Ross',
      title: 'Join consortia',
      messages: [
        {
          id: '1',
          sender: 'Ross',
          receivers: ['Xiao', 'Eduardo'],
          action: {
            type: 'join-consortia',
            id: '1234',
          },
          content: 'hi, please accept my invitation',
          date: '2019-12-05',
        },
        {
          id: '2',
          sender: 'Xiao',
          receivers: ['Ross'],
          content: 'Ok, thank you',
          date: '2019-12-06',
        },
      ],
      users: ['Ross', 'Xiao', 'Eduardo'],
    };

    for (let id = 0; id < 20; id++) {
      threads.push({
        ...thread, id,
        isRead: !(id === 19),
        createdAt: moment.now() + id,
        updatedAt: moment.now() + id,
      });
    }

    return threads;
  }

  getSelectedThread = () => {
    const { selectedThread } = this.state;
    const threads = this.getThreads();

    return find(threads, { id: selectedThread });
  }

  render() {
    const { classes } = this.props;
    const { selectedThread, creatingNewThread, openDialog } = this.state;

    const threads = this.getThreads();

    return (
      <div className={classes.wrapper}>
        <Typography variant="h4" className={classes.title}>
          Messages
        </Typography>
        <div className={classes.container}>
          <ThreadList
            threads={threads}
            selectedThread={selectedThread}
            onThreadClick={this.handleThreadClick}
            onThreadNewClick={this.handleThreadNewClick}
          />
          {creatingNewThread ? (
            <ThreadNew />
          ) : (
            <ThreadContent thread={this.getSelectedThread()} />
          )}

          <Dialog
            open={openDialog}
            onClose={this.toggleDialog}
          >
            <DialogContent>
              <DialogContentText>
                Are you sure to discard new message?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button autoFocus onClick={this.toggleDialog} color="primary">
                No
              </Button>
              <Button onClick={this.handleConfirm} color="primary" autoFocus>
                Yes
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    );
  }
}

Threads.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(Threads);
