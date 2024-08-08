import { queryOverpass } from "./overpass"

export async function getStopElementsInBbox(bbox: string) {
  const overpassResult = await queryOverpass(`
    [out:json][bbox:${bbox}][timeout:60];

    (
      node[~"^(.+:)?highway$"~"^bus_stop$"];
      node[~"^(.+:)?railway$"~"^tram_stop$"];
      node[~"^(.+:)?amenity$"~"^ferry_terminal$"];
      node[~"bus|tram|ferry|trolleybus"~"^yes$"];
    )->.ptStops;

    way(bn.ptStops)["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service"]->.roadWaysWithStops;
    node(w.roadWaysWithStops)->.stopsOnRoadWays;

    (.ptStops; - .stopsOnRoadWays;);

    out meta;
  `)

  return overpassResult.elements
}