import Dexie from 'dexie';

const db = new Dexie('coinstac');

db.version(2).stores({
  collections: '++id',
  associatedConsortia: 'id',
});

db.version(2).stores({
  collections: '++id',
  associatedConsortia: '++id, consortiumId',
});

db.version(1).stores({
  collections: '++id',
});

export default db;
