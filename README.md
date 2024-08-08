# GTFS Janitor

![screenshot of UI](https://github.com/user-attachments/assets/870c497d-c493-42ba-a6f2-6c5269918334)

This is a web-based tool for syncing GTFS feeds with OpenStreetMap data. It performs [conflation](https://wiki.openstreetmap.org/wiki/Conflation) of GTFS stops and nodes in OSM, then assists users in resolving ambiguous matches. After import, it will provide an osmChange file that can be reviewed in an external editor.

You can configure it to work with your transit agency's GTFS feed by writing an import profile. You can learn more about import profiles in [the documentation](docs/import-profile.md).

You can try it out [here](https://gtfs-janitor.tjhorner.dev/). (To quickly demo it, you can use [King County Metro's GTFS feed](https://www.soundtransit.org/GTFS-KCM/google_transit.zip).)

## Feedback

This project is in a very early stage, so feedback from the OpenStreetMap community is very much appreciated. If you encounter a problem (e.g., data integrity issue, crash/bug, etc.) or have a suggestion (e.g., tag improvements, UX enhancements, algorithm adjustments, etc.), please [check the repo issues](https://github.com/tjhorner/gtfs-janitor/issues) and open one if it doesn't already exist.

You may also discuss the project in the [OpenStreetMap World](https://discord.gg/openstreetmap) Discord. I am active there as `tjhorner`, and you can find me in channels like `#developer`, `#mapping-projects`, and `#imports`. When in doubt, you can just go ahead and ping me in `#general`.

## Future Improvements

- Route matching
  - Match GTFS routes/route masters to OSM relations
  - Include bus stop nodes in relations
  - Include route ways in relations using map matching techniques
- Better PTv2 compatibility
  - Support for separately-mapped `public_transport=platform` ways
  - Support for `public_transport=stop_area` relations
- Architectural improvements
  - The project only has a very loose structure that will be difficult to refactor in the future. More thought should be put into the architecture so it is easier to maintain and extend.
  - There are currently no automated tests. This is important especially for the matching algorithm; we should write tests in order to maintain data integrity and prevent regressions.

## License

MIT
