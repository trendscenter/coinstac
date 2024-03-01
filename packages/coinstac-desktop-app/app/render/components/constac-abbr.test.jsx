import { render, screen } from '@testing-library/react';
import React from 'react';
import CoinstacAbbr from './coinstac-abbr';

describe('CoinstacAbbr', () => {
  it('should render component', () => {
    render(
      <CoinstacAbbr />
    );
    screen.getByAltText('coinstac');
  });
});
