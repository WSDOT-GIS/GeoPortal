import Graphic = require("esri/graphic");
import FeatureLayer = require("esri/layers/FeatureLayer");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
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
  layer: FeatureLayer | GraphicsLayer,
  omitData?: boolean
) {
  const table = document.createElement("table");
  table.createCaption().textContent = layer.id;
  const thead = table.createTHead();
  const tbody = table.createTBody();

  let fieldNames: Set<string>;

  // Create the table header row.
  let row = thead.insertRow(-1);
  if (layer instanceof FeatureLayer) {
    fieldNames = new Set<string>();
    for (const field of layer.fields) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = field.alias || field.name;
      cell.dataset.fieldName = field.name;
      row.appendChild(cell);
    }
  } else {
    fieldNames = getFieldNames(layer);
    for (const field of fieldNames) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = field;
      cell.dataset.fieldName = field;
      row.appendChild(cell);
    }
  }

  for (const attributes of layer.graphics.map(g => g.attributes)) {
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
  const output = new Map<GraphicsLayer, Graphic[]>();
  for (const g of graphics) {
    const layer = g.getLayer() as GraphicsLayer;
    let arr: Graphic[];
    if (output.has(layer)) {
      arr = output.get(layer)!;
    } else {
      arr = new Array<Graphic>();
      output.set(layer, arr);
    }
    arr.push(g);
  }
  return output;
}

/**
 * Creates HTML tables displaying the attributes of the input graphics.
 * @param doc A Document element.
 * @param graphics An array of Graphics.
 * @returns Returns a document fragment containing table elements.
 */
export function graphicsToTables(
  doc: Document,
  graphics: Graphic[]
): DocumentFragment {
  const groupedGraphics = groupFeaturesByLayer(graphics);
  const tableMap = new Map<GraphicsLayer, HTMLTableElement>();
  const frag = doc.createDocumentFragment();
  for (const [layer, layerGraphics] of groupedGraphics) {
    let table: HTMLTableElement;
    if (tableMap.has(layer)) {
      table = tableMap.get(layer)!;
    } else {
      table = featureAttributesToTable(doc, layer, true);
      tableMap.set(layer, table);
    }
    const fields = Array.from(table.querySelectorAll("th")).map(
      h => h.dataset.fieldName!
    );
    const tbody = table.tBodies[0];

    for (const g of layerGraphics) {
      const row = tbody.insertRow(-1);
      fields.map(f => g.attributes[f]).forEach(v => {
        const cell = row.insertCell(-1);
        cell.textContent = v;
      });
    }
    frag.appendChild(table);
  }
  return frag;
}
