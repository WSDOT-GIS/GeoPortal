import Search = require("esri/dijit/Search");
import Extent = require("esri/geometry/Extent");
import FeatureLayer = require("esri/layers/FeatureLayer");
import EsriMap = require("esri/map");
import SpatialReference = require("esri/SpatialReference");

function* iterateQueryTasks(queryTasks: config.QueryTasks) {
  for (const key of Object.keys(queryTasks)) {
    const queryTask = queryTasks[key];
    yield queryTask;
  }
}

function queryToFeatureLayer(queryTask: config.QueryTask) {
  const { url, label, query } = queryTask;
  const layer = new FeatureLayer(url, {
    outFields: query.outFields || ["*"]
  });
  return layer;
}

export function setupSearchControls(
  map: EsriMap,
  queryTasks?: config.QueryTasks
) {
  // Address Search
  const toolbar = document.getElementById("toolbar");
  if (!toolbar) {
    throw Error("'#toolbar' element not found");
  }
  const addressDiv = document.createElement("div");
  addressDiv.id = "search";
  toolbar.insertBefore(addressDiv, toolbar.firstChild);

  const search = new Search(
    {
      map,
      enableHighlight: false
    },
    addressDiv
  );

  search.on("load", () => {
    const source = search.sources[0];
    source.countryCode = "US";
    // Set the extent to WA. Values from https://epsg.io/1416-area.
    const [xmax, ymin, xmin, ymax] = [-116.91, 45.54, -124.79, 49.05];
    source.searchExtent = new Extent(
      xmin,
      ymin,
      xmax,
      ymax,
      new SpatialReference(4326)
    );

    if (queryTasks) {
      const sources = search.get("sources") as any[];

      for (const qt of iterateQueryTasks(queryTasks)) {
        const layer = queryToFeatureLayer(qt);
        const searchSource: any = {
          name: qt.label,
          featureLayer: layer,
          searchFields: qt.query.outFields,
          exactMatch: false
        };
        sources.push(searchSource);
      }

      search.set("sources", sources);
    }
  });

  search.startup();
}
