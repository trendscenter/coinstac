import Dexie from 'dexie';

const db = new Dexie('coinstac');
db.version(1).stores({
  collections: '++id',
});

export default db;
