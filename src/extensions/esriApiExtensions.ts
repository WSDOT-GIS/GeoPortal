/**
 * This script gives existing ArcGIS JavaScript API types additional methods and properties.
 */

import lang = require("dojo/_base/lang");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Layer = require("esri/layers/layer");
import LayerInfo = require("esri/layers/LayerInfo");
import EsriMap = require("esri/map");

lang.extend(LayerInfo, {
  isGroupLayer(this: LayerInfo) {
    return this.subLayerIds !== null;
  },
  /**
   * Determines if the current sublayer can be seen at the current scale.
   * The minScale and maxScale properties of the LayerInfo object are not available from
   * layers based on pre-version 10 SP1 map services.
   * Return true if there is no scale information;
   * @param this LayerInfo
   * @param scale Scale integer
   */
  isVisibleAt(this: LayerInfo, scale: number) {
    if (
      typeof this.minScale === "undefined" ||
      typeof this.maxScale === "undefined"
    ) {
      return true;
    } else {
      return (
        (this.minScale === 0 || this.minScale >= scale) &&
        (this.maxScale === 0 || this.maxScale <= scale)
      );
    }
  },
  supportsHtmlPopup: null,
});

lang.extend(Layer, {
  /**
   * Returns only the layerInfos that are visible at the given scale.
   * @param {Layer} this Layer
   * @param {number} scale
   * @returns {LayerInfo[]}
   */
  getVisibleLayerInfos(
    this: Layer & { layerInfos?: LayerInfo[] },
    scale: number
  ) {
    if (typeof this.layerInfos === "undefined") {
      return null;
    }

    return this.layerInfos.filter((li: any) => li.isVisibleAt(scale));
  },
  /**
   * Determines if any of the sublayers in the layer are visible at the current scale.
   * Only supported for ArcGIS 10.01 and higher map services.
   */
  areAnySublayersVisible(this: any /*scale*/) {
    if (this.version < 10.01) {
      return true;
    } else {
      const visibleLayerInfos = this.getVisibleLayerInfos();
      return visibleLayerInfos.length > 0;
    }
  },
});

lang.extend(FeatureLayer, {
  /**
   * Determines if the current sublayer can be seen at the current scale.
   *
   * The minScale and maxScale properties of the LayerInfo object are not available
   * from layers based on pre-version 10 SP1 map services.
   * Return true if there is no scale information;
   */
  isVisibleAt(this: FeatureLayer, scale: number) {
    if (
      typeof this.minScale === "undefined" ||
      typeof this.maxScale === "undefined"
    ) {
      return true;
    } else {
      return (
        (this.minScale === 0 || this.minScale >= scale) &&
        (this.maxScale === 0 || this.maxScale <= scale)
      );
    }
  },
});
