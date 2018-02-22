import Layer = require("esri/layers/Layer");
import MapImageLayer = require("esri/layers/MapImageLayer");
import UnknownLayer = require("esri/layers/UnknownLayer");
import VectorTileLayer = require("esri/layers/VectorTileLayer");

export interface ISpatialReference {
  wkid?: number;
  wkt?: string;
}

export interface IWebMap {
  [key: string]: any;
  operationalLayers: IOperationalLayer[];
  baseMap: IBaseMap;
}

export interface IBaseMapLayer {
  id: string;
  type: string;
  layerType: string;
  title: string;
  styleUrl: string;
  itemId: string;
  visibility: true;
  opacity: true;
}

export interface IBaseMap {
  basemapLayers: IBaseMapLayer[];
  title: string;
}

export interface IOperationalLayer {
  id: string;
  layerType: string;
  url: string;
  visibility?: boolean;
  opacity?: number;
  title: string;
}

export function parseOperationalLayer(
  operationalLayer: IOperationalLayer
): Layer {
  const { url, title, id, visibility, opacity, layerType } = operationalLayer;
  if (layerType === "ArcGISMapServiceLayer") {
    const layer = new MapImageLayer({
      id,
      opacity,
      title,
      url,
      visible: visibility
    });
    return layer;
  } else {
    const layer = new UnknownLayer({
      id,
      opacity,
      title,
      visible: visibility
    });
    return layer;
  }
}

export default function parseWebMap(webmap: IWebMap) {
  let operationalLayers: Layer[] | null;
  if (webmap.operationalLayers) {
    operationalLayers = webmap.operationalLayers.map(parseOperationalLayer);
  }
}
