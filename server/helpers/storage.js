import { access, mkdir, stat, writeFile } from 'node:fs/promises';

export const initStorage = async () => {
  try {
    const storageStat = await stat('./storage');
    if(!storageStat.isDirectory()) {
      console.error(new Error('Storage path is not directory'));
      process.exit(1);
    }
  } catch {
    await mkdir('./storage');
  }
};

export const storageExists = async name => {
  try {
    await access('./storage/' + name);
    return true
  } catch {
    return false;
  }
};

export const storageSave = async (name, content) => {
  await writeFile('./storage/' + name, content);
};