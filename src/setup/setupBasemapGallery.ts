import { BasemapLayerOptions } from "esri";
import esriBasemaps from "esri/basemaps";
import Basemap = require("esri/dijit/Basemap");
import BasemapGallery = require("esri/dijit/BasemapGallery");
import BasemapLayer = require("esri/dijit/BasemapLayer");
import EsriMap = require("esri/map");

// Setup the basemap gallery
function setupBasemapGallery(map: EsriMap, config: any) {
  const basemaps = config.basemaps as any[];

  basemaps.forEach(bm => {
    bm.layers = bm.layers.map((l: BasemapLayerOptions) => {
      return new BasemapLayer(l);
    });
  });

  const basemapGallery = new BasemapGallery(
    {
      // Default "showArcGISBasemaps" to true if omitted in config.
      showArcGISBasemaps: config.hasOwnProperty("showArcGISBasemaps")
        ? config.showArcGISBasemaps
        : true,
      map,
      basemaps,
      basemapIds: map.layerIds
    },
    "basemapGallery"
  );

  basemapGallery.startup();

  // Remove the unwanted default basemaps as defined in config.js (if any are defined).
  basemapGallery.on("load", () => {
    /** Gets a list IDs corresponding to basemaps that should be removed, as defined in the config file.
     * @returns {string[]} The names of the basemaps.
     */
    function getBasemapsByLabel() {
      const outputIds = new Array<string>();
      if (config.basemapsToRemove) {
        for (let i = 0, l = config.basemapsToRemove.length; i < l; i += 1) {
          const rItem = config.basemapsToRemove[i];
          for (let b = 0, bl = basemapGallery.basemaps.length; b < bl; b += 1) {
            const bItem = basemapGallery.basemaps[b];
            if (bItem.title === rItem) {
              outputIds.push(bItem.id);
              break;
            }
          }
        }
      }
      return outputIds;
    }

    if (config.basemapsToRemove) {
      let removed;
      const basemapsToRemove = getBasemapsByLabel();
      for (const item of basemapsToRemove) {
        removed = basemapGallery.remove(item);
        // tslint:disable-next-line:no-console
        if (console && console.warn) {
          if (removed === null) {
            // tslint:disable-next-line:no-console
            console.warn(
              `Basemap removal failed: basemap not found: ${basemapsToRemove}`
            );
          }
        }
      }
    }

    // If an initial basemap was specified in the config file,
    // select that basemap now.
    if (config.initialBasemap) {
      let firstBasemap: Basemap | undefined;
      for (const currentBasemap of basemapGallery.basemaps) {
        if (currentBasemap.title === config.initialBasemap) {
          firstBasemap = currentBasemap;
          break;
        }
      }
      if (firstBasemap) {
        basemapGallery.select(firstBasemap.id);
      }
    }
  });

  // tslint:disable-next-line:no-console
  basemapGallery.on("basemap gallery error", console.error);

  // Check for an existing customLegend
  const customLegend = $("#legend").data("customLegend");
  if (customLegend) {
    customLegend.setBasemapGallery(basemapGallery);
  }
}

export = setupBasemapGallery;
