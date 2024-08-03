import type { ImportProfile } from ".."

export const kcmProfile: ImportProfile = {
  name: "King County Metro (Washington, USA)",
  candidateNodeFilter:
  `(
    $not($exists($v.tags.public_transport)) or
    $v.tags.public_transport != "stop_position"
  ) and
  (
    $not($exists($v.tags.operator)) or
    $contains($v.tags.operator, "King County Metro") or
    $contains($v.tags.network, "King County Metro")
  ) and
  (
    $v.tags.bus = "yes" or
    $v.tags.highway = "bus_stop" or
    $v.tags."disused:highway" = "bus_stop"
  )`,
  disusedStopFilter:
  `$contains($v.tags.operator, "King County Metro") or
  $contains($v.tags.network, "King County Metro")`,
  stopTags: {
    "bus": "yes",
    "network": "King County Metro",
    "network:short": "KCM",
    "network:wikidata": "Q6411393",
    "network:wikipedia": "en:King County Metro",
    "operator": "King County Metro",
    "operator:short": "KCM",
    "operator:wikidata": "Q6411393",
    "operator:wikipedia": "en:King County Metro",
    "gtfs:feed": "US-WA-KCM"
  }
}