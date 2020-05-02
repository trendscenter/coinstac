import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import ThreadMessage from './thread-message';

const styles = () => ({
  wrapper: {
    overflow: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
});

class ThreadMessages extends Component {
  componentDidMount() {
    this.scrollToBottom('auto');
  }

  componentDidUpdate() {
    this.scrollToBottom('smooth');
  }

  scrollToBottom = (behavior) => {
    this.lastRef.scrollIntoView({ behavior });
  }

  render() {
    const { classes, messages, joinConsortium } = this.props;

    return (
      <div className={classes.wrapper}>
        {messages.map(message => (
          <ThreadMessage
            key={message.id}
            message={message}
            joinConsortium={joinConsortium}
          />
        ))}
        <div ref={(ref) => { this.lastRef = ref; }} />
      </div>
    );
  }
}

ThreadMessages.defaultProps = {
  messages: [],
};

ThreadMessages.propTypes = {
  classes: PropTypes.object.isRequired,
  messages: PropTypes.array,
  joinConsortium: PropTypes.func.isRequired,
};

export default withStyles(styles)(ThreadMessages);
