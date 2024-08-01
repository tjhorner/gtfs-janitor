import { queryOverpass } from "./overpass"

export async function getBusElementsInBbox(bbox: string) {
  const overpassResult = await queryOverpass(`
    [out:json][bbox:${bbox}][timeout:120];

    (
      nw["public_transport"="platform"];<;
      nw["highway"="bus_stop"];<;
      nw["disused:highway"="bus_stop"];
      nw["amenity"="bus_station"];
      nw["disused:amenity"="bus_station"];
    );

    out meta;
  `)

  return overpassResult.elements
}