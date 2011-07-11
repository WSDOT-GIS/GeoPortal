/*global dojo, dijit, dojox, esri, wsdot, jQuery */
/*jslint devel: true, browser: true, vars: true, white: true, onevar: false, browser: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 50, indent: 4 */

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
        var sortByName = function (a, b) { return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0; };
        var data;
        if (featureSet.isInstanceOf && featureSet.isInstanceOf(esri.tasks.FeatureSet)) {
            var graphic;
            var nameAttribute = "NAME";
            data = { identifier: "name", label: "name", items: [] };
            var i, l;
            for (i = 0, l = featureSet.features.length; i < l; i += 1) {
                graphic = featureSet.features[i];
                data.items.push({
                    name: graphic.attributes[nameAttribute],
                    extent: graphic.geometry.getExtent()
                });
            }
            data.items.sort(sortByName);
            data = new dojo.data.ItemFileReadStore({ data: data });
        } else {
            featureSet.sort(sortByName);
            data = new dojo.data.ItemFileReadStore({ data: { identifier: "name", label: "name", items: featureSet} });
        }
        var filteringSelect = new dijit.form.FilteringSelect({
            id: this.attr("id"),
            name: "name",
            store: data,
            searchAttr: "name",
            required: false,
            onChange: function (/*newValue*/) {
                if (this.item && this.item.extent) {
                    var extent = this.item.extent[0];

                    // Set the extent of the map if a map has been defined.
                    if (map) {
                        try {
                            map.setExtent(extent);
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