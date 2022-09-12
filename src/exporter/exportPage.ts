import { IExportedFeatureCollection } from "./exportUtils";

const exportPropName = "geoportal_export";

// This is the main element where programmatically generated HTML elements will be added.
const mainElement = document.querySelector("main")!;

window.addEventListener("load", (ev) => {
  const geojson = localStorage.getItem(exportPropName);
  if (geojson) {
    addGeoJsonToTextArea(geojson);
  } else {
    alert("Unable to load GeoJSON from local storage.");
  }
});

function addGeoJsonToTextArea(json: string) {
  const frag = document.createDocumentFragment();
  const geojson = JSON.parse(json) as IExportedFeatureCollection[];
  // Loop through each feature collection from the returned array.
  for (const featureCollection of geojson) {
    // Convert each feature collection to a JSON string, then
    // add to a new text box.
    const div = document.createElement("div");
    div.classList.add("text-container");
    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.value = json;
    div.appendChild(textarea);
    frag.appendChild(div);
  }
  mainElement.appendChild(frag);
}
