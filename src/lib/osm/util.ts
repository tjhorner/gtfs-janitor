import type { Node } from "./overpass"

export function areTagsDifferent(before: Record<string, string | undefined>, after: Record<string, string | undefined>) {
  const allKeys = new Set([ ...Object.keys(before), ...Object.keys(after) ])
  for (const key of allKeys) {
    if (before[key] !== after[key]) return true
  }

  return false
}

export function areNodesDifferent(before: Node, after: Node) {
  return before.lat !== after.lat || before.lon !== after.lon || areTagsDifferent(before.tags, after.tags)
}
