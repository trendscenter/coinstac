import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { omit } from 'lodash';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import InputBase from '@material-ui/core/InputBase';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';
import ThreadAvatar from './thread-avatar';
import { ThreadContext } from './context';
import CustomSelect from '../common/react-select';

const BootstrapInput = withStyles(theme => ({
  root: {
    'label + &': {
      marginTop: theme.spacing(3),
    },
  },
  input: {
    borderRadius: 4,
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #ced4da',
    fontSize: 12,
    padding: '5px 8px 10px 12px',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    '&:focus': {
      borderRadius: 4,
      borderColor: '#80bdff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
    },
  },
}))(InputBase);

const styles = theme => ({
  wrapper: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    padding: theme.spacing(2),
  },
  recipientsWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  recipients: {
    padding: theme.spacing(2),
    paddingLeft: 0,
    display: 'flex',
    alignItems: 'center',
    width: 300,
  },
  select: {
    paddingLeft: theme.spacing(1),
  },
  textarea: {
    margin: `0 0 ${theme.spacing(2)}px`,
    padding: theme.spacing(2),
    fontSize: 16,
    width: '100%',
    height: 100,
    borderColor: theme.palette.grey[300],
    borderStyle: 'solid',
    borderWidth: '1px 0 1px 0',
    resize: 'none',
    '&:active, &:focus': {
      outline: 'none',
    },
  },
  actionWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  formControl: {
    marginRight: theme.spacing(1),
  },
  replyButton: {
    width: 100,
    padding: `${theme.spacing(1)}px 0`,
    margin: `${theme.spacing(1)}px 0`,
    backgroundColor: '#0078d4',
    fontSize: 14,
    color: 'white',
    cursor: 'pointer',
    border: 0,
    outline: 'none',
    '&:hover': {
      backgroundColor: '#005a9e',
    },
    '&.disabled': {
      backgroundColor: `${theme.palette.grey[300]} !important`,
      cursor: 'not-allowed',
    },
  },
  loader: {
    width: '20px !important',
    height: '20px !important',
    marginRight: theme.spacing(1),
  },
  note: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    color: 'red',
  },
  menuItem: {
    fontSize: 12,
  },
});

const INITIAL_STATE = {
  threadId: '',
  title: '',
  selectedRecipients: [],
  message: '',
  action: 'none',
  selectedConsortium: 'none',
  selectedResult: 'none',
};

class ThreadReply extends Component {
  state = INITIAL_STATE

  UNSAFE_componentWillMount() { // eslint-disable-line
    this.initializeState(this.props);
    this.initializeDefaultRecipients(this.props, this.context);
  }

  UNSAFE_componentWillReceiveProps(nextProps) { // eslint-disable-line
    const { savingStatus, title, threadUsers } = this.props;

    if (savingStatus !== nextProps.savingStatus && nextProps.savingStatus === 'success') {
      this.setState(omit(INITIAL_STATE, ['threadId', 'title', 'selectedRecipients']));
    } else if (title !== nextProps.title) {
      this.initializeState(nextProps);
    }

    if (Object.keys(threadUsers).length !== Object.keys(nextProps.threadUsers).length) {
      this.initializeDefaultRecipients(nextProps, this.context);
    }
  }

  initializeState = (props) => {
    const { threadId, title } = props;

    this.setState({
      threadId,
      title,
    });
  }

  initializeDefaultRecipients = (props, context) => {
    const { threadUsers } = props;
    const { auth } = context;

    const defaultSelectedRecipients = Object.keys(threadUsers || {})
      .filter(id => id !== auth.user.id)
      .map(id => ({ value: id, label: threadUsers[id].username, isFixed: true }));

    this.setState({
      selectedRecipients: defaultSelectedRecipients,
    });
  }

  handleRecipientsChange = (recipients, { action, removedValue }) => {
    const { selectedRecipients } = this.state;

    switch (action) {
      case 'remove-value':
      case 'pop-value':
        if (removedValue.isFixed) {
          return;
        }
      // eslint-disable-next-line no-fallthrough
      case 'clear':
        this.setState({ selectedRecipients: selectedRecipients.filter(user => user.isFixed) });
        return;
      default:
        this.setState({ selectedRecipients: recipients });
    }
  }

  handleMessageChange = (evt) => {
    this.setState({ message: evt.target.value });
  }

  handleActionChange = (evt) => {
    const { value } = evt.target;
    this.setState(Object.assign(
      { action: value },
      value === 'none' && { selectedConsortium: 'none' }
    ));
  }

  handleConsortiumChange = (evt) => {
    this.setState({ selectedConsortium: evt.target.value });
  }

  handleResultChange = (evt) => {
    this.setState({ selectedResult: evt.target.value });
  }

  handleSend = () => {
    const { savingStatus, onSend } = this.props;
    const { consortia } = this.context;

    const error = this.validateForm();

    if (savingStatus === 'pending' || error) {
      return;
    }

    const {
      threadId,
      title,
      action,
      message,
      selectedRecipients,
      selectedConsortium,
      selectedResult,
    } = this.state;

    const data = Object.assign(
      {
        threadId,
        title,
        recipients: selectedRecipients.reduce((acc, recipient) => {
          acc[recipient.value] = recipient.label;
          return acc;
        }, {}),
        content: message,
      },
      (action === 'join-consortium' && selectedConsortium !== 'none') && ({
        action: {
          type: action,
          detail: {
            id: selectedConsortium,
            name: consortia.find(({ id }) => id === selectedConsortium).name,
          },
        },
      }),
      (action === 'share-result' && selectedResult !== 'none') && ({
        action: {
          type: action,
          detail: {
            id: selectedResult,
          },
        },
      })
    );

    onSend(data);
  }

  validateForm = () => {
    const {
      action,
      title,
      message,
      selectedRecipients,
      selectedConsortium,
      selectedResult,
    } = this.state;

    if (!title) {
      return 'Please input title';
    }

    if (selectedRecipients.length === 0) {
      return 'Please select at least one recipient';
    }

    if (!message) {
      return 'Please input your message';
    }

    if (action === 'join-consortium' && selectedConsortium === 'none') {
      return 'Please select consortium to join';
    }

    if (action === 'share-result' && selectedResult === 'none') {
      return 'Please select result to share';
    }
  }

  renderReplyButton = () => {
    const { classes, savingStatus } = this.props;
    const error = this.validateForm();

    const button = (
      <div className={classes.actionWrapper}>
        {savingStatus === 'pending'
          && <CircularProgress color="secondary" className={classes.loader} />}
        <button
          type="button"
          className={
            classNames(
              classes.replyButton,
              { disabled: !!error || savingStatus === 'pending' }
            )
          }
          onClick={this.handleSend}
        >
          Send
        </button>
      </div>
    );

    if (error) {
      return (
        <Tooltip title={error} placement="top">
          {button}
        </Tooltip>
      );
    }

    return button;
  }

  getAllRecipients = () => {
    const { users, auth } = this.context;

    const allRecipients = (users || [])
      .filter(user => user.id !== auth.user.id)
      .map(user => ({ value: user.id, label: user.username }));

    return allRecipients;
  }

  getAllConsortia = () => {
    const { auth, consortia } = this.context;

    const allConsortia = [
      { value: 'none', label: 'None' },
    ];

    consortia.forEach((consortium) => {
      if (auth.user.id in consortium.owners) {
        allConsortia.push({ value: consortium.id, label: consortium.name });
      }
    });

    return allConsortia;
  }

  getAllActions = () => {
    const allActions = [
      { value: 'none', label: 'None' },
      { value: 'join-consortium', label: 'Join Consortium' },
      { value: 'share-result', label: 'Share Result' },
    ];

    return allActions;
  }

  getAllResults = () => {
    const { runs } = this.context;

    const allRuns = [
      { value: 'none', label: 'None' },
    ];

    runs.forEach((run) => {
      allRuns.push({ value: run.id, label: run.id });
    });

    return allRuns;
  }

  render() {
    const { classes } = this.props;
    const {
      action,
      message,
      selectedRecipients,
      selectedConsortium,
      selectedResult,
    } = this.state;
    const { auth } = this.context;

    return (
      <div className={classes.wrapper}>
        <div className={classes.recipientsWrapper}>
          <ThreadAvatar username={auth.user.id} showUsername />

          <div className={classes.recipients}>
            <span>To:</span>
            <CustomSelect
              value={selectedRecipients}
              placeholder="Select Recipients"
              options={this.getAllRecipients()}
              isMulti
              className={classes.select}
              style={{ height: 50 }}
              isClearable={selectedRecipients.some(user => !user.isFixed)}
              onChange={this.handleRecipientsChange}
            />
          </div>

          <div className={classes.note}>
            Adding users to threads shares the thread history
          </div>
        </div>

        <div>
          <textarea
            className={classes.textarea}
            value={message}
            placeholder="Your message here..."
            onChange={this.handleMessageChange}
          />
        </div>

        <div className={classes.actionWrapper}>
          <div>
            <FormControl className={classes.formControl}>
              <InputLabel>Action</InputLabel>
              <Select
                value={action}
                input={<BootstrapInput />}
                onChange={this.handleActionChange}
              >
                {this.getAllActions().map(action => (
                  <MenuItem
                    key={action.value}
                    value={action.value}
                    className={classes.menuItem}
                  >
                    {action.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {action === 'join-consortium' && (
              <FormControl className={classes.formControl}>
                <InputLabel>Consortium</InputLabel>
                <Select
                  value={selectedConsortium}
                  input={<BootstrapInput />}
                  onChange={this.handleConsortiumChange}
                >
                  {this.getAllConsortia().map(consortium => (
                    <MenuItem
                      key={consortium.value}
                      value={consortium.value}
                      className={classes.menuItem}
                    >
                      {consortium.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {action === 'share-result' && (
              <FormControl className={classes.formControl}>
                <InputLabel>Result</InputLabel>
                <Select
                  value={selectedResult}
                  input={<BootstrapInput />}
                  onChange={this.handleResultChange}
                >
                  {this.getAllResults().map(result => (
                    <MenuItem
                      key={result.value}
                      value={result.value}
                      className={classes.menuItem}
                    >
                      {result.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </div>

          {this.renderReplyButton()}
        </div>
      </div>
    );
  }
}

ThreadReply.defaultProps = {
  threadId: '',
  threadUsers: {},
  title: '',
};

ThreadReply.propTypes = {
  classes: PropTypes.object.isRequired,
  savingStatus: PropTypes.string.isRequired,
  threadId: PropTypes.any, // eslint-disable-line react/no-unused-prop-types
  threadUsers: PropTypes.object,
  title: PropTypes.any,
  onSend: PropTypes.func.isRequired,
};

ThreadReply.contextType = ThreadContext;

export default withStyles(styles)(ThreadReply);
