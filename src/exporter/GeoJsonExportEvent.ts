import { GeoJsonObject } from "geojson";

export interface IGeoJsonExportEvent extends CustomEvent<GeoJsonObject> {}
