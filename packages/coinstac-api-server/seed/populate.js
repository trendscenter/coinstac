const database = require('../src/database');
const helperFunctions = require('../src/auth-helpers');

const dsneMS = require('./data/coinstac-dsne-ms');
const drneVbm = require('./data/coinstac-schema-regression-vbm');
// const ssrVbm = require('./data/coinstac-schema-regression-ss-vbm');
const msrVbm = require('./data/coinstac-schema-regression-ms-vbm');
const dmancova = require('./data/coinstac-dmancova');

const drneFsl = require('./data/coinstac-schema-regression-fsl');
const ssrFsl = require('./data/coinstac-schema-regression-ss-fsl');
const msrFsl = require('./data/coinstac-schema-regression-ms-fsl');

const gica = require('./data/coinstac-gica-pipeline');
const ddfnc = require('./data/coinstac-ddfnc-pipeline');
const dpsvm = require('./data/coinstac-dpsvm');
const vbm = require('./data/coinstac-vbm-pre');

const fmri = require('./data/coinstac-fmri');

const decentralized = require('./data/coinstac-decentralized-test');
// const transfer = require('./data/coinstac-file-transfer-test');
// const stress = require('./data/coinstac-file-stress-test');
const decentralizedError = require('./data/coinstac-decentralized-error');
const enigmaSans = require('./data/coinstac-enigma-sans');
const local = require('./data/coinstac-local-test');
const localError = require('./data/coinstac-local-error');

const CONSORTIA_IDS = [
  database.createUniqueId(),
  database.createUniqueId(),
];

const PIPELINE_IDS = [
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
];

const COMPUTATION_IDS = [
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
];

const USER_IDS = [
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
];

const RUN_IDS = [
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
  database.createUniqueId(),
];

async function populateComputations() {
  const db = database.getDbInstance();

  return db.collection('computations').insertMany([
    { ...local, submittedBy: 'author', _id: COMPUTATION_IDS[0] },
    { ...decentralized, submittedBy: 'author', _id: COMPUTATION_IDS[1] },
    { ...msrFsl, submittedBy: 'author', _id: COMPUTATION_IDS[2] },
    { ...msrVbm, submittedBy: 'author', _id: COMPUTATION_IDS[3] },
    { ...vbm, submittedBy: 'author', _id: COMPUTATION_IDS[4] },
    { ...gica, submittedBy: 'author', _id: COMPUTATION_IDS[5] },
    { ...ddfnc, submittedBy: 'author', _id: COMPUTATION_IDS[6] },
    { ...dpsvm, submittedBy: 'author', _id: COMPUTATION_IDS[7] },
    { ...drneVbm, submittedBy: 'author', _id: COMPUTATION_IDS[8] },
    { ...dsneMS, submittedBy: 'author', _id: COMPUTATION_IDS[9] },
    { ...drneFsl, submittedBy: 'author', _id: COMPUTATION_IDS[10] },
    { ...decentralizedError, submittedBy: 'author', _id: COMPUTATION_IDS[11] },
    { ...enigmaSans, submittedBy: 'author', _id: COMPUTATION_IDS[12] },
    { ...localError, submittedBy: 'author', _id: COMPUTATION_IDS[13] },
    { ...fmri, submittedBy: 'author', _id: COMPUTATION_IDS[14] },
    { ...ssrFsl, submittedBy: 'author', _id: COMPUTATION_IDS[15] },
    { ...dmancova, submittedBy: 'author', _id: COMPUTATION_IDS[16] },
  ]);
}

async function populateConsortia() {
  const db = database.getDbInstance();

  return db.collection('consortia').insertMany([
    {
      _id: CONSORTIA_IDS[0],
      name: 'Test Consortia 1',
      description: 'This consortia is for testing.',
      owners: {
        [USER_IDS[5]]: 'author',
      },
      members: {
        [USER_IDS[5]]: 'author',
      },
      isPrivate: false,
      createDate: 1551333489519,
    },
    {
      _id: CONSORTIA_IDS[1],
      activePipelineId: PIPELINE_IDS[0],
      name: 'Test Consortia 2',
      description: 'This consortia is for testing too.',
      owners: {
        [USER_IDS[0]]: 'test1',
      },
      members: {
        [USER_IDS[0]]: 'test1',
        [USER_IDS[5]]: 'author',
      },
      isPrivate: false,
      createDate: 1551666489519,
    },
  ]);
}

async function populatePipelines() {
  const db = database.getDbInstance();

  return db.collection('pipelines').insertMany([
    {
      _id: PIPELINE_IDS[0],
      delete: false,
      description: 'ssr',
      name: 'ssr test',
      owningConsortium: CONSORTIA_IDS[1],
      shared: false,
      steps: [
        {
          computations: [
            COMPUTATION_IDS[15],
          ],
          controller: {
            id: null,
            options: {},
            type: 'decentralized',
          },
          id: 'HJKRyjTuM',
          inputMap: {
            covariates: {
              fulfilled: false,
              value: [
                {
                  name: 'isControl',
                  type: 'boolean',
                },
                {
                  name: 'age',
                  type: 'number',
                },
              ],
            },
            data: {
              fulfilled: true,
              value: [
                {
                  type: 'FreeSurfer',
                  value: ['3rd-Ventricle', '4th-Ventricle', '5th-Ventricle'],
                },
              ],
            },
            lambda: { value: 2 },
          },
        },
      ],
    },
    {
      _id: PIPELINE_IDS[1],
      name: 'Decentralized Pipeline',
      description: 'Test description',
      owningConsortium: CONSORTIA_IDS[1],
      shared: true,
      steps: [
        {
          id: 'UIKDl-',
          controller: { type: 'decentralized' },
          computations: [
            COMPUTATION_IDS[0],
          ],
          inputMap: {
            start: { value: 1 },
          },
        },
      ],
    },
    {
      _id: PIPELINE_IDS[2],
      name: 'Local Pipeline',
      description: 'Local Test description',
      owningConsortium: CONSORTIA_IDS[1],
      shared: true,
      steps: [
        {
          id: 'UIKDl-local1',
          controller: { type: 'local' },
          computations: [
            COMPUTATION_IDS[0],
          ],
          inputMap: {
            start: { value: 1 },
          },
        },
        {
          id: 'UIKDl-local2',
          controller: { type: 'local' },
          computations: [
            COMPUTATION_IDS[0],
          ],
          inputMap: {
            start: { fromCache: { step: 0, variable: 'sum' } },
          },
        },
      ],
    },
  ]);
}

async function populateRuns() {
  const db = database.getDbInstance();

  db.collection('runs').insertMany([
    {
      _id: RUN_IDS[0],
      clients: {
        [USER_IDS[0].toHexString()]: 'test1',
      },
      consortiumId: CONSORTIA_IDS[1],
      pipelineSnapshot: {
        id: PIPELINE_IDS[0].toHexString(),
        delete: false,
        description: '',
        name: 'VBM Pre',
        owningConsortium: CONSORTIA_IDS[1],
        shared: false,
        steps: [
          {
            id: 'BJc_Tgv8V',
            computations: [
              {
                id: '473daa33-77b0-4a5a-abbe-212f0727ebac',
                meta: {
                  name: 'VBM Preprocessor',
                  description: 'This computation runs Voxel Based Morphometry on structural T1 weighted MRI scans(BIDS format and T1w nifiti) using SPMv12 standalone and MATLAB Runtimev713. Each scan takes approximately 5 mins to run on a system with 2.3 GHz,i5 equivalent processor, 8GB RAM. Each scan output directory takes about 150MB space. Please make sure to have the space and resources.',
                  version: 'v1.0',
                },
                computation: {
                  type: 'docker',
                  dockerImage: 'coinstac/vbm_pre',
                  command: [
                    'python',
                    '/computation/run_vbm.py',
                  ],
                  remote: null,
                  input: {
                    dataMeta: {
                      extensions: [
                        [
                          'txt',
                        ],
                      ],
                      items: [
                        'NIfTI',
                      ],
                      label: 'Data',
                      type: 'array',
                    },
                    options: {
                      defaultValue: 10,
                      description: 'Full width half maximum smoothing kernel value in x,y,z directions',
                      label: 'Smoothing FWHM in mm',
                      max: 1,
                      min: 0,
                      step: 1,
                      type: 'number',
                    },
                  },
                  output: {
                    display: {
                      description: 'Output wc1 images',
                      type: 'string',
                    },
                    download_outputs: {
                      description: 'Download vbm outputs here',
                      type: 'string',
                    },
                    message: {
                      description: 'Output message from VBM step',
                      type: 'string',
                    },
                  },
                  display: {
                    type: 'string',
                  },
                },
              },
            ],
            controller: {
              id: null,
              options: {},
              type: 'local',
            },
            inputMap: {
              data: {
                ownerMappings: [
                  {
                    type: 'NIfTI',
                  },
                ],
                value: [
                  '/input/test1/local-S1zjvgj8E/-Users-jtromero-Data-coinstac-vbm-pre-test-data-nifti_inputs-sub-02_T1w.nii.gz',
                  '/input/test1/local-S1zjvgj8E/-Users-jtromero-Data-coinstac-vbm-pre-test-data-nifti_inputs-sub-04_T1w.nii.gz',
                  '/input/test1/local-S1zjvgj8E/-Users-jtromero-Data-coinstac-vbm-pre-test-data-nifti_inputs-sub-03_T1w.nii',
                ],
              },
              options: {
                value: 6,
              },
            },
          },
        ],
      },
      startDate: 1551726489519,
      type: 'local',
      results: {
        display: 'iVBORw0KGgoAAAANSUhEUgAAApQAAAEECAYAAACWQaTiAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAPYQAAD2EBqD+naQAAADl0RVh0U29mdHdhcmUAbWF0cGxvdGxpYiB2ZXJzaW9uIDMuMC4zLCBodHRwOi8vbWF0cGxvdGxpYi5vcmcvnQurowAAIABJREFUeJzsvXl8VNX9Pv7MTGYy2VeyACEhYUnYQRAiKIsK7qioFUHAqnX9ttXaaqt1q7Z+tK0LWlsVl1KlWhUVVFxYLKAsWkC2sAQiS0LIQvZlZjL398f8nvecmTsJgbAEPM/rldfAXc4999yzvM/z3iyGYRjQ0NDQ0DglMWzYMKxbt+5kV0NDQ+NHDuvJroCGhoaGhoaGhsapDS1QamhoaGhoaGhodAgnXaAsKiqCxWLBuHHjjui+cePGwWKxYNmyZSGP889msyEhIQG9evXClClT8MILL6C6uvqo6/vxxx/j/vvvx3nnnYf4+PijqnsobNu2DXfddRcGDx6MhIQE2O12JCcnY8yYMXjggQewZcuWDj9D49RCVVUVkpKScPXVVwccf/3116V/z5o1q9X7c3NzYbFYUFRUdHwr2knw8MMPw2Kx4PXXXw84PmvWrJBzxclEqLoahoGhQ4di4MCB8Hq9J69yGhoaGkeBky5QHi9MmjQJM2fOxPXXX48JEyYgMTERCxYswJ133omMjAzTotNeTJs2DX/84x+xePHiDgmmhGEY+P3vf4/+/fvjmWeeQVlZGUaPHo1rrrkGI0aMwPbt2/H4449jwIAB+L//+78OP+/HCIvFgqysrFbPZ2VlwWKxnLgKtROPP/44Dh06hIceeqjVa/71r39hx44dJ7BWGscLFosFDz74IDZt2nTU85OGhobGyULYya7A8cJ9991nYg6rq6vx9NNP47HHHsMNN9wAt9uNm2+++YjKnTJlCvLy8jB8+HC43W5MnDixQ/W899578dRTTyE1NRUvvfQSLrvssoDzhmFgyZIlePjhh7Xg8CNCSUkJZs+ejUsvvRQDBgwIeU1ERAQaGxvx6KOPYu7cuSe4hqcO/vSnP+G+++5Djx49TnZVDovLL78cubm5ePDBBzFjxgyEhZ22U7SGhsZphtOWoQyFuLg4PPzww7L7//nPf47S0tIjKmPOnDm45557MG7cOMTExHSoPt988w3+/Oc/IyoqCl999ZVJmAR8rMW5556L//73v7jjjjs69DyNUwevvvoqmpubMWPGjFavueKKK5CWloZ58+Zh27ZtJ7B2pxbS09ORm5uLyMjIk12Vw8JisWDatGnYv38/Pvroo5NdHQ0NDY12o10C5aZNmzB9+nRkZ2fD6XSiS5cuGDJkCH75y1+ipKRErqNt18MPPxyyHNo3tmbTVVNTg1/84hfIyMiA0+lEXl4enn766WNuTzR9+nSMGTMGTU1NePnll49p2UeCv/zlLzAMA7/4xS/Qt2/fNq+1WCwYOnRowDG1vbdv345rr70WqampsFqt+OCDDwAAO3fuxMMPP4z8/HykpaXB4XCge/fumDFjBrZv3x5QXklJCex2OzIyMtDS0hKyHm+99RYsFgtmzpzZrnekutnj8eAPf/gDevXqhYiICOTl5eG1116T65YsWYLx48cjNjYWCQkJmDFjBioqKkzlHcn7sH0A4IcffgiwrR03bhyWLVsGi8WCH374QerKv2AVucfjwYsvvoj8/HzExsYiIiICQ4YMwTPPPAOPx2OqJ9XohmFg9uzZGDx4MCIjIzFkyJDDtplhGJgzZw5iYmJw8cUXt3pdREQE7r33XrS0tLQ65lrDli1bMG3aNKSnp8PhcKBbt26YMWNGSMGU7TRr1iwcOHAAN910E7p3746wsDA888wzAALtFL/88kucc845iImJQUpKCm6++WYxDzl48CBuueUWdOvWDU6nE2eeeWZI28ampibMmTMHkydPRnZ2NiIiIhAfH49zzjkH//73v4/oXUPZUPJYW3/B9aqsrMRvf/tb9OvXDxEREYiLi8OECROwcOHCVp/90UcfIT8/H5GRkUhKSsKUKVNM/TQY1113HQCc1LlJQ0ND40hxWH3Kd999J8LXoEGDMHnyZDQ0NGDXrl149tlncfnllyM9Pb3DFWlubsaECRNQWFiICRMmwOVyYfHixbj77ruxYcOGY25TdO2112LFihVYunQpHnjggWNadnvQ0tKCL774AgAwderUDpW1bds2jBgxAklJSRg/fjwOHToEu90OAHjllVfw5JNPYsCAARgxYgTCw8OxZcsWzJ07Fx9++CGWL1+OQYMGAfAxOZdddhnef/99LFq0KKQww0XuZz/72RHV8ZprrhGhMScnB1999RV++tOfAgBiYmIwdepUjBo1CpMmTcI3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0yY5zvBBoeKsbd++vVWhEQAqKiqwePFi03HGnMvPzw+pNj0azJ07FytXrkRkZCRuuummY1Lm0eBXv/oVAOCZZ545LoGpuShxQVSxc+dO/O9//2v13rPPPhv9+/fHBx98gCeffBJer/ekthVw9O9jt9tDxookuBEKdc348eNhs9mwcOFCsdU83iATeqR9wm634/777weAVtM10t5v3rx5Ic//61//CrjuZOHQoUOIjY01CZMAZAPbUTz44IOYP38+xo8fj+eee67V62jbPX/+/HaXzfYLVdfKykqxy2wNW7duBYB2xS3V0NDQ6Aw4rED597//Hbt37zYd/+STTwAAGRkZcmzEiBGIjIzEp59+GsCQlJeX46abbjqsyvuee+4JsKXavXs3Hn30UQA4Jlliqqur8cgjj+CGG24AADz//PMnlQHIz8/HPffcg/r6eowdO7ZVNeWaNWtaDTTeFvr06QMAeP/99wNsDquqqnDjjTceVkC65ZZb4HK58MILL8But2PWrFlHXIdjiaN9n65du6K0tLRVezSydqEEuG7duuGnP/0pioqKMHXq1JCZlXbu3NmmI8yRgsLI2rVrj/jeWbNmoWfPnvj4449DbuCuueYapKamYsWKFXjppZcCzj333HP49ttv0a1bt3YzcccLffr0waFDh0STQDz99NNYunRph8t/++238dhjjyE7Oxv/+c9/2nQ0nDJlCvr164c333wTf/jDH0x2vYZhYOXKlVi5cqUcu+GGGxAeHo4333wTX375pRx3u9246667UF9f32b91qxZA4fDgVGjRh3lG2poaGicWBxW5c3gvP369UNeXh7CwsJQUFCADRs2wOl04sEHH5Rro6Ojcc899+DRRx/FmDFjMHbsWFgsFqxevRp5eXnIz8/HN998E/I5o0aNgsvlQq9evTBhwgS43W4sXrwYDQ0NmD59eqselq3hiSeeEI/ouro67Nu3D+vWrYPL5UJsbCyef/55XH/99UdUJgD84Q9/wMcffyzlAsD//ve/gIl//vz57Q72/uSTTyI8PBx/+tOfcPnllyMtLQ3Dhw9HbGwsysvLUVhYiMLCQrERPBIMHz4c559/Pr744gv06dNHPK2XLVuG5ORkTJ48uU1buxkzZuC+++5DQ0MDJk+eLKrYk4WjfZ/LLrsMs2fPxrBhw3DWWWfB6XSib9+++PWvfy3n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',
        download_outputs: '/output/test1/local-S1zjvgj8E/vbm_outputs.zip',
        message: 'VBM preprocessing completed. 3/3 subjects completed successfully.Please read outputs_description.txt for description of pre-processed output files and quality_control_readme.txt for quality control measurement.These files are placed under the pre-processed data. QC warning: Only half of the data is pre-processed or passed the QA, please check the data!',
      },
      endDate: null,
      userErrors: null,
      status: 'complete',
      localPipelineState: {
        controllerState: 'stopped',
        currentIteration: 1,
        mode: 'local',
        pipelineStep: 0,
        totalSteps: 1,
      },
    },
    {
      _id: RUN_IDS[1],
      clients: {
        [USER_IDS[0].toHexString()]: 'test1',
      },
      consortiumId: CONSORTIA_IDS[1],
      startDate: '1568405561851',
      endDate: '1568408608526',
      pipelineSnapshot: {
        delete: false,
        description: 'ddFNC',
        id: 'b908c384-aa47-42cf-af56-9fc473b4ceff',
        name: 'ddFNC',
        owningConsortium: CONSORTIA_IDS[1],
        shared: false,
        steps: [
          {
            computations: [
              {
                computation: {
                  command: [
                    'python',
                    '/computation/local.py',
                  ],
                  display: {
                    type: 'iframe',
                  },
                  dockerImage: 'coinstacteam/ddfnc:latest',
                  input: {
                    dataMeta: {
                      extensions: [
                        [
                          'csv',
                          'txt',
                        ],
                      ],
                      items: [
                        'NIfTI',
                      ],
                      label: 'Data',
                      order: 0,
                      type: 'bundle',
                    },
                    dfnc_k: {
                      conditional: {
                        value: 'Dynamic FNC',
                        variable: 'fnc',
                      },
                      default: 5,
                      group: 'fnc_method',
                      label: 'Number of Clusters',
                      order: 7,
                      showValue: 'Dynamic FNC',
                      source: 'owner',
                      type: 'number',
                    },
                    fnc: {
                      default: 'None',
                      group: 'fnc_method',
                      label: 'Kind of FNC to perform',
                      order: 5,
                      type: 'select',
                      values: [
                        'None',
                        'Static FNC',
                        'Dynamic FNC',
                      ],
                    },
                    fnc_window_size: {
                      conditional: {
                        value: 'Dynamic FNC',
                        variable: 'fnc',
                      },
                      default: 22,
                      group: 'fnc_method',
                      label: 'Sliding Window Size',
                      order: 6,
                      showValue: 'Dynamic FNC',
                      source: 'owner',
                      type: 'number',
                    },
                    ica: {
                      default: 'Infomax ICA',
                      group: 'ica',
                      label: 'ICA Method',
                      order: 2,
                      type: 'select',
                      values: [
                        'Infomax ICA',
                        'Spatially Constrained',
                      ],
                    },
                    mask: {
                      default: '/computation/local_data/mask.nii',
                      label: 'Mask',
                      order: 1,
                      source: 'owner',
                      type: 'string',
                    },
                    num_ics: {
                      conditional: {
                        value: 'Infomax ICA',
                        variable: 'ica',
                      },
                      default: 20,
                      group: 'ica',
                      label: 'Global Number of Independent Components',
                      order: 3,
                      showValue: 'Infomax ICA',
                      source: 'owner',
                      type: 'number',
                    },
                    scica_template: {
                      conditional: {
                        value: 'Infomax ICA',
                        variable: 'ica',
                      },
                      default: '/computation/local_data/NeuroMark.nii',
                      group: 'ica',
                      label: 'Spatially Constrained ICA Template',
                      order: 4,
                      showValue: 'Spatially Constrained',
                      type: 'string',
                    },
                  },
                  output: {},
                  remote: {
                    command: [
                      'python',
                      '/computation/remote.py',
                    ],
                    dockerImage: 'coinstacteam/ddfnc:latest',
                    type: 'docker',
                  },
                  type: 'docker',
                },
                id: '0ebb54bb-09fe-452b-a2e7-44f4b20fcb0b',
                meta: {
                  description: 'a demo for decentralized dfnc',
                  id: 'ddfnc',
                  name: 'Decentralized DFNC',
                  repository: 'https://github.com/MRN-Code/coinstac_ddfnc_pipeline',
                  version: 'v1.0.0',
                },
                submittedBy: 'test1',
              },
            ],
            controller: {
              options: {},
              type: 'decentralized',
            },
            id: 'w4TJR47n9',
            inputMap: {
              data: {
                ownerMappings: [
                  {
                    type: 'NIfTI',
                  },
                ],
              },
              dfnc_k: {
                value: 5,
              },
              fnc: {
                value: 'None',
              },
              fnc_window_size: {
                value: 22,
              },
              ica: {
                value: 'Infomax ICA',
              },
              mask: {
                value: '/computation/local_data/mask.nii',
              },
              num_ics: {
                value: 20,
              },
              results_folder: {
                value: 'gica_cmd_gica_results',
              },
              scica_template: {
                value: '/computation/local_data/NeuroMark.nii',
              },
              results_html_path: {
                default: 'gica_cmd_gica_results/icatb_gica_html_report.html',
                label: 'Generated Results HTML File Path',
                order: 8,
                source: 'owner',
                type: 'string',
              },
            },
          },
        ],
      },
      remotePipelineState: {
        controllerState: 'waiting on local users',
        currentIteration: 30,
        mode: 'remote',
        pipelineStep: 0,
        totalSteps: 1,
        waitingOn: [],
      },
      error: null,
      results: {
        computation_phase: 'dkmnx_remote_final',
      },
      type: 'decentralized',
      status: 'complete',
    },
    {
      id: 'results-2',
      clients: {
        [USER_IDS[0].toHexString()]: 'test1',
      },
      consortiumId: CONSORTIA_IDS[1],
      startDate: '1518559440672',
      endDate: '1518559440685',
      pipelineSnapshot: {
        name: 'Box Plot Test',
        steps: [
          {
            computations: [
              {
                computation: {
                  display: [
                    {
                      type: 'box_plot',
                    },
                    {
                      type: 'table',
                    },
                  ],
                },
                message: {
                  description: 'Output message from VBM step',
                  type: 'string',
                },
              },
            ],
          },
        ],
      },
      remotePipelineState: null,
      error: null,
      results: {
        label: '',
        x: [
          {
            label: 'fwhm_x',
            values: [
              2.440704,
              2.4548064,
              2.3936447,
              2.5057568,
              2.4331584,
              2.4189439,
              2.391568,
              2.5149056,
            ],
          },
          {
            label: 'fwhm_y',
            values: [
              2.7808607,
              2.9629952,
              2.7132992,
              2.9282688,
              2.852704,
              2.93376,
              2.88102,
              2.8415712,
            ],
          },
          {
            label: 'fwhm_z',
            values: [
              2.2223925,
              2.254465,
              2.0552725,
              2.31188,
              2.1533875,
              2.1320375,
              2.189615,
              2.26769,
            ],
          },
        ],
        y_range: [
          2,
          3.2,
        ],
      },
      type: 'decentralized',
      status: 'complete',
    },
    {
      _id: RUN_IDS[2],
      clients: {
        [USER_IDS[0].toHexString()]: 'test1',
      },
      consortiumId: CONSORTIA_IDS[1],
      startDate: '1518559440668',
      endDate: '1551465751260',
      pipelineSnapshot: {
        name: 'Scatter Plot Test',
        steps: [
          {
            computations: [
              {
                computation: {
                  display: [
                    {
                      type: 'scatter_plot',
                    },
                    {
                      type: 'table',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      remotePipelineState: null,
      error: null,
      results: {
        label: '',
        plots: [
          {
            coordinates: [
              {
                x: 12.098,
                y: -72.356,
              },
              {
                x: 7.0038,
                y: -54.051,
              },
              {
                x: 8.7711,
                y: -57.018,
              },
              {
                x: -5.372,
                y: -82.911,
              },
              {
                x: -18.65,
                y: -94.955,
              },
              {
                x: -0.43827,
                y: -78.434,
              },
            ],
            title: '0',
          },
          {
            coordinates: [
              {
                x: 1.4987,
                y: -101.38,
              },
              {
                x: 0.96424,
                y: -102.25,
              },
              {
                x: -17.659,
                y: -95.997,
              },
              {
                x: -5.0453,
                y: -69.168,
              },
              {
                x: 12.593,
                y: -89.655,
              },
              {
                x: 8.6105,
                y: -91.641,
              },
            ],
            title: '1',
          },
          {
            coordinates: [
              {
                x: 48.988,
                y: -24.481,
              },
              {
                x: 30.156,
                y: -3.7403,
              },
              {
                x: 22.191,
                y: -12.257,
              },
              {
                x: 19.628,
                y: -13.65,
              },
              {
                x: 48.778,
                y: -21.647,
              },
              {
                x: 19.768,
                y: -11.083,
              },
            ],
            title: '2',
          },
          {
            coordinates: [
              {
                x: -58.108,
                y: -13.587,
              },
              {
                x: -47.321,
                y: 53.963,
              },
              {
                x: -56.119,
                y: -11.41,
              },
              {
                x: -51.595,
                y: 54.788,
              },
              {
                x: -60.736,
                y: 3.9981,
              },
              {
                x: -43.288,
                y: -5.1986,
              },
            ],
            title: '9',
          },
        ],
        x_labels: [
          '-100',
          '80',
        ],
        y_labels: [
          '-80',
          '80',
        ],
      },
      type: 'decentralized',
      status: 'complete',
    },
  ]);
}

async function populateUsers() {
  const password = await helperFunctions.hashPassword('password');

  await helperFunctions.createUser({
    _id: USER_IDS[0],
    username: 'test1',
    name: 'Testy Testerson',
    institution: 'mrn',
    email: 'test@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        [CONSORTIA_IDS[0]]: ['member'],
        [CONSORTIA_IDS[1]]: ['owner', 'member'],
      },
      pipelines: {},
      roles: {
        admin: true,
        author: true,
      },
    },
    consortiaStatuses: {
      [CONSORTIA_IDS[0]]: 'none',
      [CONSORTIA_IDS[1]]: 'none',
    },
  }, password);

  await helperFunctions.createUser({
    _id: USER_IDS[1],
    username: 'test2',
    name: 'Deuce Masterson',
    institution: 'mrn',
    email: 'test2@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        [CONSORTIA_IDS[0]]: ['member'],
        [CONSORTIA_IDS[1]]: ['member'],
      },
      pipelines: {},
      roles: {
        admin: false,
        author: true,
      },
    },
    consortiaStatuses: {
      [CONSORTIA_IDS[0]]: 'none',
      [CONSORTIA_IDS[1]]: 'none',
    },
  }, password);

  await helperFunctions.createUser({
    _id: USER_IDS[2],
    username: 'test3',
    name: 'Tre Testington III',
    institution: 'mrn',
    email: 'test3@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        [CONSORTIA_IDS[0]]: ['member'],
        [CONSORTIA_IDS[1]]: ['member'],
      },
      pipelines: {},
      roles: {
        admin: false,
        author: false,
      },
    },
    consortiaStatuses: {
      [CONSORTIA_IDS[0]]: 'none',
      [CONSORTIA_IDS[1]]: 'none',
    },
  }, password);

  await helperFunctions.createUser({
    _id: USER_IDS[3],
    username: 'test4',
    name: 'Quattro Quintana',
    institution: 'mrn',
    email: 'test4@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        [CONSORTIA_IDS[0]]: ['member'],
        [CONSORTIA_IDS[1]]: ['member'],
      },
      pipelines: {},
      roles: {
        admin: true,
        author: true,
      },
    },
    consortiaStatuses: {
      [CONSORTIA_IDS[0]]: 'none',
      [CONSORTIA_IDS[1]]: 'none',
    },
  }, password);

  await helperFunctions.createUser({
    _id: USER_IDS[4],
    username: 'test5',
    name: 'Cinco Chavez',
    institution: 'mrn',
    email: 'test5@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        [CONSORTIA_IDS[0]]: ['member'],
        [CONSORTIA_IDS[1]]: ['member'],
      },
      pipelines: {},
      roles: {
        admin: false,
        author: true,
      },
    },
    consortiaStatuses: {
      [CONSORTIA_IDS[0]]: 'none',
      [CONSORTIA_IDS[1]]: 'none',
    },
  }, password);

  await helperFunctions.createUser({
    _id: USER_IDS[5],
    username: 'author',
    name: 'Arturo Andersson',
    institution: 'mrn',
    email: 'author@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        [CONSORTIA_IDS[0]]: ['owner', 'member'],
        [CONSORTIA_IDS[1]]: ['member'],
      },
      pipelines: {},
      roles: {
        admin: false,
        author: false,
      },
    },
  }, password);

  const adminPassword = await helperFunctions.hashPassword(process.argv[3]
    || process.env.SERVER_API_PASSWORD);

  await helperFunctions.createUser({
    _id: USER_IDS[6],
    username: process.env.SERVER_API_USERNAME,
    name: 'Sally Serverson',
    institution: 'mrn',
    email: 'server@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
      roles: {
        admin: true,
        author: false,
      },
    },
    consortiaStatuses: {
      [CONSORTIA_IDS[0]]: 'none',
      [CONSORTIA_IDS[1]]: 'none',
    },
  }, adminPassword);
}

async function populateHeadlessClients() {
  const db = database.getDbInstance();

  return db.collection('headlessClients').insertMany([
    {
      name: 'Headless 1',
      computationWhitelist: {
        [COMPUTATION_IDS[10]]: {
          inputMap: {
            covariates: {
              type: 'csv',
              dataMap: [
                { csvColumn: 'age', variableName: 'age' },
                { csvColumn: 'isControl', variableName: 'isControl' },
              ],
              dataFilePath: '/home/rochaeb/Documents/Projects/trends/coinstac/algorithm-development/test-data/freesurfer-test-data/site1/site1_Covariate.csv',
            },
          },
        },
      },
    },
  ]);
}

async function populate(closeConnection = true) {
  await database.connect();

  database.dropDbInstance();

  await populateComputations();
  await populateConsortia();
  await populatePipelines();
  await populateRuns();
  await populateUsers();
  await populateHeadlessClients();

  if (closeConnection) {
    await database.close();
  }
}

module.exports = {
  CONSORTIA_IDS,
  COMPUTATION_IDS,
  PIPELINE_IDS,
  USER_IDS,
  RUN_IDS,
  populate,
};
