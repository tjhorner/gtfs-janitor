import type { Node } from "$lib/osm/overpass"
import { makeLocalForageStore } from "$lib/util/localforage-store"

export const stopCandidates = makeLocalForageStore<Node[]>("stopCandidates")
