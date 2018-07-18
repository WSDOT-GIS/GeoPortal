import { GeoJsonObject } from "geojson";
import { IGeoJsonExportEvent } from "./GeoJsonExportEvent";

window.addEventListener("geojsonexport", e => {
  const evt = e as CustomEvent<GeoJsonObject>;
  const geojson = evt.detail;
  const text = JSON.stringify(geojson);
  const textarea = window.document.querySelector("textarea")!;
  textarea.value = text;
  textarea.select();
});
