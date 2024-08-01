# GTFS Janitor

![screenshot of UI](https://github.com/user-attachments/assets/afabf1bd-ba7f-47b7-9231-d096fe9b1a36)

This is a web-based tool for syncing GTFS feeds with OpenStreetMap data. It performs matching of GTFS stops to nodes in OSM and assists users in resolving ambiguous matches. After import, it will provide an osmChange file that can be reviewed in an external editor.

It was built to facilitate [this import](https://wiki.openstreetmap.org/wiki/Automated_edits/tjhorner-import) and currently only works with King County Metro GTFS data, but it will be generalized in the future to work with other transit feeds.

You can try it out [here](https://gtfs-janitor.tjhorner.dev/). (King County Metro's GTFS feed is available [here](https://www.soundtransit.org/GTFS-KCM/google_transit.zip).)

## Feedback

This project is in a very early stage, so feedback from the OpenStreetMap community is very much appreciated. If you encounter a problem (e.g., data integrity issue, crash/bug, etc.) or have a suggestion (e.g., tag improvements, etc.), please [check the repo issues](https://github.com/tjhorner/gtfs-janitor/issues) and open one if it doesn't already exist.

You may also discuss the project in the [OpenStreetMap World](https://discord.gg/openstreetmap) Discord. I am active there as `tjhorner`, and you can find me in channels like `#developer`, `#mapping-projects`, and `#imports`. When in doubt, you can just go ahead and ping me in `#general`.

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
- Architectural improvements
  - The project only has a very loose structure that will be difficult to refactor in the future. More thought should be put into the architecture so it is easier to maintain and extend.

## License

MIT
