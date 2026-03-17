import Dexie, { type EntityTable } from 'dexie'
import type { SessionRecord } from './types'

interface AppMeta {
  key: string
  value: string
}

export const db = new Dexie('focus-universe-db') as Dexie & {
  sessions: EntityTable<SessionRecord, 'id'>
  meta: EntityTable<AppMeta, 'key'>
}

db.version(1).stores({
  sessions: '++id,startedAt,endedAt,mode,completed',
  meta: '&key',
})

export async function saveSession(record: SessionRecord): Promise<void> {
  await db.sessions.add(record)
}

export async function getSessions(days = 30): Promise<SessionRecord[]> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return db.sessions.where('startedAt').above(cutoff).toArray()
}
