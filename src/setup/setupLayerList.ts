import GroupedLayerList, {
  createLayerLink,
  fromGeoportalLayers
} from "@wsdot/grouped-layer-list";
import EsriMap from "esri/map";

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

  return layerList;
}

export { createLayerLink };
