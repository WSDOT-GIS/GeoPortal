const defaultConfigUrl = "config/config.json";

type layerInput = config.Layer[] | { [key: string]: config.Layer[] };

/**
 * Converts an collection of layer definition objects
 * (either an array or arrays grouped into properties of an object)
 * into an array of layer definitions.
 *
 * If the input is an array, the output will simply be the input.
 * @param {(Object)|(Object[])} layers
 * @returns {Object[]}
 */
function getLayerArray(layers: layerInput) {
  let output: config.Layer[] | null = null;
  if (layers) {
    if (layers instanceof Array) {
      output = layers;
    } else if (typeof layers === "object") {
      output = [];
      for (const propName in layers) {
        if (layers.hasOwnProperty(propName)) {
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

/**
 * Gets the config file specified by the query string.
 * @returns {string}
 */
function getConfigUrl(): string {
  // Get the query string parameters.
  let output = defaultConfigUrl;
  const qsconfigMatch = location.search.match(/\bconfig=([^=&]+)/);
  const qsconfig = qsconfigMatch ? qsconfigMatch[1] : null;
  // If the config parameter has not been specified, return the default.
  if (qsconfig) {
    if (/\//g.test(qsconfig)) {
      output = `${qsconfig}.json`;
    } else {
      output = `config/${qsconfig}.json`;
    }
  }
  return output;
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
  const url = getConfigUrl();
  const response = await fetch(url);
  if (response.ok) {
    return await response.json();
  } else {
    // Detect the error that occurs if the user tries to access the airport
    // power user setting via config query string parameter.
    // Redirect to the aspx page which will prompt for a log in.
    const textStatus = response.statusText;
    let bodyText: string;
    if (
      /parsererror/i.test(textStatus) &&
      /^AIS\/config.js(?:on)?$/i.test(url)
    ) {
      bodyText =
        "<p>You need to <a href='AirportPowerUser.aspx'>log in</a> to access this page.</p>";
      // location.replace("AirportPowerUser.aspx");
    } else {
      bodyText =
        "<p class='ui-state-error ui-corner-all'>Error: Invalid <em>config</em> parameter.</p>";
    }
    document.body.removeAttribute("class");
    document.body.innerHTML = bodyText;
    throw new Error(bodyText);
  }
}
