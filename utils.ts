import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import { Low, JSONFile } from 'lowdb'

import type { PlainDBType } from './get.js'

export const __dirname = dirname(fileURLToPath(import.meta.url))

export const getPlainDataDB = getDB<PlainDBType>('data/plain.json')

function getDB<T>(fileName: string) {
  let db: Low<T>

  return function _getDB() {
    if (db) return db

    const file = path.resolve(__dirname, fileName)
    const adapter = new JSONFile<T>(file)
    db = new Low<T>(adapter)

    return db
  }
}
