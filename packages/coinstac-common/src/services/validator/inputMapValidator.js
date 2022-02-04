const Joi = require('joi');

const brainRegions = [
  '3rd-Ventricle',
  '4th-Ventricle',
  '5th-Ventricle',
  'Brain-Stem',
  'BrainSegVol',
  'BrainSegVol-to-eTIV',
  'BrainSegVolNotVent',
  'BrainSegVolNotVentSurf',
  'CC_Anterior',
  'CC_Central',
  'CC_Mid_Anterior',
  'CC_Mid_Posterior',
  'CC_Posterior',
  'CortexVol',
  'CorticalWhiteMatterVol',
  'CSF',
  'EstimatedTotalIntraCranialVol',
  'Left-Accumbens-area',
  'Left-Amygdala',
  'Left-Caudate',
  'Left-Cerebellum-Cortex',
  'Left-Cerebellum-White-Matter',
  'Left-choroid-plexus',
  'Left-Hippocampus',
  'Left-Inf-Lat-Vent',
  'Left-Lateral-Ventricle',
  'Left-non-WM-hypointensities',
  'Left-Pallidum',
  'Left-Putamen',
  'Left-Thalamus-Proper',
  'Left-VentralDC',
  'Left-vessel',
  'Left-WM-hypointensities',
  'lhCortexVol',
  'lhCorticalWhiteMatterVol',
  'lhSurfaceHoles',
  'MaskVol',
  'MaskVol-to-eTIV',
  'non-WM-hypointensities',
  'Optic-Chiasm',
  'rhCortexVol',
  'rhCorticalWhiteMatterVol',
  'rhSurfaceHoles',
  'Right-Accumbens-area',
  'Right-Amygdala',
  'Right-Caudate',
  'Right-Cerebellum-Cortex',
  'Right-Cerebellum-White-Matter',
  'Right-choroid-plexus',
  'Right-Hippocampus',
  'Right-Inf-Lat-Vent',
  'Right-Lateral-Ventricle',
  'Right-non-WM-hypointensities',
  'Right-Pallidum',
  'Right-Putamen',
  'Right-Thalamus-Proper',
  'Right-VentralDC',
  'Right-vessel',
  'Right-WM-hypointensities',
  'SubCortGrayVol',
  'SupraTentorialVol',
  'SupraTentorialVolNotVent',
  'SupraTentorialVolNotVentVox',
  'SurfaceHoles',
  'TotalGrayVol',
  'WM-hypointensities',
];


const schema = {
  number: ({ min, max }) => {
    let schema = Joi.number();
    if (min !== undefined) {
      schema = schema.min(min);
    }
    if (max !== undefined) {
      schema = schema.max(max);
    }
    return schema;
  },
  csv: ({ items }) => {
    const schema = Joi.array().items(Joi.object({
      type: Joi.string().valid(...items),
      name: Joi.string(),
    }));
    return schema;
  },
  freesurfer: () => {
    const schema = Joi.array().items(Joi.object({
      value: Joi.array().items(Joi.string().valid(...brainRegions)),
      type: 'FreeSurfer',
    }));
    return schema;
  },
};

function validator(opts, value) {
  return schema[opts.type](opts).validate(value);
}


function inputMapValidator(compSpecInput, fulFilledInputMap) {
  Object.keys(fulFilledInputMap).forEach((key) => {
    const validationResult = validator(compSpecInput[key], fulFilledInputMap[key].value);
    if (validationResult.error) {
      throw validationResult;
    }
  });
  return true;
}


module.exports = inputMapValidator;
