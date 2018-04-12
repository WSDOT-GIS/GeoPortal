import ArcGISDynamicMapServiceLayer = require("esri/layers/ArcGISDynamicMapServiceLayer");
import ArcGISImageServiceLayer = require("esri/layers/ArcGISImageServiceLayer");
import ArcGISTiledMapServiceLayer = require("esri/layers/ArcGISTiledMapServiceLayer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import ImageParameters = require("esri/layers/ImageParameters");
import KMLLayer = require("esri/layers/KMLLayer");
import LabelLayer = require("esri/layers/LabelLayer");
import Layer = require("esri/layers/layer");
import MetadataOptions from "./MetadataOptions";

/**
 * Converts an error object into a string.
 * @param {Error} error - An error that occurs when loading a layer.
 * @returns {string} An error message
 */
export function formatError(
  error: Error & { details?: string[] }
): string | null {
  let output: string | null = null;
  if (typeof error.details !== "undefined") {
    output = error.details.join("\n");
  } else if (typeof error.message !== "undefined") {
    output = error.message;
  }
  return output;
}

export function jsonToImageParameters(json: any) {
  const output: ImageParameters | null = json ? new ImageParameters() : null;
  if (output) {
    for (const propName in json) {
      if (json.hasOwnProperty(propName)) {
        (output as any)[propName] = json[propName];
      }
    }
  }
  return output;
}

/**
 * Makes a string safe to use as an HTML id property.
 * @param {string} s - a string
 * @param {string} [replacement="-"] - Optional.  The string that will be used to replace invalid characters.
 * Defaults to "-".
 * @param {string} [prefix="z-"] - Optional.  A string that will be prepended to the output if the input
 * starts with a non-alpha character.  Defaults to "z-".
 * @param {Boolean} [alwaysUsePrefix=false] Set to true to always prepend the prefix to the output,
 * false to only use it when the first character of s is non-alpha.
 * @returns {string} Returns a string that is safe to be used as an HTML id attribute value.
 */
export function makeIdSafeString(
  s: string,
  replacement: string,
  prefix: string,
  alwaysUsePrefix: boolean
): string {
  // Replace invalid characters with hyphen.
  s = s.replace(/\W/gi, replacement || "-");
  // Append a prefix if non-alpha character
  if (alwaysUsePrefix || /^[^a-z]/i.test(s)) {
    // JSLint will complain about this Regex's "insecure ^", but this is not used for security
    // purposes so it should be fine.
    s = [prefix || "z-", s].join("");
  }

  return s;
}

/**
 * Returns a constructor for a specific type of layer.
 * @param {(string|Function)} layerType - layer type. If the type is a function, this function will
 * simply be returned as the output.
 * @returns {Function} - A constructor for an esri/layers/Layer.
 */
export function getLayerConstructor(
  layerType: string | ((...a: any[]) => any)
): any {
  let ctor: any = null;
  if (typeof layerType === "string") {
    if (/(?:esri\.layers\.)?ArcGISTiledMapServiceLayer/i.test(layerType)) {
      ctor = ArcGISTiledMapServiceLayer;
    } else if (
      /(?:esri\.layers\.)?ArcGISDynamicMapServiceLayer/i.test(layerType)
    ) {
      ctor = ArcGISDynamicMapServiceLayer;
    } else if (/(?:esri\.layers\.)?ArcGISImageServiceLayer/i.test(layerType)) {
      ctor = ArcGISImageServiceLayer;
    } else if (/(?:esri\.layers\.)?FeatureLayer/i.test(layerType)) {
      ctor = FeatureLayer;
    } else if (/(?:esri\.layers\.)?LabelLayer/i.test(layerType)) {
      ctor = LabelLayer;
    } else if (/(?:esri\.layers\.)?KMLLayer/i.test(layerType)) {
      ctor = KMLLayer;
    } else {
      ctor = null;
    }

    if (ctor === null) {
      throw new Error("Unsupported layer type.");
    } else {
      return ctor;
    }
  } else if (typeof layerType === "function") {
    return layerType;
  }
}

function processLayerOptions(layerOptions: any) {
  const output: any = layerOptions ? {} : null;
  if (output) {
    for (const propName in layerOptions) {
      if (layerOptions.hasOwnProperty(propName)) {
        if (propName === "imageParameters") {
          output[propName] = jsonToImageParameters(layerOptions[propName]);
        } else {
          output[propName] = layerOptions[propName];
        }
      }
    }
  }
  return output;
}

/**
 * Creates an esri.layer.Layer based on information in layerInfo.
 * @param {Object} layerInfo - An object containing parameters for a Layer constructor.
 * @returns {esri/layer/Layer} - A layer.
 */
export function createLayer(layerInfo: any): Layer {
  // If layerInfo is already an Layer, just return it.
  if (
    typeof layerInfo !== "undefined" &&
    typeof layerInfo.isInstanceOf !== "undefined" &&
    layerInfo.isInstanceOf(Layer)
  ) {
    return layerInfo;
  }

  const constructor = getLayerConstructor(
    layerInfo.type || layerInfo.layerType
  );

  const layer = new constructor(
    layerInfo.url,
    processLayerOptions(layerInfo.options)
  );

  // Add metadata options to layer object.
  layer.metadataOptions = layerInfo.metadataOptions
    ? new MetadataOptions(layerInfo.metadataOptions)
    : null;
  return layer;
}
