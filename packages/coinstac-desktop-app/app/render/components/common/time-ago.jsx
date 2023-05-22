import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const TimeAgo = (props) => {
  const { timestamp } = props;

  const [time, setTime] = useState(moment.unix(timestamp, 'YYYYMMDD').fromNow());

  useInterval(() => {
    setTime(moment.unix(timestamp).fromNow());
  }, 10000);

  return (<span>{time}</span>);
};

TimeAgo.propTypes = {
  timestamp: PropTypes.number.isRequired,
};

export default TimeAgo;
