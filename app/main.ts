import { ILoadScriptOptions, loadModules } from "esri-loader";

/**
 * esri-loader options, including dojoConfig.
 */
const dojoOptions: ILoadScriptOptions = {
  dojoConfig: {
    async: true,
    // See https://blogs.esri.com/esri/arcgis/2017/12/14/making-better-promises/
    has: {
      "esri-promise-compatibility": 1
    }
  }
};

/**
 * Since esri-loader is being used to load the modules rather than
 * the standard *import* method, this type definition is used to
 * force the typescript compiler to use the correct types for the
 * modules instead of *any*. This also aids in code-completion in
 * Visual Studio Code.
 *
 * If the list of modules in the call to *loadModules* is modified,
 * this type definition must also be modified accordingly.
 */
declare type moduleArray = [
  __esri.config,
  __esri.ExtentConstructor,
  __esri.FeatureLayerConstructor,
  __esri.MapConstructor,
  __esri.MapViewConstructor,
  __esri.WebMapConstructor,
  __esri.BasemapGalleryConstructor,
  __esri.CompassConstructor,
  __esri.ExpandConstructor,
  __esri.HomeConstructor,
  __esri.LayerListConstructor,
  __esri.LegendConstructor,
  __esri.ScaleBarConstructor,
  __esri.SearchConstructor
];

/**
 * This custom type allows the *loadModules* function
 * (which normally returns *any[]*) to return the
 * specific types for the imported modules.
 */
declare type customLoadModules = (
  modules: string[],
  loadScriptOptions?: ILoadScriptOptions
) => Promise<moduleArray>;

// Start loading the ArcGIS API modules.
const loaderPromise = (loadModules as customLoadModules)(
  [
    "esri/config",
    "esri/geometry/Extent",
    "esri/layers/FeatureLayer",
    "esri/Map",
    "esri/views/MapView",
    "esri/WebMap",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Compass",
    "esri/widgets/Expand",
    "esri/widgets/Home",
    "esri/widgets/LayerList",
    "esri/widgets/Legend",
    "esri/widgets/ScaleBar",
    "esri/widgets/Search"
  ],
  dojoOptions
);

// After the loader has loaded all of the ArcGIS API modules
// set up the map application.
loaderPromise.then(
  ([
    esriConfig,
    Extent,
    FeatureLayer,
    EsriMap,
    MapView,
    WebMap,
    BasemapGallery,
    Compass,
    Expand,
    Home,
    LayerList,
    Legend,
    ScaleBar,
    Search
  ]) => {
    // Inform the API about additional sites that are CORS enabled
    // and support HTTPS.
    const { corsEnabledServers, httpsDomains } = esriConfig.request;
    if (corsEnabledServers) {
      corsEnabledServers.push(
        "data.wsdot.wa.gov",
        "www.wsdot.wa.gov",
        "wsdot.wa.gov"
      );
    }
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

    const hexRe = /^[a-f0-9]+$/i;

    // Get the webmap parameter from the search string, if present.
    const searchParams = new URL(location.href).searchParams;
    const webmapId = searchParams.get("webmap");
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

    view.when((e: any) => {
      view.constraints.minZoom = view.zoom - 2;
    });

    // #region Add controls

    const home = new Home({
      view
    });
    view.ui.add(home, "top-left");

    // Add Search
    const searchWidget = new Search({
      activeSourceIndex: -1,
      locationEnabled: true,
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
  }
);
