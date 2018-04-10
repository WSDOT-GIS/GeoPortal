import { Feature, FeatureSet } from "arcgis-rest-api";
import Button = require("dijit/form/Button");
import FeatureLayer = require("esri/layers/FeatureLayer");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import EsriMap = require("esri/map");

function layerToFeatureSet(layer: GraphicsLayer): FeatureSet {
  // If the input is a FeatureLayer, use the built-in toJson function of that class.
  if (layer instanceof FeatureLayer) {
    return layer.toJson() as FeatureSet;
  }

  const features = layer.graphics.map(g => g.toJson() as Feature);
  return {
    features
  };
}

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
   * Exports the features on the map to JSON, then
   * dumps the JSON string to a new window.
   */
  function exportFeatures() {
    const featureSets = map.graphicsLayerIds
      .map(id => map.getLayer(id) as GraphicsLayer)
      .filter(gl => gl.graphics.length > 0)
      .map(layerToFeatureSet);

    if (featureSets.length < 1) {
      alert("No features to export");
      return;
    }

    const json = JSON.stringify(featureSets);
    const url = "blank.html";
    const newWindow = window.open(url, "_blank");

    if (newWindow) {
      const doc = document.implementation.createHTMLDocument(
        "exported features"
      );

      const pre = doc.createElement("pre");
      pre.textContent = json;
      doc.body.appendChild(pre);
      newWindow.document.write(
        "<!DOCTYPE html>" + doc.documentElement.outerHTML
      );
      newWindow.document.close();
      newWindow.focus();
    } else {
      alert("Couldn't open new window");
    }
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
