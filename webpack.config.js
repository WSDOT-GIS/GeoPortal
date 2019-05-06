const path = require("path");

/**
 *
 * @param {string} entry Relative path to entry point.
 * @returns {string[]} Returns an array with two string elements: folder name and file name w/o extension.
 * Folder can be either a string or undefined.
 * @example
 * const entry = "./src/arcgis-rest-lrs-ui/main.ts";
 * const [folder, filename] = getFolderAndFileName(entry);
 * console.log(folder); // "arcgis-rest-lrs-ui"
 * console.log(filename); // "main"
 *
 * @example
 * const entry = "./src/main.ts";
 * const [folder, filename] = getFolderAndFileName(entry);
 * console.log(folder); // undefined
 * console.log(filename); // "main"
 */
function getFolderAndFileName(entry) {
  /** Matches path and captures 1. folder name and 2. file name w/o extention. */
  const re = /\.\/src\/(?:(.+)\/)*([^/]+).ts/;
  const match = entry.match(re);
  if (!match) {
    throw new Error("Could not extract folder and file name");
  }
  return match.slice(1);
}

/**
 * Creates a configuration for webpack to transpile the entry file.
 * @param {string} entry Relative path to entry point file.
 * @returns {object} Returns a webpack configuration.
 */
function createConfig(entry) {
  const [folder, filename] = getFolderAndFileName(entry);
  // Most of the output files will need to be AMD modules, but a few will
  // need to be non-modules.
  const libraryTarget = /(?:(?:dataUrlViewer)|(?:\bexporter\b))/g.test(folder)
    ? undefined
    : "amd";

  const config = {
    mode: "production",
    target: "web",
    externals: [/^(?:(?:esri)|(?:dojox?)|(?:dijit))/, "jquery"],
    devtool: "source-map",
    entry,
    output: {
      libraryTarget,
      path: folder
        ? path.resolve(__dirname, "scripts", folder)
        : path.resolve(__dirname, "scripts"),
      filename: `${filename}.js`
    },
    resolve: {
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: [".ts", ".tsx", ".js"]
    },
    module: {
      rules: [
        // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
        { test: /\.tsx?$/, loader: "ts-loader" }
      ]
    }
  };

  return config;
}

module.exports = [
  "./src/exporter/exportPage.ts",
  "./src/arcgis-rest-lrs-ui/main.ts",
  "./src/extensions/esriApiExtensions.ts",
  "./src/extensions/graphicsLayer.ts",
  "./src/InfoTemplates/CrmpTemplate.ts",
  "./src/InfoTemplates/HabitatConnectivityInfoTemplate.ts",
  "./src/InfoTemplates/PtrTemplate.ts",
  "./src/InfoTemplates/TrafficInfoTemplate.ts",
  "./src/setup/main.ts",
  "./src/utils/main.ts",
  "./src/controls/layerSorter.ts"
].map(createConfig);
