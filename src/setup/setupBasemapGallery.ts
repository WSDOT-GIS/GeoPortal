import { BasemapLayerOptions } from "esri";
import Basemap = require("esri/dijit/Basemap");
import BasemapGallery = require("esri/dijit/BasemapGallery");
import BasemapLayer = require("esri/dijit/BasemapLayer");
import EsriMap = require("esri/map");


/**
 * @function setupBasemapGallery
 * @description Sets up the BasemapGallery control.
 * @param {EsriMap} map The Esri map object.
 * @param {config.Config} config The application's configuration object.
 * @returns {void} Nothing.
 */
function setupBasemapGallery(map: EsriMap, config: config.Config) {
  const f = ({
    layers: layerPropertiesList,
    ...basemapProperties
  }: config.Basemap) => {
    // Create BasemapLayer objects from config.
    const layers = layerPropertiesList.map(
      (l: BasemapLayerOptions) => new BasemapLayer(l)
    );
    return new Basemap({ ...basemapProperties, layers });
  };
  
  // Create basemap definitions in config into Basemap objects.
  const basemaps = config.basemaps.map(f);

  const basemapGallery = new BasemapGallery(
    {
      showArcGISBasemaps: true,
      map,
      basemaps,
      basemapIds: map.layerIds,
    },
    "basemapGallery"
  );

  basemapGallery.startup();

  // Remove the unwanted default basemaps as defined in config.js (if any are defined).
  basemapGallery.on("load", () => {
    /** Gets a list IDs corresponding to basemaps that should be removed, as defined in the config file.
     * @returns The names of the basemaps.
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

  basemapGallery.on("basemap gallery error", console.error);

  // Check for an existing customLegend
  const customLegend = $("#legend").data("customLegend");
  if (customLegend) {
    customLegend.setBasemapGallery(basemapGallery);
  }

  return basemapGallery;
}

export = setupBasemapGallery;
