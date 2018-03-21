import { IG2MOutput, IM2GOutput } from "@wsdot/arcgis-rest-lrs";
import {
  Point as IRestPoint,
  Polyline as IRestPolyline
} from "arcgis-rest-api";
import geometryJsonUtils = require("esri/geometry/jsonUtils");
import Point = require("esri/geometry/Point");
import Polyline = require("esri/geometry/Polyline");
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

export function addNamedControlsToElement(
  root: HTMLElement | DocumentFragment,
  elements: {
    [name: string]: HTMLInputElement;
  }
) {
  for (const name in elements) {
    if (elements.hasOwnProperty(name)) {
      const element = elements[name];
      addToFormWithLabel(root, element, name);
    }
  }
}

export function addToFormWithLabel(
  form: HTMLElement | DocumentFragment,
  control: HTMLInputElement,
  labelText?: string
) {
  const label = document.createElement("label");
  label.htmlFor = control.id;
  label.textContent = labelText || splitName(control.name);
  form.appendChild(label);
  form.appendChild(control);
  return label;
}

/**
 * Converts output from the geometryToMeasure operation into
 * an array of Graphic objects.
 * @param g2mOutput Output from geometryToMeasure operation.
 */
export function* IterateG2MOutputToFeatures(g2mOutput: IG2MOutput) {
  const format = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3
  });
  const { locations, spatialReference } = g2mOutput;
  const sr = new SpatialReference(spatialReference);
  for (const loc of locations) {
    const { results, status } = loc;
    for (const r of results) {
      const { routeId, measure, geometry, geometryType } = r;
      const attributes = { status, routeId, measure };
      const point = new Point(geometry.x, geometry.y, sr);
      // const symbol = new TextSymbol(`${routeId} @ ${format.format(measure)}`);
      const graphic = new Graphic({ geometry: point, attributes });
      yield graphic;
    }
  }
}

function* flattenPathsToPoints(paths: number[][][]) {
  for (const path of paths) {
    for (const point of path) {
      yield point;
    }
  }
}

export function* m2gOutputToFeatures(m2gOutput: IM2GOutput) {
  const { locations, spatialReference } = m2gOutput;

  const sro = new SpatialReference(spatialReference);

  for (const loc of locations) {
    const { routeId, status } = loc;
    if (loc.geometryType === "esriGeometryPoint") {
      const { x, y, m } = loc.geometry as IRestPoint;
      const geometry = new Point(x, y, sro);
      const attributes = {
        routeId,
        status,
        measure: m
      };
      yield new Graphic({ geometry, attributes });
    } else if (loc.geometryType === "esriGeometryPolyline") {
      const { paths, hasM } = loc.geometry as IRestPolyline;
      const geometry = new Polyline(paths);
      const points = flattenPathsToPoints(paths);

      geometry.setSpatialReference(sro);
    } else {
      throw TypeError(`Unexpected geometry type: ${loc.geometryType}`);
    }
    // const geometry = geometryJsonUtils.fromJson(loc.geometry);
    // const attributes = { routeId: loc.routeId, measure: loc.status };
    // const feature = new Graphic(geometry, undefined, attributes);
    // yield feature;
  }
}
