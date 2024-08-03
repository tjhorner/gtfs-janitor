import type { DisambiguationSession } from "$lib/pipeline/disambiguator/session"
import { makeLocalForageStore } from "$lib/util/localforage-store"

export const savedDisambiguationSession = makeLocalForageStore<DisambiguationSession>("disambiguationSession")