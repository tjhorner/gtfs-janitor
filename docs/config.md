# Import Config Format

The import config file tells GTFS Janitor how to work with your transit agency's specific GTFS data and how that data should be mapped on OpenStreetMap. It can be provided as either YAML or JSON.

You can host the config file on something like [GitHub Gist](https://gist.github.com/) and provide the URL so others can use it.

If you need to customize an aspect of GTFS Janitor that isn't covered by the config file, please open an issue. Thanks!

## Examples

Here is an example file for King County Metro GTFS data:

```yaml
name: "King County Metro (Washington, USA)"

candidateNodeFilter: |
  (
    $not($exists($v.tags.public_transport)) or
    $v.tags.public_transport != "stop_position"
  )
    and
  (
    $not($exists($v.tags.operator)) or
    $contains($v.tags.operator, "King County Metro") or
    $contains($v.tags.network, "King County Metro")
  )
    and
  (
    $v.tags.bus = "yes" or
    $v.tags.highway = "bus_stop" or
    $v.tags."disused:highway" = "bus_stop"
  )
 
disusedStopFilter: |
  $contains($v.tags.operator, "King County Metro") or
  $contains($v.tags.network, "King County Metro")

stopTags:
  bus: "yes"
  network: "King County Metro"
  network:short: "KCM"
  network:wikidata: "Q6411393"
  network:wikipedia: "en:King County Metro"
  operator: "King County Metro"
  operator:short: "KCM"
  operator:wikidata: "Q6411393"
  operator:wikipedia: "en:King County Metro"
  gtfs:feed: "US-WA-KCM"
```

## Fields

### `name`

A descriptive name for the config, usually the name of the transit agency.

### `candidateNodeFilter`

A [JSONata](https://jsonata.org/) expression that will be used to filter out the nodes that GTFS Janitor will consider as candidates for stop matching. This expression should return `true` for nodes that are potential stops and `false` for nodes that are not.

The expression is evaluated against each node in the OSM data.

### `disusedStopFilter`

A [JSONata](https://jsonata.org/) expression that will be used to filter out the nodes that GTFS Janitor will consider as candidates for disused stops. Usually you will want this to be similar to your `candidateNodeFilter` but more strict to avoid marking too many stops as disused.

The expression is evaluated against each node in the OSM data.

### `stopTags`

A mapping of tags that should be added to the bus stop nodes that GTFS Janitor creates or modifies.

> [!WARNING]  
> It is recommended to quote tag values in the YAML file. YAML parsers may interpret values such as `yes` and `no` as actual boolean values, not strings, so it's best to be explicit.

You can use a [mustache](https://mustache.github.io/) template to reference the GTFS stop fields. For example, `{{ stop_id }}` will be replaced with the value of the `stop_id` field in the GTFS data.
