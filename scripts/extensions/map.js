/*global require */
/*jslint white:true, nomen:true*/

require(["dojo/_base/lang", "esri/map", "esri/layers/GraphicsLayer"], function (lang, Map, GraphicsLayer) {
	"use strict";

	/**
	 * Base class for all ArcGIS API layer types.
	 * @external Layer
	 * @see {https://developers.arcgis.com/javascript/jsapi/layer-amd.html Layer}
	 */

	lang.extend(Map, {
		/**
		 * Returns an array of all of the layers in the map that are currently visible.
		 * @returns external:Layer[]
		 */
		"getVisibleLayers": function () {
			var layer, visibleLayers = [], i, l;
			for (i = 0, l = this.layerIds.length; i < l; i += 1) {
				layer = this.getLayer(this.layerIds[i]);
				if (layer.visible === true && (layer.wsdotCategory === undefined || layer.wsdotCategory !== "Basemap")) {
					visibleLayers.push(layer);
				}
			}
			return visibleLayers;
		},
		/**
		 * Returns all graphics layers in the map.
		 * @returns {GraphicsLayer[]}
		 */
		"getGraphicsLayers": function () {
			var gfxLayers = [], layer, id, i;
			for (i = 0; i < this.graphicsLayerIds.length; i += 1) {
				id = this.graphicsLayerIds[i];
				layer = this.getLayer(id);
				if (layer.isInstanceOf(GraphicsLayer)) {
					gfxLayers.push(layer);
				}
			}
			return gfxLayers;

		},
		/**
		 * Returns the total number of graphics displayed on the map (in all graphics layers).
		 * @returns {number}
		 */
		"getGraphicsCount": function () {
			var graphicsLayers = this.getGraphicsLayers(),
						output = 0;

			// For each layer, get a collection of JSON graphic representations
			graphicsLayers.forEach(function (layer /*, layerIndex*/) {
				output += layer.graphics.length;
			});
			return output;
		},
		/**
		 * Returns all of the graphics in all of the graphics layers in the map.
		 * @returns {Object}
		 */
		"getGraphicsAsJson": function (options) {
			var graphicsLayers = this.getGraphicsLayers(),
						output = {};

			// Set default values for omitted options.
			if (options === undefined) {
				options = {
					removeInfoTemplate: true,
					removeSymbol: true
				};
			}
			if (options.removeInfoTemplate === undefined) {
				options.removeInfoTemplate = true;
			}
			if (options.removeSymbol === undefined) {
				options.removeSymbol = true;
			}

			// For each layer, get a collection of JSON graphic representations
			graphicsLayers.forEach(function (layer /*, layerIndex*/) {
				var graphics;
				if (layer.graphics.length > 0) {
					graphics = layer.getGraphicsAsJson();
					if (options.removeInfoTemplate === true || options.removeSymbol === true) {
						// Remove unwanted properties from each graphic representation as specified in the options object.
						graphics.forEach(function (graphic /*, gIndex*/) {
							if (graphic.infoTemplate !== undefined && options.removeInfoTemplate === true) {
								delete graphic.infoTemplate;
							}
							if (graphic.symbol !== undefined && options.removeSymbol === true) {
								delete graphic.symbol;
							}
						});
					}
					output[layer.id] = graphics;
				}
			});
			return output;
		}
	});
});