'use strict';

import projectReducer, {
  ADD_FILES_TO_PROJECT,
  addFilesToProject,
  REMOVE_FILES_FROM_PROJECT,
  removeFilesFromProject,
  SET_PROJECT,
  setProject,
} from '../../../../app/render/state/ducks/project';
import tape from 'tape';

const FILES_FIXTURE = [{
  filename: 'wat.gif',
}, {
  filename: 'doge.jpg',
}, {
  filename: 'spacellama.gif',
}];

const PROJECT_FIXTURE = {
  name: 'Parrot Party',
  files: FILES_FIXTURE,
};

tape('project :: add files', t => {
  t.equal(addFilesToProject().type, ADD_FILES_TO_PROJECT, 'returns type');
  t.deepEqual(
    addFilesToProject(JSON.stringify(FILES_FIXTURE)).files,
    FILES_FIXTURE,
    'passes files param'
  );
  t.end();
});

tape('project :: remove files', t => {
  t.equal(
    removeFilesFromProject().type,
    REMOVE_FILES_FROM_PROJECT,
    'returns type'
  );
  t.equal(
    removeFilesFromProject(FILES_FIXTURE).files,
    FILES_FIXTURE,
    'passes files param'
  );
  t.end();
});

tape('project :: set project', t => {
  t.equal(setProject().type, SET_PROJECT, 'returns type');
  t.equal(
    setProject(PROJECT_FIXTURE).project,
    PROJECT_FIXTURE,
    'sets project param'
  );
  t.end();
});

tape('project :: reducer', t => {
  const filesToAdd = [{
    filename: 'rage2.jpg',
  }, {
    filename: 'mindblown.gif',
  }];

  t.equal(projectReducer(), null, 'defaults to null');
  t.equal(
    projectReducer(null, removeFilesFromProject()),
    null,
    'returns null when project is not set'
  );
  t.deepEqual(
    projectReducer(null, setProject(PROJECT_FIXTURE)),
    PROJECT_FIXTURE,
    'sets project'
  );
  t.equal(
    projectReducer(PROJECT_FIXTURE, setProject()),
    null,
    'clears project'
  );
  t.deepEqual(
    projectReducer(
      PROJECT_FIXTURE,
      addFilesToProject(JSON.stringify(filesToAdd))
    ).files,
    FILES_FIXTURE.concat(filesToAdd),
    'adds files to project'
  );

  console.log(projectReducer( // eslint-disable-line no-console
    PROJECT_FIXTURE,
    addFilesToProject(JSON.stringify(FILES_FIXTURE[1]))
  ));

  t.deepEqual(
    projectReducer(
      PROJECT_FIXTURE,
      addFilesToProject(JSON.stringify(FILES_FIXTURE[0]))
    ),
    PROJECT_FIXTURE,
    'doesn’t add already existing files'
  );

  t.deepEqual(
    projectReducer(
      Object.assign({}, PROJECT_FIXTURE, {
        files: PROJECT_FIXTURE.files.concat(filesToAdd),
      }),
      removeFilesFromProject(filesToAdd)
    ),
    PROJECT_FIXTURE,
    'removes files from project'
  );
  t.end();
});
