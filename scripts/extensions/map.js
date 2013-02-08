/*global require, esri*/
/*jslint white:true, nomen:true*/

// Copyright ©2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

require(["dojo/_base/lang", "dojo/_base/array", "esri/map"], function (lang, array) {
	"use strict";
	lang.extend(esri.Map, {
		/** Returns from the first tiled layer the tileInfo.lods property 
		* @returns [esri.layers.LOD]
		*/
		
		"getLods": function () {
			var layerId, layer, lods = null;
			for (layerId in this._layers) {
				if (this._layers.hasOwnProperty(layerId)) {
					layer = this._layers[layerId];
					if (layer.tileInfo) {
						if (layer.tileInfo.lods) {
							lods = layer.tileInfo.lods;
							break;
						}
					}
				}
			}
			return lods;
		},
		"getLOD": function (level) {
			/// <summary>Gets the current level of detail (LOD) for the map.</summary>
			/// <param name="level" type="Number">Optional.  If you know the current LOD ID, you can input it here.  Otherwise the esri.Map.getLevel() method will be called to get this value.</param>
			/// <returns type="esri.layers.LOD" />
			var lods, lod;
			lods = this.getLods();
			if (level === undefined) {
				level = this.getLevel();
			}
			lod = lods && lods.length >= level ? lods[level] : null;
			return lod;
		},
		"getScale": function (level) {
			/// <summary>Returns the current scale of the map.</summary>
			/// <param name="level" type="Number">Optional.  If you know the current LOD ID, you can input it here.  Otherwise the esri.Map.getLevel() method will be called to get this value.</param>
			/// <returns type="Number" />
			var lod = this.getLOD(level), output = null;
			if (lod) {
				output = lod.scale;
			}
			return output;
		},
		"getVisibleLayers": function () {
			/// <summary>Returns an array of all of the layers in the map that are currently visible.</summary>
			/// <returns type="Array" />
			var layer,
						visibleLayers = [],
						i, l;
			for (i = 0, l = this.layerIds.length; i < l; i += 1) {
				layer = this.getLayer(this.layerIds[i]);
				if (layer.visible === true && (layer.wsdotCategory === undefined || layer.wsdotCategory !== "Basemap")) {
					visibleLayers.push(layer);
				}
			}
			return visibleLayers;
		},
		"getGraphicsLayers": function () {
			/// <summary>Returns all graphics layers in the map.</summary>
			var gfxLayers = [],
						layer, id,
						i;
			for (i = 0; i < this.graphicsLayerIds.length; i += 1) {
				id = this.graphicsLayerIds[i];
				layer = this.getLayer(id);
				if (layer.isInstanceOf(esri.layers.GraphicsLayer) && !layer.isInstanceOf(esri.layers.FeatureLayer)) {
					gfxLayers.push(layer);
				}
			}
			return gfxLayers;

		},
		"getGraphicsCount": function () {
			/// <summary>Returns the total number of graphics displayed on the map (in all graphics layers).</summary>
			var graphicsLayers = this.getGraphicsLayers(),
						output = 0;

			// For each layer, get a collection of JSON graphic representations
			array.forEach(graphicsLayers, function (layer /*, layerIndex*/) {
				output += layer.graphics.length;
			});
			return output;
		},
		"getGraphicsAsJson": function (options) {
			/// <summary>Returns all of the graphics in all of the graphics layers in the map.</summary>
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
			array.forEach(graphicsLayers, function (layer /*, layerIndex*/) {
				var graphics;
				if (layer.graphics.length > 0) {
					graphics = layer.getGraphicsAsJson();
					if (options.removeInfoTemplate === true || options.removeSymbol === true) {
						// Remove unwanted properties from each graphic representation as specified in the options object.
						array.forEach(graphics, function (graphic /*, gIndex*/) {
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