import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  FormControl,
  InputBase,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import ThreadAvatar from './thread-avatar';
import CustomSelect from '../common/react-select';

const BootstrapInput = withStyles(theme => ({
  root: {
    'label + &': {
      marginTop: theme.spacing.unit * 3,
    },
  },
  input: {
    borderRadius: 4,
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #ced4da',
    fontSize: 16,
    padding: '10px 26px 10px 12px',
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
    padding: theme.spacing.unit * 2,
  },
  recipients: {
    paddingLeft: theme.spacing.unit * 2,
    display: 'flex',
    alignItems: 'center',
    width: 300,
  },
  select: {
    paddingLeft: theme.spacing.unit,
  },
  textarea: {
    margin: `${theme.spacing.unit * 2}px 0`,
    padding: theme.spacing.unit * 2,
    fontSize: 16,
    width: '100%',
    height: 100,
    borderColor: theme.palette.grey[300],
    borderStyle: 'solid',
    borderWidth: '1px 0 1px 0',
    resize: 'none',
    '&:active, &:focus': {
      outline: 'none',
    }
  },
  actionWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formControl: {
    marginRight: theme.spacing.unit,
  },
  replyButton: {
    width: 100,
    padding: `${theme.spacing.unit}px 0`,
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
  }
});

class ThreadReply extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedRecipients: [],
      message: '',
      action: 'none',
      selectedConsortium: 'none',
    };
  }

  handleRecipientsChange = selectedRecipients => {
    this.setState({ selectedRecipients });
  }

  handleMessageChange = evt => {
    this.setState({ message: evt.target.value });
  }

  handleActionChange = evt => {
    const { value } = evt.target;
    this.setState(Object.assign(
      { action: value },
      value === 'none' && { selectedConsortium: 'none' },
    ));
  }

  handleConsortiumChange = evt => {
    this.setState({ selectedConsortium: evt.target.value });
  }

  handleSend = () => {
    const error = this.validateForm();

    if (error) {
      return;
    }
  }

  validateForm = () => {
    const { parentError } = this.props;
    const { selectedRecipients, message, action, selectedConsortium } = this.state;

    if (parentError) {
      return parentError;
    }

    if (selectedRecipients.length === 0) {
      return 'Please select at least one recipient'
    }

    if (!message) {
      return 'Please input your message'
    }

    if (action !== 'none' && selectedConsortium === 'none') {
      return 'Please select consortium to join'
    }

    return
  }

  renderReplyButton = () => {
    const { classes } = this.props;
    const error = this.validateForm();

    const button = (
      <button
        className={
          classNames(classes.replyButton, { disabled: !!error })
        }
        onClick={this.handleSend}
      >
        Send
      </button>
    );

    if (error) {
      return (
        <Tooltip
          title={error || ''}
          placement="top"
        >
          {button}    
        </Tooltip>
      )
    };

    return button;
  }

  render() {
    const { classes, users } = this.props;
    const { selectedRecipients, message, action, selectedConsortium } = this.state;

    const sender = 'Xiao';
    const allRecipients = users
      .filter(user => user !== sender)
      .map(user => ({ value: user, label: user }));

    const allActions = [
      { value: 'none', label: 'None' },
      { value: 'join-consortium', label: 'Join Consortium' },
    ]

    let allConsortia = [
      { value: 'none', label: 'None' },
    ];

    for (let i = 0; i < 10; i++) {
      allConsortia.push({ value: `consortia-${i}`, label: `Consortia ${i}`});
    }

    return (
      <div className={classes.wrapper}>
        <div style={{ display: 'flex' }}>
          <ThreadAvatar username={sender} showUsername/>

          <div className={classes.recipients}>
            <span>To:</span>
            <CustomSelect
              value={selectedRecipients}
              placeholder="Select Recipients"
              options={allRecipients}
              isMulti
              className={classes.select}
              onChange={this.handleRecipientsChange}
            />
          </div>
        </div>

        <div>
          <textarea
            className={classes.textarea}
            value={message}
            placeholder='Your message here...'
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
                {allActions.map(action =>
                  <MenuItem
                    key={action.value}
                    value={action.value}
                  >
                    {action.label}
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            {action !== 'none' && (
              <FormControl className={classes.formControl}>
                <InputLabel>Consortium</InputLabel>
                <Select
                  value={selectedConsortium}
                  input={<BootstrapInput />}
                  onChange={this.handleConsortiumChange}
                >
                  {allConsortia.map(consortium =>
                    <MenuItem
                      key={consortium.value}
                      value={consortium.value}
                    >
                      {consortium.label}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}
          </div>

          {this.renderReplyButton()}
        </div>
      </div>
    )
  };
}

ThreadReply.propTypes = {
  classes: PropTypes.object,
  users: PropTypes.array,
  parentError: PropTypes.any,
}

export default withStyles(styles)(ThreadReply);
