/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.1-vsdoc.js  "/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.11/jquery-ui.js"/>
/*global jQuery, dojo */
/*jslint browser: true, es5: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 500, indent: 4 */

// Copyright ©2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

// This script gives existing ArcGIS JavaScript API types additional methods and properties.

require(["dojo/_base/lang", "esri/map", "esri/layers/FeatureLayer"], function (lang) {
	"use strict";

	lang.extend(esri.layers.LayerInfo, {
		isGroupLayer: function () {
			return this.sublayerIds !== null;
		},
		isVisibleAt: function (scale) {
			/// <summary>Determines if the current sublayer can be seen at the current scale.</summary>
			// The minScale and maxScale properties of the LayerInfo object are not available from layers based on pre-version 10 SP1 map services.
			// Return true if there is no scale information;
			/// <returns type="Boolean" />
			if (typeof (this.minScale) === "undefined" || typeof (this.maxScale) === "undefined") {
				return true;
			} else {
				return (this.minScale === 0 || this.minScale >= scale) && (this.maxScale === 0 || this.maxScale <= scale);
			}
		},
		supportsHtmlPopup: null
	});

	lang.extend(esri.layers.Layer, {
		getVisibleLayerInfos: function (scale) {
			/// <summary>Returns only the layerInfos that are visible at the given scale.</summary>
			/// <returns type="esri.layers.LayerInfo[]" />
			if (typeof (this.layerInfos) === "undefined") {
				return null;
			}

			var visibleLayerInfos = [];
			dojo.forEach(this.layerInfos, function (layerInfo) {
				if (layerInfo.isVisibleAt(scale)) {
					visibleLayerInfos.push(layerInfo);
				}
			});
			return visibleLayerInfos;
		},
		areAnySublayersVisible: function (scale) {
			/// <summary>Determines if any of the sublayers in the layer are visible at the current scale.  Only supported for ArcGIS 10.01 and higher map services.</summary>
			if (this.version < 10.01) {
				return true;
			} else {
				var visibleLayerInfos = this.getVisibleLayerInfos();
				return visibleLayerInfos.length > 0;
			}
		}
	});


	lang.extend(esri.layers.FeatureLayer, {
		isVisibleAt: function (scale) {
			/// <summary>Determines if the current sublayer can be seen at the current scale.</summary>
			// The minScale and maxScale properties of the LayerInfo object are not available from layers based on pre-version 10 SP1 map services.
			// Return true if there is no scale information;
			/// <returns type="Boolean" />
			if (typeof (this.minScale) === "undefined" || typeof (this.maxScale) === "undefined") {
				return true;
			} else {
				return (this.minScale === 0 || this.minScale >= scale) && (this.maxScale === 0 || this.maxScale <= scale);
			}
		}
	});
});
