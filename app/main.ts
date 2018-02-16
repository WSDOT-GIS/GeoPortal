import EsriMap = require("esri/Map");
import MapView = require("esri/views/MapView");

const map = new EsriMap({
  basemap: "streets"
});

const view = new MapView({
  map,
  container: "viewDiv",
  extent: { xmin: -116.91, ymin: 45.54, xmax: -124.79, ymax: 49.05 }
});
