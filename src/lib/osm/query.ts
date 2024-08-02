import { queryOverpass } from "./overpass"

export async function getBusElementsInBbox(bbox: string) {
  const overpassResult = await queryOverpass(`
    [out:json][bbox:${bbox}][timeout:60];

    node[~"^(.+:)?highway$"~"^bus_stop$"]->.busStops;
    way(bn.busStops)["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service"]->.roadWaysWithStops;
    node(w.roadWaysWithStops)->.stopsOnRoadWays;

    (.busStops; - .stopsOnRoadWays;);

    out meta;
  `)

  return overpassResult.elements
}