import localforage from "localforage"
import type { DisambiguationSession } from "./session"
import Mutex from "p-mutex"

const DISAMBIGUATION_SESSION_KEY = "disambiguationSession"
const storageMutex = new Mutex()

export async function saveDisambiguationSession(session: DisambiguationSession) {
  return storageMutex.withLock(() => localforage.setItem(DISAMBIGUATION_SESSION_KEY, session))
}

export async function loadDisambiguationSession(): Promise<DisambiguationSession | null> {
  return storageMutex.withLock(() => localforage.getItem<DisambiguationSession>(DISAMBIGUATION_SESSION_KEY))
}

export async function clearDisambiguationSession() {
  return storageMutex.withLock(() => localforage.removeItem(DISAMBIGUATION_SESSION_KEY))
}