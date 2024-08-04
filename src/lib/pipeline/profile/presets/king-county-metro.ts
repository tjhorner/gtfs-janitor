import type { ImportProfile } from ".."

export const kcmProfile: ImportProfile = {
  name: "King County Metro (Washington, USA)",
  candidateNodeFilter:
  `(
    (
      $not($exists($v.tags.public_transport)) or
      $v.tags.public_transport != "stop_position"
    )
      or
    (
      $not($exists($v.tags.bus)) or
      $v.tags.bus = "no"
    )
  )
    and
  (
    $not($exists($v.tags.operator)) or
    $contains($v.tags.operator, "King County Metro") or
    $contains($v.tags.network, "King County Metro")
  )`,
  disusedStopFilter:
  `$contains($v.tags.operator, "King County Metro") or
  $contains($v.tags.network, "King County Metro")`,
  stopTags: {
    "operator": "King County Metro",
    "operator:short": "KCM",
    "operator:wikidata": "Q6411393",
    "operator:wikipedia": "en:King County Metro",
    "gtfs:feed": "US-WA-KCM"
  }
}
