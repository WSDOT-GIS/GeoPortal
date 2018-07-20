import { IExportedFeatureCollection } from "./exportUtils";

// This is the main element where programmatically generated HTML elements will be added.
const mainElement = document.querySelector("main")!;

// Main page will send this event to this page.
window.addEventListener("geojsonexport", e => {
  // Put the GeoJSON text into the textarea.
  const evt = e as CustomEvent<{ geojson: IExportedFeatureCollection[] }>;
  const { geojson } = evt.detail;

  // Create a document fragment. Elements will be added here,
  // then the fragment will be added to the main element.
  const frag = document.createDocumentFragment();
  // Loop through each feature collection from the returned array.
  for (const featureCollection of geojson) {
    // Convert each feature collection to a JSON string, then
    // add to a new text box.
    const json = JSON.stringify(featureCollection);
    const div = document.createElement("div");
    div.classList.add("text-container");
    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.value = json;

    div.appendChild(textarea);
    frag.appendChild(div);
  }

  mainElement.appendChild(frag);
});
