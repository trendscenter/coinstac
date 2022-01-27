export default {
  consortiumPipeline: [
    {
      id: 'cp-create-pipeline',
      target: '#new-pipeline',
      content: 'Click this button to create a pipeline',
      placementBeacon: 'right',
    },
  ],
  consortiumTabs: [
    {
      id: 'ct-go-to-pipeline-tab',
      target: '#pipeline-tab',
      content: 'Go to pipeline tab to create a pipeline for this consortium',
      placementBeacon: 'right',
    },
  ],
  pipeline: [
    {
      id: 'p-input-pipeline-name',
      target: '#name',
      content: 'Please input pipeline name',
      placementBeacon: 'right',
    },
    {
      id: 'p-input-pipeline-description',
      target: '#description',
      content: 'Please input pipeline description',
      placementBeacon: 'right',
    },
    {
      id: 'p-set-active-pipeline',
      target: '#set-active',
      content: 'Please select to set this pipeline active on this consortium',
      placementBeacon: 'right',
    },
    {
      id: 'p-add-computation-steps',
      target: '#computation-dropdown',
      content: 'Click this button to add computation steps',
      placementBeacon: 'right',
    },
    {
      id: 'p-save-pipeline',
      target: '#save-pipeline',
      content: 'Click this button to save the pipeline',
      placementBeacon: 'right',
    },
    {
      id: 'p-go-to-maps-screen',
      target: '#maps-menu',
      content: 'Click this link to go to maps screen and map data with consortium',
      placementBeacon: 'right',
    },
    {
      id: 'p-go-to-consortia-screen',
      target: '#consortia-menu',
      content: 'Click this link to go to consortia screen and start pipeline',
      placementBeacon: 'right',
    },
  ],
  dashboardNav: [
    {
      id: 'dn-go-to-consortia-screen',
      target: '#consortia-menu',
      content: 'Click this link to go to consortia screen',
      placementBeacon: 'right',
    },
  ],
  consortiumAbout: [
    {
      id: 'ca-input-consortium-name',
      target: '#name',
      content: 'Please input consortium name here',
      placementBeacon: 'right',
    },
    {
      id: 'ca-input-consortium-description',
      target: '#description',
      content: 'Please input consortium description here',
      placementBeacon: 'right',
    },
    {
      id: 'ca-create-consortium',
      target: '#save-consortium',
      content: 'Click this button to create a consortium',
      placementBeacon: 'left',
    },
  ],
  consortiaList: [
    {
      id: 'cl-create-consortium',
      target: '#consortium-add',
      content: 'Click this button to create a consortium',
      placementBeacon: 'left',
    },
    {
      id: 'cl-start-consortium',
      target: '.start-pipeline',
      content: 'Click this button to start a pipeline',
      placementBeacon: 'right',
    },
  ],
};
