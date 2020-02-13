import Dexie from 'dexie';

Dexie.delete('coinstac');
const db = new Dexie('coinstac');

db.version(1).stores({
  collections: '++id',
});

db.version(2).stores({
  collections: '++id',
  associatedConsortia: 'id',
});

db.version(3).stores({
  collections: '++id',
  associatedConsortia: 'id',
  runs: 'id',
});

db.version(4).stores({
  collections: '++id',
  associatedConsortia: 'id',
  runs: 'id,type',
});

db.version(5).stores({
  collections: '++id',
  associatedConsortia: 'id,activePipelineId',
  runs: 'id,type',
});

db.version(6).stores({
  runs: 'id, type',
  maps: '[consortiumId+pipelineId], consortiumId',
});

export default db;
