import Extent = require("esri/geometry/Extent");
import FeatureLayer = require("esri/layers/FeatureLayer");
import EsriMap = require("esri/Map");
import Locator = require("esri/tasks/Locator");
import MapView = require("esri/views/MapView");
import BasemapGallery = require("esri/widgets/BasemapGallery");
import Expand = require("esri/widgets/Expand");
import LayerList = require("esri/widgets/LayerList");
import Search = require("esri/widgets/Search");

const waExtent = new Extent({
  xmin: -116.91,
  ymin: 45.54,
  xmax: -124.79,
  ymax: 49.05
});

// Create the map
const map = new EsriMap({
  basemap: "streets-night-vector"
});

const countyLayerUrl =
  "https://data.wsdot.wa.gov/arcgis/rest/services/Shared/CountyBoundaries/MapServer/0";
const countyLayer = new FeatureLayer({
  url: countyLayerUrl
});

map.add(countyLayer);

// Create the view.
const view = new MapView({
  map,
  container: "viewDiv",
  extent: waExtent
});

// #region Add controls

// Add Search
const searchWidget = new Search({
  view,
  container: document.createElement("div")
});

// Modifiy the default World Locator:
// * Restrict to US
// * Restrict search extent to WA extent.
const worldLocator = searchWidget.defaultSource as __esri.LocatorSource;
worldLocator.countryCode = "US";
worldLocator.filter = {
  geometry: waExtent,
  where: "1 = 1"
} as __esri.LocatorSourceFilter;

// Add the county Feature Layer as a search source.
searchWidget.sources.add({
  featureLayer: countyLayer,
  name: "County Boundaries"
} as __esri.FeatureLayerSource);

// Place the search control into an expander.
const searchExpand = new Expand({
  content: searchWidget.container,
  expandIconClass: "esri-icon-search",
  view
});

// Add expander to the UI.
view.ui.add(searchExpand, {
  position: "top-right",
  index: 1
});

// Create the layer list.
const layerList = new LayerList({
  container: document.createElement("div"),
  view
});

// Add the layer list to an expander
const layerListExpand = new Expand({
  expandIconClass: "esri-icon-layer-list",
  view,
  content: layerList.container
});

// Add expander to the UI.
view.ui.add(layerListExpand, {
  position: "top-right",
  index: 2
});

// Create basemap gallery, add to expander, add expander to view UI.
const basemapGallery = new BasemapGallery({
  container: document.createElement("div"),
  view
});

const basemapExpand = new Expand({
  expandIconClass: "esri-icon-basemap",
  view,
  content: basemapGallery.container
});

view.ui.add(basemapExpand, "top-right");
// #endregion
