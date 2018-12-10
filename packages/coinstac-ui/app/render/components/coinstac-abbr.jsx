import React from 'react';
import Typography from '@material-ui/core/Typography';

const TITLE = `Collaborative Informatics and Neuroimaging Suite Toolkit for
  Anonymous Computation`.replace('\n', '');

export default function CoinstacAbbr() {
  return (
    <div className="logo">
      <div className="logo__image" />
      <Typography variant="h3">
        <abbr title={TITLE}>COINSTAC</abbr>
      </Typography>
    </div>
  );
}

CoinstacAbbr.displayName = 'CoinstacAbbr';
