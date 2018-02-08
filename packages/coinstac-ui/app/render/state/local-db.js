import Dexie from 'dexie';

const db = new Dexie('coinstac');

db.version(4).stores({
  collections: '++id',
  associatedConsortia: 'id',
  runs: 'id,type',
});

db.version(3).stores({
  collections: '++id',
  associatedConsortia: 'id',
  runs: 'id',
});

db.version(2).stores({
  collections: '++id',
  associatedConsortia: 'id',
});

db.version(1).stores({
  collections: '++id',
});

export default db;
