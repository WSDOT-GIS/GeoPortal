import { IFeature, IFeatureSet } from "@esri/arcgis-rest-common-types";
import { arcgisToGeoJSON } from "@esri/arcgis-to-geojson-utils";
import { webMercatorToGeographic } from "esri/geometry/webMercatorUtils";
import FeatureLayer from "esri/layers/FeatureLayer";
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import EsriMap = require("esri/map");
import { FeatureCollection } from "geojson";

/**
 * Converts a graphics layer into a GeoJSON FeatureCollection.
 * @param layer A graphics layer or feature layer.
 */
export function layerToGeoJsonFeatureCollection(
  layer: GraphicsLayer
): FeatureCollection {
  const features = layer.graphics.map(g => {
    const graphic = g.clone();
    // Project from map spatial reference to WGS 84.
    const projectedGeometry = webMercatorToGeographic(g.geometry);
    graphic.geometry = projectedGeometry;
    // Convert to GeoJSON feature.
    const output = arcgisToGeoJSON(graphic);
    return output as GeoJSON.Feature;
  });
  return {
    type: "FeatureCollection",
    features
  };
}

/**
 * Gets all of the graphics / feature layers from the map
 * and converts them to GeoJSON equivalents.
 * @param map A map
 * @returns Feature Layers will be returned as Feature Sets,
 * while Graphics layers will be returned as an array of features.
 */
export function* getMapFeatures(map: EsriMap) {
  for (const id of map.layerIds) {
    const gl = map.getLayer(id) as GraphicsLayer;
    if (gl.graphics.length < 0) {
      continue;
    }
    if (gl instanceof FeatureLayer) {
      yield gl.toJson() as IFeatureSet;
    } else {
      yield gl.graphics.map(g => g.toJson() as IFeature);
    }
  }
}
