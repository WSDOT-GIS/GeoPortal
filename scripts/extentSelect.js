/*global require, jQuery, esri */


// Copyright ©2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

/*
This jQuery plugin is used to create a dojo Filtering Select dijit that allows the user to zoom to a predefined extend in an ArcGIS JavaScript API web application.
Prerequisites:
ArcGIS JavaScript API
jQuery
*/

(function ($) {
	"use strict";
	require(["dijit/form/FilteringSelect", "dojo/data/ItemFileReadStore"], function (FilteringSelect, ItemFileReadStore) {
		$.fn.extentSelect = function (featureSet, map, levelOrFactor) {
			/// <summary>Creates a dijit.form.FilteringSelect from a feature set.</summary>
			/// <param name="featureSet" type="esri.tasks.FeatureSet">A set of features returned from a query.</param>
			/// <param name="map" type="esri.Map">The map that will be zoomed when an extent is selected from this control.</param>
			/// <param name="levelOrFactor" type="number">See the levelOrNumber parameter of the <see href="http://help.arcgis.com/en/webapi/javascript/arcgis/help/jsapi/map.htm#centerAndZoom">esri.Map.centerAndZoom</see> function.</param>
			/// <returns type="dijit.form.FilteringSelect" />

			// Set up the zoom select boxes.
			var sortByName, data, extentSpatialReference, filteringSelect;
			if (levelOrFactor === undefined || levelOrFactor === null) {
				levelOrFactor = 10;
			}
			sortByName = function (a, b) { return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0; };
			extentSpatialReference = new esri.SpatialReference({ wkid: 102100 });


			if (featureSet.isInstanceOf && featureSet.isInstanceOf(esri.tasks.FeatureSet)) {
				(function () {
					var i, l, graphic, nameAttribute = "NAME";
					data = { identifier: "name", label: "name", items: [] };
					for (i = 0, l = featureSet.features.length; i < l; i += 1) {
						graphic = featureSet.features[i];
						if (graphic.geometry.isInstanceOf(esri.geometry.Point)) {
							data.items.push({
								name: graphic.attributes[nameAttribute],
								point: graphic.geometry,
								extent: null,
								levelOrFactor: levelOrFactor
							});
						} else {
							data.items.push({
								name: graphic.attributes[nameAttribute],
								point: null,
								extent: graphic.geometry.getExtent()
							});
						}
					}
					data.items.sort(sortByName);
					data = new ItemFileReadStore({ data: data });
				} ());
			} else {
				// Convert items to Extents.
				data = { identifier: "name", label: "name", items: [] };
				(function (featureSet) {
					var i;
					for (i in featureSet) {
						if (featureSet.hasOwnProperty(i)) {
							if (featureSet[i].isInstanceOf === undefined) {
								data.items.push({
									name: i,
									extent: esri.geometry.fromJson(featureSet[i])
								});
							}
						}
					}
				} (featureSet));
				data.items.sort(sortByName);
				data = new ItemFileReadStore({ data: data });
			}
			filteringSelect = new FilteringSelect({
				id: this.attr("id"),
				name: "name",
				store: data,
				searchAttr: "name",
				required: false,
				onChange: function (/*newValue*/) {
				    var extent, point;
					if (this.item && this.item.extent) {
						extent = this.item.extent[0];
						point = this.item.point ? this.item.point[0] : null;

						// Set the extent of the map if a map has been defined.
						if (map) {
							try {
								if (point) {
									map.centerAndZoom(point, this.item.levelOrFactor);
								} else {
								    extent.spatialReference.wkid = 3857;
									map.setExtent(extent);
								}
							} catch (e) {
								/*jslint devel:true*/
								if (console !== undefined && console.error !== undefined) {
									console.error(e);
								}
								/*jslint devel:false*/
							}
						}
					}
					this.reset();
				}
			}, this.attr("id"));

			return filteringSelect;
		};
	});
} (jQuery));