import React from 'react';
import Typography from '@material-ui/core/Typography';

const TITLE = `Collaborative Informatics and Neuroimaging Suite Toolkit for
  Anonymous Computation`.replace('\n', '');

export default function CoinstacAbbr() {
  return (
    <div className="logo">
      <Typography variant="h3" component="abbr" title={TITLE}>
        COINSTAC
      </Typography>
    </div>
  );
}

CoinstacAbbr.displayName = 'CoinstacAbbr';
