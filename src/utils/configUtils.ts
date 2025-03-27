const defaultConfigUrl = "config/config.json";

type layerInput = config.Layer[] | { [key: string]: config.Layer[] };

/**
 * Converts an collection of layer definition objects
 * (either an array or arrays grouped into properties of an object)
 * into an array of layer definitions.
 *
 * If the input is an array, the output will simply be the input.
 * @param layers - layer definitions
 * @returns an array of layers
 */
function getLayerArray(layers: layerInput): config.Layer[] | null {
  let output: config.Layer[] | null = null;
  if (layers) {
    if (layers instanceof Array) {
      output = layers;
    } else if (typeof layers === "object") {
      output = [];
      for (const propName in layers) {
        if (Object.prototype.hasOwnProperty.call(layers, propName)) {
          let value = layers[propName];
          value = getLayerArray(value)!;
          if (value) {
            output = output.concat(value);
          }
        }
      }
    }
  }
  return output;
}

/** Info about a configuration */
interface ConfigResult {
  name: string | undefined;
  url: string;
}

/**
 * Gets the config file specified by the query string.
 * @returns Config name (may be undefined if URL search param not provided) and URL.
 */
function getConfigNameAndUrl(): ConfigResult {
  // Get the query string parameters.
  const configName =
    new URLSearchParams(location.search).get("config") || undefined;

  // If the config parameter has not been specified, return the default.
  const configUrl = configName ? `config/${configName}.json` : defaultConfigUrl;
  return { name: configName, url: configUrl };
}

/**
 * Gets all of the layer IDs of layers that are specified with the `visible` option set to true.
 * @param layers - Layers property of the config read by getConfig
 * @returns {string[]}
 */
export function getVisibleLayerIdsFromConfig(layers: layerInput): string[] {
  const output = [];
  //   let layers = wsdot.config.layers;
  if (layers) {
    layers = getLayerArray(layers)!;
    for (const layer of layers) {
      if (layer.options && layer.options.visible && layer.options.id) {
        output.push(layer.options.id);
      }
    }
  }
  return output;
}

/**
 * Gets the configuration data from either the file specified in the URL search
 * or from the default config file.
 */
export async function getConfig(): Promise<config.Config> {
  const { url } = getConfigNameAndUrl();
  const response = await fetch(url);
  return await response.json();
}
