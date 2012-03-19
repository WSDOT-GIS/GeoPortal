/*global dojo, dijit, dojox, esri, wsdot, jQuery */
/*jslint devel: true, browser: true, vars: true, white: true, onevar: false, browser: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 50, indent: 4 */

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
This jQuery plugin is used to create a dojo Filtering Select dijit that allows the user to zoom to a predefined extend in an ArcGIS JavaScript API web application.
Prerequisites:
ArcGIS JavaScript API
jQuery
*/

(function ($) {
	"use strict";



	dojo.require("dijit.form.FilteringSelect");
	dojo.require("dojo.data.ItemFileReadStore");

	$.fn.extentSelect = function (featureSet, map) {
		/// <summary>Creates a dijit.form.FilteringSelect from a feature set.</summary>
		/// <param name="featureSet" type="esri.tasks.FeatureSet">A set of features returned from a query.</param>
		/// <param name="map" type="esri.Map">The map that will be zoomed when an extent is selected from this control.</param>
		/// <returns type="dijit.form.FilteringSelect" />

		// Set up the zoom select boxes.
		var sortByName, data, extentSpatialReference, filteringSelect;
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
							extent: null
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
				data = new dojo.data.ItemFileReadStore({ data: data });
			}());
		} else {
			// Convert items to Extents.
			data = { identifier: "name", label: "name", items: [] };
			(function (featureSet) {
				var i;
				for (i in featureSet) {
					if (featureSet.hasOwnProperty(i)) {
						if (typeof (featureSet[i].isInstanceOf) === "undefined") {
							data.items.push({
								name: i,
								extent: esri.geometry.fromJson(featureSet[i])
							});
						}
					}
				}
			} (featureSet));
			data.items.sort(sortByName);
			data = new dojo.data.ItemFileReadStore({ data: data });
		}
		filteringSelect = new dijit.form.FilteringSelect({
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
								map.centerAndZoom(point, 10);
							} else {
								map.setExtent(extent);
							}
						} catch (e) {
							if (console && console.debug) {
								console.debug(e);
							}
						}
					}
				}
				this.reset();
			}
		}, this.attr("id"));

		return filteringSelect;
	};
} (jQuery));