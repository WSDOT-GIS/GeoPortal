import lang = require("dojo/_base/lang");
import webMercatorUtils = require("esri/geometry/webMercatorUtils");
import GraphicsLayer = require("esri/layers/GraphicsLayer");

lang.extend(GraphicsLayer, {
  /**
   * Returns an array of ArcGIS Server JSON graphics.
   */
  getGraphicsAsJson(this: GraphicsLayer) {
    return this.graphics.map(item => {
      // TODO: Make the projection to geographic optional.
      // For the purposes of this application, though, this works just fine.
      const geometry = webMercatorUtils.webMercatorToGeographic(item.geometry);
      const json = item.toJson();
      json.geometry = geometry.toJson();
      return json;
    });
  }
});
