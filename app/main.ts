import Extent = require("esri/geometry/Extent");
import Locator = require("esri/tasks/Locator");
import FeatureLayer = require("esri/layers/FeatureLayer");
import EsriMap = require("esri/Map");
import MapView = require("esri/views/MapView");
import LayerList = require("esri/widgets/LayerList");
import Search = require("esri/widgets/Search");

const waExtent = new Extent({
  xmin: -116.91,
  ymin: 45.54,
  xmax: -124.79,
  ymax: 49.05
});

const map = new EsriMap({
  basemap: "streets-night-vector"
});

const countyLayerUrl =
  "https://data.wsdot.wa.gov/arcgis/rest/services/Shared/CountyBoundaries/MapServer/0";
const countyLayer = new FeatureLayer({
  url: countyLayerUrl
});

const view = new MapView({
  map,
  container: "viewDiv",
  extent: waExtent
});

const searchWidget = new Search({ view });
// Restrict to US.
const worldLocator = searchWidget.defaultSource as __esri.LocatorSource;
worldLocator.countryCode = "US";
worldLocator.filter = {
    geometry: waExtent,
    where: "1 = 1"
} as __esri.LocatorSourceFilter;

view.ui.add(searchWidget, {
  position: "top-right",
  index: 1
});

const layerList = new LayerList({
  view
});

view.ui.add(layerList, {
  position: "top-right",
  index: 2
});

map.add(countyLayer);

searchWidget.sources.add({
  featureLayer: countyLayer,
  name: "County Boundaries"
} as __esri.FeatureLayerSource);
