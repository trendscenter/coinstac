import { useMutation } from '@apollo/client';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { applyAsyncLoading } from '../../../state/ducks/loading';
import { notifyError, notifySuccess } from '../../../state/ducks/notifyAndLog';
import {
  SAVE_CONSORTIUM_ACTIVE_MEMBERS_MUTATION,
} from '../../../state/graphql/functions';
import useStyles from './consortium-members.styles';

function ConsortiumMembers({
  consortium, pipelines, currentActiveMembers, toggleCurrentActiveMember,
}) {
  const classes = useStyles();

  const [saveActiveMembers, { loading }] = useMutation(SAVE_CONSORTIUM_ACTIVE_MEMBERS_MUTATION);

  const [activePipeline, setActivePipeline] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!consortium.activePipelineId) return;

    const activePipeline = pipelines.find(p => p.id === consortium.activePipelineId);
    setActivePipeline(activePipeline);
  }, [consortium]);

  const toggleActiveMember = (userId, username) => (event) => {
    const active = event.target.checked;

    toggleCurrentActiveMember(userId, username, active);
  };

  function submit(e) {
    e.preventDefault();

    const commit = () => async () => {
      const { errors } = await saveActiveMembers({
        variables: {
          consortiumId: consortium.id,
          members: currentActiveMembers,
        },
      });

      if (errors) {
        dispatch(notifyError(errors[0].message));
        return;
      }

      dispatch(notifySuccess('The active members were updated successfully'));
    };

    dispatch(applyAsyncLoading(commit)());
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
                            activePipeline.headlessMembers[headlessMemberId],
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
  currentActiveMembers: PropTypes.object.isRequired,
  toggleCurrentActiveMember: PropTypes.func.isRequired,
};

export default ConsortiumMembers;
