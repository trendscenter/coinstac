/* eslint-disable no-undef */

import React, { Component } from 'react';

export default class Papaya extends Component {
  componentDidMount() {
    this.loadResult();
  }

  loadResult = () => {
    const params = {
      images: [['./smri_example.nii.gz']],
    };

    papaya.Container.addViewer('papaya-viewer', params);
    papaya.Container.resetViewer(0, params);
    papaya.Container.addImage(0, params.images[0]);
  }

  render() {
    return (
      <div id="papaya-viewer" data-params="params" />
    );
  }
}
