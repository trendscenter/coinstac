import React from 'react';

const TITLE = `Collaborative Informatics and Neuroimaging Suite Toolkit for
  Anonymous Computation`.replace('\n', '');

export default function CoinstacAbbr() {
  return <abbr title={TITLE}>COINSTAC</abbr>;
}

CoinstacAbbr.displayName = 'CoinstacAbbr';
