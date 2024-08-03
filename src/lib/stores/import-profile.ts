import type { ImportProfile } from "$lib/pipeline/profile"
import { makeLocalForageStore } from "$lib/util/localforage-store"

export const importProfile = makeLocalForageStore<ImportProfile>("importProfile")
