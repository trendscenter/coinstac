import { graphql, withApollo } from '@apollo/react-hoc';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { find, flowRight as compose } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { pullComputations } from '../../state/ducks/docker';
import { notifyInfo } from '../../state/ducks/notifyAndLog';
import {
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_USERS_QUERY,
  JOIN_CONSORTIUM_MUTATION,
  SAVE_MESSAGE_MUTATION,
  SET_READ_MESSAGE_MUTATION,
  USER_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import {
  consortiaMembershipProp,
  getAllAndSubProp,
  saveMessageProp,
  setReadMessageProp,
} from '../../state/graphql/props';
import { ThreadContext } from './context';
import ThreadContent from './thread-content';
import ThreadList from './thread-list';
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
    marginBottom: theme.spacing(2),
  },
  container: {
    flex: 1,
    display: 'flex',
    border: `1px solid ${theme.palette.grey[300]}`,
  },
});

class Threads extends Component {
  state = {
    creatingNewThread: false,
    openDialog: false,
    savingStatus: 'init',
    selectedThread: null,
    startingTitle: null,
    startingRecipients: {},
  }

  componentDidMount() {
    const { location } = this.props;

    const stateChanges = {};

    if (location.query.new) {
      stateChanges.creatingNewThread = true;
    }

    if (location.query.title) {
      stateChanges.startingTitle = location.query.title;
    }

    if (location.query.recipientId && location.query.recipientUsername) {
      stateChanges.startingRecipients = {
        [location.query.recipientId]: {
          username: location.query.recipientUsername,
        },
      };
    }

    this.setState(stateChanges);
  }

  handleThreadClick = (threadId) => {
    const { auth, setReadMessage } = this.props;
    const { creatingNewThread } = this.state;

    if (creatingNewThread) {
      this.toggleDialog(threadId);
    } else {
      this.setState({ selectedThread: threadId });
      setReadMessage({ threadId, userId: auth.user.id });
    }
  }

  handleThreadNewClick = () => {
    this.setState({ creatingNewThread: true });
  }

  handleConfirm = () => {
    this.setState({
      creatingNewThread: false,
      openDialog: false,
    });
  }

  toggleDialog = (threadId) => {
    const { openDialog } = this.state;

    this.setState(
      Object.assign(
        { openDialog: !openDialog },
        threadId && { selectedThread: threadId },
      ),
    );
  }

  handleSend = (data) => {
    const { saveMessage } = this.props;
    const { creatingNewThread } = this.state;

    this.setState({ savingStatus: 'pending' });

    saveMessage(data).then((res) => {
      const { id } = res.data.saveMessage;

      this.setState(Object.assign(
        { savingStatus: 'success' },
        creatingNewThread && {
          creatingNewThread: false,
          selectedThread: id,
        },
      ));
    }).catch(() => {
      this.setState({
        savingStatus: 'fail',
      });
    });
  }

  handleJoinConsortium = (consortiumId) => {
    const {
      auth, consortia, client, pipelines, router,
      pullComputations, notifyInfo, joinConsortium,
    } = this.props;

    const consortium = find(consortia, { id: consortiumId });

    if (!consortium) {
      return;
    }

    const { members, activeMembers, activePipelineId } = consortium;

    if (auth.user.id in members || auth.user.id in activeMembers || !activePipelineId) {
      router.push('/dashboard/consortia');
      return;
    }

    const computationData = client.readQuery({ query: FETCH_ALL_COMPUTATIONS_QUERY });
    const pipeline = pipelines.find(cons => cons.id === activePipelineId);

    const computations = [];
    pipeline.steps.forEach((step) => {
      const compObject = computationData.fetchAllComputations
        .find(comp => comp.id === step.computations[0].id);
      computations.push({
        img: compObject.computation.dockerImage,
        compId: compObject.id,
        compName: compObject.meta.name,
      });
    });

    pullComputations({ consortiumId, computations });
    notifyInfo('Pipeline computations downloading via Docker.');

    joinConsortium(consortiumId).then(() => {
      localStorage.setItem('CONSORTIUM_JOINED_BY_THREAD', consortiumId);
      router.push('/dashboard/consortia');
    });
  }

  getSelectedThread = () => {
    const { threads } = this.props;
    const { selectedThread } = this.state;

    return find(threads, { id: selectedThread });
  }

  render() {
    const {
      auth, consortia, runs, threads, users, classes,
    } = this.props;
    const {
      selectedThread, creatingNewThread, openDialog, savingStatus,
      startingTitle, startingRecipients,
    } = this.state;

    const thread = this.getSelectedThread();

    return (
      <ThreadContext.Provider
        value={{
          auth, consortia, runs, threads, users,
        }}
      >
        <div className={classes.wrapper}>
          <Typography variant="h4" className={classes.title}>
            Messages
          </Typography>
          <div className={classes.container}>
            <ThreadList
              selectedThread={selectedThread}
              onThreadClick={this.handleThreadClick}
              onThreadNewClick={this.handleThreadNewClick}
            />
            {creatingNewThread ? (
              <ThreadNew
                savingStatus={savingStatus}
                onSend={this.handleSend}
                startingTitle={startingTitle}
                startingRecipients={startingRecipients}
              />
            ) : (
              <ThreadContent
                thread={thread}
                savingStatus={savingStatus}
                onSend={this.handleSend}
                onJoinConsortium={this.handleJoinConsortium}
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
      </ThreadContext.Provider>
    );
  }
}

Threads.defaultProps = {
  consortia: [],
  pipelines: [],
  runs: [],
  threads: [],
  users: [],
};

Threads.propTypes = {
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  pipelines: PropTypes.array,
  router: PropTypes.object.isRequired,
  runs: PropTypes.array,
  threads: PropTypes.array,
  users: PropTypes.array,
  joinConsortium: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  pullComputations: PropTypes.func.isRequired,
  saveMessage: PropTypes.func.isRequired,
  setReadMessage: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
};

const ThreadsWithData = compose(
  graphql(
    SAVE_MESSAGE_MUTATION,
    saveMessageProp('saveMessage'),
  ),
  graphql(
    SET_READ_MESSAGE_MUTATION,
    setReadMessageProp('setReadMessage'),
  ),
  graphql(FETCH_ALL_USERS_QUERY, getAllAndSubProp(
    USER_CHANGED_SUBSCRIPTION,
    'users',
    'fetchAllUsers',
    'subscribeToUsers',
    'userChanged',
  )),
  graphql(FETCH_ALL_CONSORTIA_QUERY, getAllAndSubProp(
    CONSORTIUM_CHANGED_SUBSCRIPTION,
    'consortia',
    'fetchAllConsortia',
    'subscribeToConsortia',
    'consortiumChanged',
  )),
  graphql(JOIN_CONSORTIUM_MUTATION, consortiaMembershipProp('joinConsortium')),
  withApollo,
)(Threads);

const mapStateToProps = ({ auth }) => ({
  auth,
});

const connectedComponent = connect(mapStateToProps, {
  pullComputations,
  notifyInfo,
})(ThreadsWithData);

export default withStyles(styles, { withTheme: true })(connectedComponent);
