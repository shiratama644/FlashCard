import Dexie from 'dexie';

export const db = new Dexie("FlashcardDB");
db.version(1).stores({
  categories: 'id',
  tags: 'id',
  projects: 'id'
});