import GroupedLayerList, {
  createLayerLink,
  fromGeoportalLayers,
  setOperationalLayers
} from "@wsdot/grouped-layer-list";
import Extent from "esri/geometry/Extent";
import EsriMap from "esri/map";
import SpatialReference from "esri/SpatialReference";

/**
 * Sets up the layer list for the layers in the config file.
 * @param root Element that will host the Layer List control
 * @param map Esri Map object.
 * @param configLayers The "layers" section from the config file.
 */
export function setupLayerList(
  root: HTMLElement,
  map: EsriMap,
  configLayers: config.Layers
) {
  const { groups, layers } = fromGeoportalLayers(configLayers);

  // Add the layers to the map
  const mapLayers = layers.filter(l => l.layer).map(l => l.layer!);
  if (mapLayers && mapLayers.length) {
    map.addLayers(mapLayers);
  }

  const layerList = new GroupedLayerList(
    {
      groupProperty: "title",
      groups,
      layers,
      map,
      metadata: true,
      showLegend: true,
      showOpacitySlider: true,
      showSubLayers: true,
      throwOnGroupNotFound: false
    },
    root.id
  );

  // Set layers and extent to match those specified in URL search params.
  if (window.URL && window.URLSearchParams) {
    const url = new URL(window.location.href);
    setOperationalLayers(url.searchParams, layerList);
    // If present, map-extent will be four space separated coordinates.
    const mapExtent = url.searchParams.get("map-extent");
    if (mapExtent) {
      // Split to strings then convert strings to numbers.
      const [xmin, ymin, xmax, ymax] = mapExtent
        .split(/[\s,]+/g)
        .map(s => parseFloat(s));

      // Extent coords are WGS 84
      const sr = new SpatialReference(4326);
      const extent = new Extent(xmin, ymin, xmax, ymax, sr);
      map.setExtent(extent);
    }
  }
  return layerList;
}

export { createLayerLink };
