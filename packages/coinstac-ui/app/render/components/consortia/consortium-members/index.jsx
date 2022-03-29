import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Divider from '@material-ui/core/Divider';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import {
  SAVE_CONSORTIUM_ACTIVE_MEMBERS_MUTATION,
} from '../../../state/graphql/functions';

import useStyles from './consortium-members.styles';

function ConsortiumMembers({ consortium, pipelines }) {
  const classes = useStyles();

  const [saveActiveMembers, { loading }] = useMutation(SAVE_CONSORTIUM_ACTIVE_MEMBERS_MUTATION);

  const [currentActiveMembers, setCurrentActiveMembers] = useState({});
  const [activePipeline, setActivePipeline] = useState(null);

  useEffect(() => {
    setCurrentActiveMembers({ ...consortium.activeMembers });

    if (consortium.activePipelineId) {
      const activePipeline = pipelines.find(p => p.id === consortium.activePipelineId);
      setActivePipeline(activePipeline);
    }
  }, []);

  const toggleActiveMember = (userId, username) => (event) => {
    const active = event.target.checked;

    setCurrentActiveMembers((prev) => {
      const newActiveMembers = { ...prev };

      if (active) {
        newActiveMembers[userId] = username;
      } else {
        delete newActiveMembers[userId];
      }

      return newActiveMembers;
    });
  };

  function submit(e) {
    e.preventDefault();

    console.log('ACTIVE MEMBERS', currentActiveMembers);

    saveActiveMembers({
      variables: {
        consortiumId: consortium.id,
        members: currentActiveMembers,
      },
    });
  }

  return (
    <Box>
      <Paper elevation={1} className={classes.info}>
        <Typography variant="body1">
          Select which users will take part in future runs
        </Typography>
      </Paper>
      <form onSubmit={submit}>
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
          >
            Save
          </Button>
        </Box>
        <Typography variant="h6">
          Users
        </Typography>
        <FormGroup>
          {consortium && Object.keys(consortium.members).map(userId => (
            <FormControlLabel
              key={userId}
              control={(
                <Checkbox
                  checked={Boolean(currentActiveMembers[userId])}
                  onChange={toggleActiveMember(userId, consortium.members[userId])}
                  name={userId}
                  color="primary"
                />
              )}
              label={consortium.members[userId]}
            />
          ))}
        </FormGroup>
        {activePipeline && activePipeline.headlessMembers
          && Object.keys(activePipeline.headlessMembers).length > 0 && (
          <Box mt={2}>
            <Divider />
            <Box mt={2}>
              <Typography variant="h6">
                Vault users
              </Typography>
              <FormGroup>
                {Object.keys(activePipeline.headlessMembers).map(headlessMemberId => (
                  <FormControlLabel
                    key={headlessMemberId}
                    control={(
                      <Checkbox
                        checked={Boolean(currentActiveMembers[headlessMemberId])}
                        onChange={
                          toggleActiveMember(
                            headlessMemberId,
                            activePipeline.headlessMembers[headlessMemberId]
                          )
                        }
                        name={headlessMemberId}
                        color="primary"
                      />
                    )}
                    label={activePipeline.headlessMembers[headlessMemberId]}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        )}
      </form>
    </Box>
  );
}

ConsortiumMembers.propTypes = {
  consortium: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
};

export default ConsortiumMembers;
