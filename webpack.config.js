const path = require("path");

module.exports = {
  mode: "production",
  target: "web",
  externals: /^(?:(?:esri)|(?:dojox?)|(?:dijit))/,
  devtool: "source-map",
  entry: "./src/arcgis-rest-lrs-ui/main.ts",
  output: {
    libraryTarget: "amd",
    path: path.resolve(__dirname, "scripts/arcgis-rest-lrs-ui"),
    filename: "main.js"
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