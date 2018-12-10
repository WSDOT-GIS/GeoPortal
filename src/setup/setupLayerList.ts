import GroupedLayerList, {
  createLayerLink,
  fromGeoportalLayers
} from "@wsdot/grouped-layer-list";
import EsriMap from "esri/map";

/**
 *
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
      map,
      groups,
      groupProperty: "title",
      layers,
      metadata: true,
      showSubLayers: true,
      showLegend: true,
      showOpacitySlider: true
    },
    root
  );

  return layerList;
}

export { createLayerLink };
