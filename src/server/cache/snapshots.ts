const snapshotStore = new Map<string, { data: unknown; storedAt: number }>()

export function rememberSnapshot<T>(key: string, data: T) {
  snapshotStore.set(key, {
    data,
    storedAt: Date.now(),
  })

  return data
}

export function readSnapshot<T>(key: string, maxAgeMs = 1000 * 60 * 60 * 24) {
  const snapshot = snapshotStore.get(key)

  if (!snapshot) {
    return null
  }

  if (Date.now() - snapshot.storedAt > maxAgeMs) {
    snapshotStore.delete(key)
    return null
  }

  return snapshot.data as T
}
