import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data');

if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

function getFilePath(collection: string) {
  return path.join(DB_PATH, `${collection}.json`);
}

export const db = {
  read: <T>(collection: string): T[] => {
    const file = getFilePath(collection);
    if (!fs.existsSync(file)) return [];
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      return [];
    }
  },

  write: <T>(collection: string, data: T[]) => {
    const file = getFilePath(collection);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  },
  
  // Upsert helper
  save: <T extends { id: string }>(collection: string, item: T) => {
    const items = db.read<T>(collection);
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
      items[index] = { ...items[index], ...item };
    } else {
      items.push(item);
    }
    db.write(collection, items);
    return item;
  }
};