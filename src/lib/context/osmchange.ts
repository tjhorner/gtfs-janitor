import { OsmChangeFile } from "$lib/osm/osmchange"
import { getContext, setContext } from "svelte"

const osmChangeContextName = "osmChange"

export function setOsmChangeContext(osmChange: OsmChangeFile) {
  setContext(osmChangeContextName, osmChange)
}

export function getOsmChangeContext() {
  return getContext<OsmChangeFile>(osmChangeContextName)
}