import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { graphql, compose, withApollo } from 'react-apollo'
import { find } from 'lodash'
import { withStyles } from '@material-ui/core/styles'
import {
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
} from '@material-ui/core'
import ThreadList from './thread-list'
import ThreadContent from './thread-content'
import ThreadNew from './thread-new'
import {
  saveMessageProp,
  setReadMessageProp,
} from '../../state/graphql/props'
import {
  SAVE_MESSAGE_MUTATION,
  SET_READ_MESSAGE_MUTATION,
} from '../../state/graphql/functions'

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
})

class Threads extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedThread: null,
      creatingNewThread: false,
      openDialog: false,
      savingStatus: 'init',
    }
  }

  handleThreadClick = (threadId) => {
    const { user } = this.props
    const { creatingNewThread } = this.state

    if (creatingNewThread) {
      this.toggleDialog(threadId)
    } else {
      this.setState({ selectedThread: threadId })
      this.props.setReadMessage({ threadId, userId: user.id })
    }
  }

  handleThreadNewClick = () => {
    this.setState({ creatingNewThread: true })
  }

  handleConfirm = () => {
    this.setState({
      openDialog: false,
      creatingNewThread: false,
    })
  }

  toggleDialog = threadId => {
    const { openDialog } = this.state

    this.setState(
      Object.assign(
        { openDialog: !openDialog },
        threadId && { selectedThread: threadId },
      )
    )
  }

  handleSend = data => {
    const { creatingNewThread } = this.state

    this.setState({ savingStatus: 'pending' })

    this.props.saveMessage(data).then(res => {
      const { id } = res.data.saveMessage

      this.setState(Object.assign(
        { savingStatus: 'success' },
        creatingNewThread && {
          creatingNewThread: false,
          selectedThread: id,
        },
      ))
    }).catch(() => {
      this.setState({
        savingStatus: 'fail',
      })
    })
  }

  getSelectedThread = () => {
    const { threads } = this.props
    const { selectedThread } = this.state

    return find(threads, { id: selectedThread })
  }

  render() {
    const { user, threads, runs, classes } = this.props
    const { selectedThread, creatingNewThread, openDialog, savingStatus } = this.state

    const thread = this.getSelectedThread()

    return (
      <div className={classes.wrapper}>
        <Typography variant="h4" className={classes.title}>
          Messages
        </Typography>
        <div className={classes.container}>
          <ThreadList
            userId={user.id}
            threads={threads}
            selectedThread={selectedThread}
            onThreadClick={this.handleThreadClick}
            onThreadNewClick={this.handleThreadNewClick}
          />
          {creatingNewThread ? (
            <ThreadNew
              runs={runs}
              savingStatus={savingStatus}
              onSend={this.handleSend}
            />
          ) : (
            <ThreadContent
              thread={thread}
              runs={runs}
              savingStatus={savingStatus}
              onSend={this.handleSend}
            />
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
    )
  }
}

Threads.propTypes = {
  classes: PropTypes.object.isRequired,
  threads: PropTypes.array,
  runs: PropTypes.array,
  saveMessage: PropTypes.func.isRequired,
}

const ThreadsWithData = compose(
  graphql(
    SAVE_MESSAGE_MUTATION,
    saveMessageProp('saveMessage'),
  ),
  graphql(
    SET_READ_MESSAGE_MUTATION,
    setReadMessageProp('setReadMessage'),
  ),
  withApollo,
)(Threads)

const mapStateToProps = ({ auth: { user } }) => {
  return { user };
};

const connectedComponent = connect(mapStateToProps)(ThreadsWithData);

export default withStyles(styles, { withTheme: true })(connectedComponent)
