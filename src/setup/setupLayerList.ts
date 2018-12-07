import GroupedLayerList, {
  createLayerLink,
  LayerListOperationalLayer,
  LayerPropGroups
} from "@wsdot/grouped-layer-list";
import ArcGISDynamicMapServiceLayer from "esri/layers/ArcGISDynamicMapServiceLayer";
import ArcGISTiledMapServiceLayer from "esri/layers/ArcGISTiledMapServiceLayer";
import EsriMap from "esri/map";

/**
 * Replaces non-alphanumeric characters with underscores.
 */
function titleToId(title: string) {
  return title.replace(/[^a-z0-9]+/gi, "_");
}

/**
 * Creates an esri/layers/layer object using config settings.
 * @param configLayer layer specification from config file.
 */
function createLayer(configLayer: config.Layer) {
  const { layerType, url, visibleLayers } = configLayer;
  const visible = configLayer.options.visible || false;
  const { id } = configLayer.options;
  if (/Dynamic/i.test(layerType)) {
    const layer = new ArcGISDynamicMapServiceLayer(url, {
      id,
      visible
    });
    if (visibleLayers != null) {
      layer.setVisibleLayers(visibleLayers);
    }
    return layer;
  }
  if (/Tiled/i.test(layerType)) {
    return new ArcGISTiledMapServiceLayer(url, {
      id,
      visible
    });
  }
  throw new Error(`Unexpected layer type: "${layerType}"`);
}

/**
 * Converts a layer from the config file into an Operational Layer.
 * @param configLayer layer spec from config file
 */
function configLayerToOperationLayer(configLayer: config.Layer) {
  const title = configLayer.options.id;
  const id = titleToId(title);
  const visibility = configLayer.options.visible || false;
  const layer = createLayer(configLayer);
  const opLayer: LayerListOperationalLayer = {
    id,
    title,
    layer,
    visibility
  };

  return opLayer;
}

/**
 * Converts the layers section of a config file into a groupings of Operational Layers.
 * @param map
 * @param configLayers
 */
function getLayerGroupsFromConfig(
  map: EsriMap,
  configLayers: config.Layers | config.Layer[]
) {
  if (Array.isArray(configLayers)) {
    return {
      groups: undefined,
      layers: configLayers.map(configLayerToOperationLayer)
    };
  }

  const groups: LayerPropGroups = {};
  const layers = new Array<LayerListOperationalLayer>();

  for (const groupName in configLayers) {
    if (configLayers.hasOwnProperty(groupName)) {
      const layerSpecs = configLayers[groupName];
      const opLayers = layerSpecs.map(configLayerToOperationLayer);
      for (const layer of opLayers) {
        layers.push(layer);
      }
      groups[groupName] = opLayers.map(l => l.title!);
    }
  }

  return { groups, layers };
}

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
  const { groups, layers } = getLayerGroupsFromConfig(map, configLayers);

  console.debug("parsed from config file", { groups, layers });

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
      showOpacitySlider: true
    },
    root
  );

  return layerList;
}

export { createLayerLink };
