import type { ImportConfig } from "$lib/pipeline/config"
import { makeLocalForageStore } from "$lib/util/localforage-store"

export const importConfig = makeLocalForageStore<ImportConfig>("importConfig")
