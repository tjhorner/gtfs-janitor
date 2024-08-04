# Import Profile Schema

The import profile tells GTFS Janitor how to work with your transit agency's specific GTFS data and how that data should be conflated with OSM data. It can be provided as either YAML or JSON.

You can host it on something like [GitHub Gist](https://gist.github.com/) and provide the URL so others can use it.

If you need to customize an aspect of GTFS Janitor that isn't covered by the profile schema, please open an issue. Thanks!

## Examples

Here is an example file for King County Metro GTFS data:

```yaml
name: "King County Metro (Washington, USA)"

candidateNodeFilter: |
  (
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
  )
 
disusedStopFilter: |
  $contains($v.tags.operator, "King County Metro") or
  $contains($v.tags.network, "King County Metro")

stopTags:
  operator: "King County Metro"
  operator:short: "KCM"
  operator:wikidata: "Q6411393"
  operator:wikipedia: "en:King County Metro"
  gtfs:feed: "US-WA-KCM"
```

## Fields

### `name`

A descriptive name for the profile, usually the name of the transit agency.

### `candidateNodeFilter`

A [JSONata](https://jsonata.org/) expression that will be used to filter out the nodes that GTFS Janitor will consider as candidates for stop matching. This expression should return `true` for nodes that are potential stops and `false` for nodes that are not.

The expression is evaluated against each node in the OSM data and should return `true` for nodes that are potential stops and `false` for nodes that are not. The node object is available as `$v`. Here is an example of the data that will be passed to the expression:

```json
{
  "type": "node",
  "id": 335044282,
  "lat": 47.6241100,
  "lon": -122.1322715,
  "timestamp": "2023-06-13T00:37:09Z",
  "version": 9,
  "changeset": 137263816,
  "user": "cyjocriu",
  "uid": 15498746,
  "tags": {
    "bench": "yes",
    "bin": "yes",
    "bus": "yes",
    "gtfs:dataset_id": "KCGIS",
    "gtfs:stop_id": "68780",
    "highway": "bus_stop",
    "name": "156th Ave NE & NE 15th St",
    "network": "King County Metro",
    "network:wikidata": "Q6411393",
    "network:wikipedia": "en:King County Metro",
    "operator": "King County Metro",
    "public_transport": "platform",
    "ref": "68780",
    "shelter": "yes",
    "source": "King County GIS"
  }
}
```

#### Example

Here's a simple example which filters by the `operator` tag:

```jsonata
$contains($v.tags.operator, "King County Metro")
```

### `disusedStopFilter`

_Optional_

A [JSONata](https://jsonata.org/) expression that will be used to filter out the nodes that GTFS Janitor will consider as candidates for disused stops. It is passed a list of nodes that have already been filtered for stop ID existence. Usually you will want this to be similar to your `candidateNodeFilter` but more strict to avoid marking too many stops as disused.

The expression is evaluated against each node in the OSM data and should return `true` for nodes that are potential disused stops and `false` for nodes that are not. All other details are the same as `candidateNodeFilter`.

### `stopTags`

A mapping of tags that should be added to the bus stop nodes that GTFS Janitor creates or modifies.

> [!WARNING]  
> It is recommended to quote tag values in the YAML file. YAML parsers may interpret values such as `yes` and `no` as actual boolean values, not strings, so it's best to be explicit.

You can use a [Nunjucks](https://mozilla.github.io/nunjucks/) template in your values to reference the GTFS stop fields. For example, `{{ stop_id }}` will be replaced with the value of the `stop_id` field in the GTFS data. This allows you to, for example, normalize the stop name with a filter or add a prefix to the stop code. The available fields will vary based on the GTFS data you are working with; see the [GTFS stops.txt reference](https://gtfs.org/schedule/reference/#stopstxt) for more information.

Note that the node will already have the following tags by default, so you don't need to include them yourself:

- `public_transport=platform`
- `highway=bus_stop`
- `name={{ stop_name }}`
- `ref={{ stop_code }}`
- `gtfs:stop_id={{ stop_id }}`
- `wheelchair=yes/no`

But if you want to override any, you can include them in the `stopTags`.

#### Example

Normalize stop name with the [title](https://mozilla.github.io/nunjucks/templating.html#title) filter and include the `website` tag:

```yaml
stopTags:
  name: "{{ stop_name | title }}"
  website: "https://example.com/stops/{{ stop_id }}"
```
