import { useMutation } from '@apollo/client';
import { useEffect, useRef } from 'react';

import { UPDATE_CONSORTIA_MAPPED_USERS_MUTATION } from '../../../state/graphql/functions';

/**
 * Updates the data map status for the current logged in user in all the consortia.
 *
 * This runs only once on startup, to sync local with remote. After that, the updates are done once
 * the map/unmap happens.
 */
function UpdateDataMapStatusStartupListener({ maps, consortia, userId }) {
  const [updateConsortiaMappedUsers] = useMutation(UPDATE_CONSORTIA_MAPPED_USERS_MUTATION);
  const ranFirstTime = useRef(false);

  useEffect(() => {
    if (!maps || !consortia) return;
    if (ranFirstTime.current) return;

    ranFirstTime.current = true;

    const consortiaUserIsMappedFor = [];
    const consortiaUserIsNotMappedFor = [];

    consortia.forEach((consortium) => {
      if (!(userId in consortium.members)) {
        return;
      }

      const consortiumDataMapping = maps.find(m => m.consortiumId === consortium.id
        && m.pipelineId === consortium.activePipelineId);

      if (consortium.mappedForRun && consortium.mappedForRun.indexOf(userId) > -1) {
        if (!consortiumDataMapping) {
          consortiaUserIsNotMappedFor.push(consortium.id);
        }
      } else if (consortiumDataMapping) {
        consortiaUserIsMappedFor.push(consortium.id);
      }
    });

    if (consortiaUserIsMappedFor.length > 0) {
      updateConsortiaMappedUsers(consortiaUserIsMappedFor, true);
    }

    if (consortiaUserIsNotMappedFor.length > 0) {
      updateConsortiaMappedUsers(consortiaUserIsNotMappedFor, false);
    }
  }, [maps, consortia]);

  return null;
}

export default UpdateDataMapStatusStartupListener;
