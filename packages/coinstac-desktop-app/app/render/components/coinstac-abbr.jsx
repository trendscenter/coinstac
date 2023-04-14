import React from 'react';

import LogoImage from '../../../img/icons/coinstac-logo.png';

export default function CoinstacAbbr() {
  return (
    <div className="logo">
      <img src={LogoImage} alt="coinstac" />
    </div>
  );
}

CoinstacAbbr.displayName = 'CoinstacAbbr';
