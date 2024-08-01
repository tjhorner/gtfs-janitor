# GTFS Janitor

![screenshot of UI](https://github.com/user-attachments/assets/afabf1bd-ba7f-47b7-9231-d096fe9b1a36)

This is a web-based tool for syncing GTFS feeds with OpenStreetMap data. It performs matching of GTFS stops to nodes in OSM and assists users in resolving ambiguous matches. After import, it will provide an osmChange file that can be reviewed in an external editor.

It was built to facilitate [this import](https://wiki.openstreetmap.org/wiki/Automated_edits/tjhorner-import) and currently only works with King County Metro GTFS data, but it will be generalized in the future to work with other transit feeds.

You can try it out [here](https://gtfs-janitor.tjhorner.dev/). (King County Metro's GTFS feed is available [here](https://www.soundtransit.org/GTFS-KCM/google_transit.zip).)

## Future Improvements

- Route matching
  - Match GTFS routes/route masters to OSM relations
  - Include bus stop nodes in relations
  - Include route ways in relations using map matching technniques
  - Add `route_ref` to bus stops
- Better PTv2 compatibility
  - Support for separately-mapped `public_transport=platform` ways
  - Support for `public_transport=stop_area` relations
- Generalization for other GTFS feeds

## License

MIT
