import localforage from "localforage"
import Mutex from "p-mutex"
import { writable } from "svelte/store"

export function makeLocalForageStore<T>(key: string) {
  const mutex = new Mutex()
  const store = writable<T | null>(null)

  localforage.getItem<T>(key).then(value => {
    store.set(value)

    store.subscribe(value => {
      if (value === null) {
        mutex.withLock(() => localforage.removeItem(key))
      } else {
        mutex.withLock(() => localforage.setItem(key, value))
      }
    })
  })

  return store
}