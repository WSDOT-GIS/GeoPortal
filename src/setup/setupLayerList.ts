import GroupedLayerList, {
  createLayerLink,
  LayerListOperationalLayer,
  LayerPropGroups
} from "@wsdot/grouped-layer-list";
import ArcGISDynamicMapServiceLayer from "esri/layers/ArcGISDynamicMapServiceLayer";
import ArcGISTiledMapServiceLayer from "esri/layers/ArcGISTiledMapServiceLayer";
import EsriMap from "esri/map";

function titleToId(title: string) {
  return title.replace(/[^a-z0-9]+/gi, "_");
}

function createLayer(configLayer: config.Layer) {
  const { layerType, url, visibleLayers } = configLayer;
  const visible = configLayer.options.visible || false;
  if (/Dynamic/i.test(layerType)) {
    const layer = new ArcGISDynamicMapServiceLayer(url, {
      visible
    });
    if (visibleLayers != null) {
      layer.setVisibleLayers(visibleLayers);
    }
    return layer;
  }
  if (/Tiled/i.test(layerType)) {
    return new ArcGISTiledMapServiceLayer(url, {
      visible
    });
  }
  throw new Error(`Unexpected layer type: "${layerType}"`);
}

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

function getLayerGroupsFromConfig(map: EsriMap, config: config.Layers) {
  const groups: LayerPropGroups = {};
  const layers = new Array<LayerListOperationalLayer>();

  for (const groupName in config) {
    if (config.hasOwnProperty(groupName)) {
      const configLayers = config[groupName];
      const opLayers = configLayers.map(configLayerToOperationLayer);
      for (const layer of opLayers) {
        layers.push(layer);
      }
      groups[groupName] = opLayers.map(l => l.title!);
    }
  }

  return { groups, layers };
}

export function setupLayerList(
  root: HTMLElement,
  map: EsriMap,
  config: config.Layers
) {
  const { groups, layers } = getLayerGroupsFromConfig(map, config);

  console.debug({ groups, layers });

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
