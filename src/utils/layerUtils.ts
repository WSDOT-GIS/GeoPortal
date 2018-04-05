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
