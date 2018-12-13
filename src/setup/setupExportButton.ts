// import { IFeature, IFeatureSet } from "@esri/arcgis-rest-common-types";
import Button = require("dijit/form/Button");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import EsriMap = require("esri/map");
import { layerToGeoJsonFeatureCollection } from "../exporter/exportUtils";

/**
 * Adds the Export Graphics button to the toolbar.
 * @param map The ArcGIS JS API map from which graphics / feature layers will be exported.
 */
export function setupExportButton(map: EsriMap) {
  const toolbarDiv = document.getElementById("toolbar") as HTMLDivElement;

  if (!toolbarDiv) {
    throw new Error("Could not find #toolbar element.");
  }

  const exportButton = document.createElement("button");
  exportButton.id = "exportButton";
  exportButton.type = "button";
  exportButton.textContent = "Export";
  exportButton.title = "Export graphics";
  exportButton.classList.add("export-button");

  /**
   * The export button click event handler.
   * Exports the features on the map to GeoJSON,
   * then sends the GeoJSON export form in new window.
   */
  function exportFeatures() {
    const featureSets = map.graphicsLayerIds
      .map(id => map.getLayer(id) as GraphicsLayer)
      .filter(gl => gl.graphics.length > 0)
      .map(layerToGeoJsonFeatureCollection);

    if (featureSets.length < 1) {
      alert("No features to export");
      return;
    }

    const json = JSON.stringify(featureSets);
    const url = "./export/";
    const windowName = "_blank";

    localStorage.setItem("geoportal_export", json);
    const exportWindow = window.open(url, windowName)!;
  }

  toolbarDiv.appendChild(exportButton);

  // Make button a Dojo dijit "Button".

  const buttonDijit = new Button(
    {
      label: "Export Graphics",
      showLabel: false,
      iconClass: "dijitEditorIcon dijitEditorIconSave",
      onClick: exportFeatures
    },
    exportButton.id
  );
  buttonDijit.startup();
}
