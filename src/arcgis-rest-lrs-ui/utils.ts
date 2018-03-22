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
import CountyLookup from "./CountyLookup";
import { parseCrabRouteId } from "./crabUtils";

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

// function getStartAndEndMeasures(paths: number[][][]) {
//   const iterator = flattenPathsToPoints(paths);
//   const array = new Array<number>();
//   let current = iterator.next();
//   while (!current.done) {
//     if (current.value && current.value.m != null) {
//       array.push(current.value.m as number);
//     }
//     current = iterator.next();
//   }
//   return [array[0], array[array.length - 1]];
// }

export function* m2gOutputToFeatures(m2gOutput: IM2GOutput) {
  const { locations, spatialReference } = m2gOutput;

  const sro = new SpatialReference(spatialReference);

  for (const loc of locations) {
    const { routeId, status } = loc;
    const { countyFipsCode, direction, roadNumber } = parseCrabRouteId(routeId);
    const county = CountyLookup.get(countyFipsCode);
    if (loc.geometryType === "esriGeometryPoint") {
      const { x, y, m } = loc.geometry as IRestPoint;
      const geometry = new Point(x, y, sro);
      const attributes = {
        routeId,
        status,
        county,
        direction,
        roadNumber,
        measure: m
      };
      yield new Graphic({ geometry, attributes });
    } else {
      const { paths, hasM } = loc.geometry as IRestPolyline;
      const geometry = geometryJsonUtils.fromJson(loc.geometry);
      geometry.setSpatialReference(sro);
      // const measures = getStartAndEndMeasures(paths);
      const attributes = {
        routeId,
        status,
        county,
        direction,
        roadNumber
        // beginMeasure: measures && measures.length > 0 ? measures[0] : null,
        // endMeasure: measures && measures.length > 1 ? measures[1] : null
      };
      yield new Graphic({ geometry, attributes });
    }
  }
}
