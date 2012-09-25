/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.1-vsdoc.js  "/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.11/jquery-ui.js"/>
/*global jQuery, dojo */
/*jslint browser: true, es5: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 500, indent: 4 */

/*
Copyright (c) 2011 Washington State Department of Transportation

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

/*
This script gives existing ArcGIS JavaScript API types additional methods and properties.
Prerequisites:
	ArcGIS JavaScript API
*/

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
