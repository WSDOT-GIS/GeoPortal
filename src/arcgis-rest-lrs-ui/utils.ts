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
 *
 * @param mapServiceUrl URL to map service or feature service
 * @param layerId Layer ID
 * @param endpointName The name of the operation. E.g., "measureToGeometry".
 * @throws Error Throws an error if the mapServiceUrl is not in the correct format.
 */
export function getLrsServerEndpointUrl(
  mapServiceUrl: string,
  layerId: number,
  endpointName: "geometryToMeasure" | "measureToGeometry" | string
) {
  const urlRe = /^(?:https?:)?\/\/.+\/(Map|Feature)Server\b/i;
  const match = mapServiceUrl.match(urlRe);
  if (!match) {
    throw Error(`URL is not in expected format: "${mapServiceUrl}".`);
  }
  return `${mapServiceUrl}/exts/LRSServer/${layerId}/${endpointName}`;
}

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
    [name: string]: HTMLInputElement | HTMLSelectElement;
  }
) {
  const labels: {
    [key: string]: HTMLLabelElement;
  } = {};
  for (const name in elements) {
    if (elements.hasOwnProperty(name)) {
      const element = elements[name];
      const label = addToFormWithLabel(root, element, name);
      labels[name] = label;
    }
  }
  return labels;
}

export function addToFormWithLabel(
  form: HTMLElement | DocumentFragment,
  control: HTMLInputElement | HTMLSelectElement,
  labelText?: string
) {
  const label = document.createElement("label");
  label.htmlFor = control.id;
  label.textContent = labelText || splitName(control.name);
  if (control.required) {
    label.classList.add("required");
  }
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

// export type PointCoords =
//   | [number, number, number | null, number | null]
//   | [number, number, number | null]
//   | [number, number];

function* flattenPathsToPoints(paths: number[][][]) {
  for (const path of paths) {
    for (const point of path) {
      const [x, y] = point;
      const z = point.length > 2 ? point[2] : null;
      const m = point.length > 3 ? point[3] : null;
      yield { x, y, z, m };
    }
  }
}

function getStartAndEndMeasures(
  polyline: IRestPolyline
): [number | null, number | null] {
  if (!polyline.hasM) {
    return [null, null];
  }

  const beginM = polyline.paths[0][0][3] || null;
  const lastPath = polyline.paths[polyline.paths.length - 1];
  const lastPoint = lastPath[lastPath.length - 1];
  const endM = lastPoint[3] || null;

  return [beginM, endM];
}

/**
 * Allows user to iterate over features of measureToGeometry output
 * as Graphic objects.
 * @param m2gOutput Output of a measure to geometry operation.
 * @example
 * for (const g of m2gOutputToFeatures(m2gOutput)) {
 *    // do something with the output;
 *    if (!g.geometry) {
 *        console.warn("No geometry", g);
 *    } else {
 *        console.log("Geometry found", g);
 *    }
 * }
 */
export function* m2gOutputToFeatures(m2gOutput: IM2GOutput) {
  const { locations, spatialReference } = m2gOutput;

  const sro = new SpatialReference(spatialReference);

  for (const loc of locations) {
    const { routeId, status } = loc;
    if (!loc.geometry) {
      const attributes = {
        routeId,
        status
      };
      yield new Graphic({ attributes });
    } else if (loc.geometryType === "esriGeometryPoint") {
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
      const geometry = geometryJsonUtils.fromJson(loc.geometry);
      geometry.setSpatialReference(sro);
      const [fromMeasure, toMeasure] = getStartAndEndMeasures(
        loc.geometry as IRestPolyline
      );
      const attributes = {
        routeId,
        status,
        fromMeasure,
        toMeasure
      };
      yield new Graphic({ geometry, attributes });
    }
  }
}
