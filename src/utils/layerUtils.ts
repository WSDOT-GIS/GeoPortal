import Graphic = require("esri/graphic");
import FeatureLayer = require("esri/layers/FeatureLayer");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import Layer = require("esri/layers/layer");
import { getProperties } from "./conversionUtils";

/**
 * @module layerUtils
 */

/**
 * Creates a label for a layer based on its URL.
 * @param {esri/layers/Layer} layer - A layer.
 * @returns {string} A label for the layer base on the layer's URL.
 */
export function createLayerNameFromUrl(layer: { url: string }) {
  const svcNameRe = /\/(\w+)\/MapServer/i;
  let output: string | null = null;
  // Get the layer name from the URL.
  if (layer && layer.url) {
    const match = layer.url.match(svcNameRe);
    if (match) {
      output = match[1];
    }
  }
  const re = /([a-z])([A-Z])([a-z])/g;
  if (output) {
    output = output.replace(re, "$1 $2$3");
    output = output.replace("_", " ");
  }
  return output;
}

/**
 * Gets a set of unique field names of a layer.
 * @param layer Graphics Layer or Feature Layer
 */
function getFieldNames(layer: FeatureLayer | GraphicsLayer) {
  if (layer instanceof FeatureLayer) {
    return new Set(layer.fields.map(f => f.name));
  }

  const output = new Set<string>();
  for (const attributes of layer.graphics.map(g => g.attributes)) {
    for (const name in attributes) {
      if (attributes.hasOwnProperty(name)) {
        output.add(name);
      }
    }
  }
  return output;
}

/**
 * Creates a table displaying the attributes of features in a layer.
 * @param layer A graphics or feature layer
 */
export function featureAttributesToTable(
  doc: Document,
  graphics: Graphic[],
  tableName: string,
  omitData?: boolean
) {
  const table = document.createElement("table");
  table.createCaption().textContent = tableName;
  const thead = table.createTHead();
  const tbody = table.createTBody();

  const fieldNames = getDistinctAttributeNames(graphics);

  // Create the table header row.
  let row = thead.insertRow(-1);

  for (const field of fieldNames) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = field;
    cell.dataset.fieldName = field;
    row.appendChild(cell);
  }

  for (const attributes of graphics.map(g => g.attributes)) {
    row = tbody.insertRow(-1);
    for (const fieldName of fieldNames) {
      const value = attributes[fieldName];
      const cell = row.insertCell(-1);
      cell.textContent = value;
    }
  }

  return table;
}

function groupFeaturesByLayer(graphics: Graphic[]) {
  const output = new Map<Layer, Graphic[]>();
  for (const g of graphics) {
    const layer = g.getLayer() || ((g as any).layer as Layer);
    if (!layer) {
      // tslint:disable-next-line:no-console
      console.warn("graphic has no associated layer", g);
      continue;
    }
    let arr: Graphic[];
    if (output.has(layer)) {
      arr = output.get(layer)!;
    } else {
      arr = new Array<Graphic>();
      output.set(layer, arr);
    }
    arr.push(g);
  }
  return output.size ? output : null;
}

function getDistinctAttributeNames(graphics: Graphic[]) {
  const fieldNames = new Set<string>();
  for (const g of graphics) {
    const { attributes } = g;
    for (const name in attributes) {
      if (attributes.hasOwnProperty(name)) {
        fieldNames.add(name);
      }
    }
  }
  return fieldNames;
}

/**
 * Creates HTML tables displaying the attributes of the input graphics.
 * @param doc A Document element.
 * @param graphics An array of Graphics.
 * @returns Returns a document fragment containing table elements.
 */
export function graphicsToTables(doc: Document, graphics: Graphic[]) {
  const groupedGraphics = groupFeaturesByLayer(graphics);
  if (!groupedGraphics) {
    return null;
  }
  const frag = doc.createDocumentFragment();

  for (const [layer, gArray] of groupedGraphics.entries()) {
    const table = featureAttributesToTable(doc, gArray, layer.id, false);
    frag.appendChild(table);
  }

  return frag;
}
