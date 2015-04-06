/*global require, esri*/

require(["dojo/_base/lang", "dojo/_base/array", "esri/layers/graphics"], function (lang, array) {
	"use strict";
	lang.extend(esri.layers.GraphicsLayer, {
		"getGraphicsAsJson": function () {
			/// <summary>Returns an array of ArcGIS Server JSON graphics.</summary>
			return array.map(this.graphics, function (item) {
				// TODO: Make the projection to geographic optional.  For the purposes of this application, though, this works just fine.
				var geometry = esri.geometry.webMercatorToGeographic(item.geometry), json = item.toJson();
				json.geometry = geometry.toJson();
				return json;
			});
		}
	});

});