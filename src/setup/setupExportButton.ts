import { arcgisToGeoJSON } from "@esri/arcgis-to-geojson-utils";
import Button = require("dijit/form/Button");
import {
  canProject,
  webMercatorToGeographic
} from "esri/geometry/webMercatorUtils";
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import EsriMap = require("esri/map");
import SpatialReference from "esri/SpatialReference";
import { FeatureCollection } from "geojson";

function layerToGeoJsonFeatureCollection(
  layer: GraphicsLayer
): FeatureCollection {
  const mapWkid = 3857;
  const outWkid = 4326;
  const outSR = new SpatialReference(outerWidth);
  const features = layer.graphics.map(g => {
    const graphic = g.clone();
    // Project from map spatial reference to WGS 84.
    const projectedGeometry = webMercatorToGeographic(g.geometry);
    graphic.geometry = projectedGeometry;
    // Convert to GeoJSON feature.
    const output = arcgisToGeoJSON(graphic as any) as any;
    return output as GeoJSON.Feature;
  });
  return {
    type: "FeatureCollection",
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
      .map(layerToGeoJsonFeatureCollection);

    if (featureSets.length < 1) {
      alert("No features to export");
      return;
    }

    const json = JSON.stringify(featureSets);
    const url = `https://mapbox.github.io/geojson.io#data=data:application/json,${encodeURIComponent(
      json
    )}`;
    window.open(url, "_blank");
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
