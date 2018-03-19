import { IG2MOutput } from "@wsdot/arcgis-rest-lrs";
import Point = require("esri/geometry/Point");
import Graphic = require("esri/graphic");
import FeatureLayer = require("esri/layers/FeatureLayer");
import SpatialReference = require("esri/SpatialReference");
import TextSymbol = require("esri/symbols/TextSymbol");

export const defaultLrsMapServiceUrl =
  "https://data.wsdot.wa.gov/arcgis/rest/services/CountyRoutes/CRAB_Routes/MapServer";

export const defaultLrsSvcUrl = `${defaultLrsMapServiceUrl}/exts/LRSServer`;
export const defaultLayerId = 0;

/**
 * Creates a unique ID by appending numbers to the proposed ID until
 * an ID that is not already in use is found.
 * @param id Proposed ID
 */
export function generateId(id: string) {
  let outId = id;
  let i = 0;
  while (document.getElementById(outId)) {
    outId = `${id}${i}`;
    i++;
  }
  return outId;
}

/**
 * Splits a camel- or Pascal-cased name into separate words.
 * @param name camel- or Pascal-cased name
 */
export function splitName(name?: string | null) {
  if (!name) {
    return null;
  }
  const re = /[A-Z]?[a-z]+/g;
  let match = re.exec(name);
  const parts = new Array<string>();
  while (match) {
    const part = match[0].toLowerCase();
    parts.push(part);
    match = re.exec(name);
  }

  return parts.join(" ");
}

export function createCrabRoutesLayer(
  url: string = `${defaultLrsMapServiceUrl}/0`
) {
  const featureLayer = new FeatureLayer(url, {
    id: "CRAB Routes",
    outFields: ["RouteId"]
  });

  return featureLayer;
}

/**
 * Converts output from the geometryToMeasure operation into
 * an array of Graphic objects.
 * @param g2mOutput Output from geometryToMeasure operation.
 */
export function g2mOutputToFeatures(g2mOutput: IG2MOutput) {
  const format = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3
  });
  const { locations, spatialReference } = g2mOutput;
  const sr = new SpatialReference(spatialReference);
  const output = new Array<Graphic>();
  for (const loc of locations) {
    const { results, status } = loc;
    for (const r of results) {
      const { routeId, measure, geometry, geometryType } = r;
      const attributes = { status, routeId, measure };
      const point = new Point(geometry.x, geometry.y, sr);
      const symbol = new TextSymbol(`${routeId} @ ${format.format(measure)}`);
      const graphic = new Graphic(point, symbol, attributes);
      output.push(graphic);
    }
  }
  return output;
}
