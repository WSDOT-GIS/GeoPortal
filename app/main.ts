import esriConfig = require("esri/config");
import Extent = require("esri/geometry/Extent");
import FeatureLayer = require("esri/layers/FeatureLayer");
import EsriMap = require("esri/Map");
import MapView = require("esri/views/MapView");
import WebMap = require("esri/WebMap");
import BasemapGallery = require("esri/widgets/BasemapGallery");
import Compass = require("esri/widgets/Compass");
import Expand = require("esri/widgets/Expand");
import Home = require("esri/widgets/Home");
import LayerList = require("esri/widgets/LayerList");
import Legend = require("esri/widgets/Legend");
import ScaleBar = require("esri/widgets/ScaleBar");
import Search = require("esri/widgets/Search");

// Inform the API about additional sites that are CORS enabled
// and support HTTPS.
const { httpsDomains } = esriConfig.request;
if (httpsDomains) {
  httpsDomains.push("wsdot.wa.gov");
}

/**
 * Extent of WA.
 * @see https://epsg.io/1416-area
 */
const waExtent = new Extent({
  xmin: -116.91,
  ymin: 45.54,
  xmax: -124.79,
  ymax: 49.05
});

// Get the webmap parameter from the search string, if present.
const searchParams = new URL(location.href).searchParams;
const webmapId = searchParams.get("webmap");
const hexRe = /^[a-f0-9]+$/i;
const webmapIdIsValid = webmapId ? hexRe.test(webmapId) : null;

let map: __esri.Map | __esri.WebMap;

const countyLayerUrl =
  "https://data.wsdot.wa.gov/arcgis/rest/services/Shared/CountyBoundaries/MapServer/0";
const countyLayer = new FeatureLayer({
  url: countyLayerUrl
});

// If there's a webmapID provided, load the webmap from AGOL.
// Otherwise, use the default.
if (webmapId && webmapIdIsValid) {
  const webmap = new WebMap({
    portalItem: {
      id: webmapId // e.g., "5ae6ee17e6124a17854c715d995dc55b",
    }
  });
  // When the webmap has loaded, update the title of the page
  // in the header and on the browser tab.
  webmap.when((wm: __esri.WebMap) => {
    const titleSpan = document.getElementById("mapTitle");
    const title = wm.portalItem.title;

    if (title) {
      if (titleSpan) {
        titleSpan.textContent = title;
      }
      document.title = title;
    }
  });
  map = webmap;
} else {
  // Create the map
  map = new EsriMap({
    basemap: "streets-night-vector"
  });
  map.add(countyLayer);
}

// Create the view.
const view = new MapView({
  map,
  container: "viewDiv",
  extent: waExtent
});

view.when(() => {
  view.constraints.minZoom = view.zoom - 2;
});

// #region Add controls

const home = new Home({
  view
});
view.ui.add(home, "top-left");

// Add Search
const searchWidget = new Search({
  includeDefaultSources: false,
  locationEnabled: true,
  view,
  sources: [
    {
      locator: {
        url:
          "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
        countryCode: "US"
      },
      filter: {
        geometry: waExtent,
        where: "1=1"
      }
    },
    {
      featureLayer: countyLayer,
      name: "County Boundaries"
    }
  ],
  container: document.createElement("div")
});

// Place the search control into an expander.
const searchExpand = new Expand({
  content: searchWidget.container,
  expandIconClass: "esri-icon-search",
  group: "top-right",
  view
});

// Create the layer list.
const layerList = new LayerList({
  container: document.createElement("div"),
  view
});

// Add the layer list to an expander
const layerListExpand = new Expand({
  content: layerList.container,
  expandIconClass: "esri-icon-layers",
  group: "top-right",
  view
});

// Create basemap gallery, add to expander.
const basemapGallery = new BasemapGallery({
  container: document.createElement("div"),
  source: {
    query: {
      id: "30de8da907d240a0bccd5ad3ff25ef4a" // Esri vector basemap group ID.
    }
  },
  view
});

const basemapExpand = new Expand({
  content: basemapGallery.container,
  expandIconClass: "esri-icon-basemap",
  group: "top-right",
  view
});

// Add legend
const legend = new Legend({
  container: document.createElement("div"),
  view
});

const legendExpand = new Expand({
  content: legend.container,
  expandIconClass: "esri-icon-layer-list",
  group: "top-right",
  view
});

const compass = new Compass({
  view
});
const scalebar = new ScaleBar({
  view
});

view.ui.add(
  [searchExpand, layerListExpand, legendExpand, basemapExpand],
  "top-right"
);

view.ui.add([compass, scalebar], "bottom-left");

// #endregion

// #region title sizing
// from sample: https://developers.arcgis.com/javascript/latest/sample-code/view-breakpoints-css/index.html
// Load

const isResponsiveSize = view.widthBreakpoint === "xsmall";
updateView(isResponsiveSize);

// Breakpoints

view.watch("widthBreakpoint", (breakpoint: any) => {
  switch (breakpoint) {
    case "xsmall":
      updateView(true);
      break;
    case "small":
    case "medium":
    case "large":
    case "xlarge":
      updateView(false);
      break;
    default:
  }
});

function updateView(isMobile: boolean) {
  setTitleMobile(isMobile);
}

function setTitleMobile(isMobile: boolean) {
  const titleDiv = document.querySelector("#titleDiv");
  if (titleDiv) {
    if (isMobile) {
      titleDiv.classList.add("invisible");
      view.padding = {
        top: 0
      };
    } else {
      titleDiv.classList.remove("invisible");
      view.padding = {
        top: 55
      };
    }
  }
}

// #endregion
