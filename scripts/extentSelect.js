/*global define */

// Creates a dojo Filtering Select dijit that allows the user to zoom to a predefined extend in an ArcGIS JavaScript API web application.

define([
    "dijit/form/FilteringSelect",
    "dojo/data/ItemFileReadStore",
    "esri/graphic",
    "esri/geometry/jsonUtils",
    "esri/geometry/Point",
    "esri/tasks/FeatureSet",
    "esri/SpatialReference",
    "esri/InfoTemplate"
], function (FilteringSelect, ItemFileReadStore, Graphic, geometryJsonUtils, Point, FeatureSet, SpatialReference, InfoTemplate) {
    "use strict";

    /**
     * Returns the name of the first attribute of a graphic that is of type "string".
     * @param {Graphic} graphic
     * @returns {(string|null)} - Returns a string if a string attribute is found, null otherwise.
     */
    function getFirstStringAttribute(graphic) {
        var propName, output = null;
        for (propName in graphic.attributes) {
            if (graphic.attributes.hasOwnProperty(propName)) {
                if (typeof graphic.attributes[propName] === "string") {
                    output = propName;
                    break;
                }
            }
        }
        return output;
    }

    /**
     * Gets the center point of a geometry or graphic.
     * @param {Geometry|Graphic} graphicOrGeometry
     * @returns {Point} Returns self, centroid, center, or extent's center for point, polygon, extent, and polyline, respectively.
     */
    function getCenter(graphicOrGeometry) {
        var g = graphicOrGeometry.geometry || graphicOrGeometry;
        var point;
        if (g.type === "point") {
            point = g;
        } else if (g.getCentroid) {
            point = g.getCentroid();
        } else if (g.getCenter) {
            point = g.getCenter();
        } else if (g.getExtent) {
            point = g.getExtent().getCenter();
        }
        return point || null;
    }

    /**
     * Gets the extent of a geometry or a graphic's geometry.
     * @param {Geometry|Graphic} graphicOrGeometry
     * @returns {Extent}
     */
    function getExtent(graphicOrGeometry) {
        var g = graphicOrGeometry.geometry || graphicOrGeometry;
        var extent;
        if (g.type === "extent") {
            extent = g;
        } else if (g.getExtent) {
            extent = g.getExtent();
        }
        return extent || null;
    }

    function getFirstAttribute(graphic) {
        var attributes = graphic.attributes;
        var output;

        for (var name in attributes) {
            if (attributes.hasOwnProperty(name)) {
                output = attributes[name];
            }
            if (output) {
                break;
            }
        }

        return output;
    }

    /**
     * Creates a dijit.form.FilteringSelect from a feature set.
     * @param {HTMLElement} domElement
     * @param {esri/tasks/FeatureSet} featureSet - A set of features returned from a query.
     * @param {esri/Map} map - The map that will be zoomed when an extent is selected from this control.
     * @param {number} levelOrFactor - See the levelOrFactor parameter of the esri.Map.centerAndZoom function.
     * @returns {dijit/form/FilteringSelect}
     */
    function createExtentSelect(domElement, featureSet, map, levelOrFactor) {

        if (!domElement) {
            throw new TypeError("domElement not provided.");
        } else if (typeof domElement === "string") {
            domElement = document.getElementById(domElement);
        }

        // Set up the zoom select boxes.
        var sortByName, data, extentSpatialReference, filteringSelect;
        if (levelOrFactor === undefined || levelOrFactor === null) {
            levelOrFactor = 10;
        }
        sortByName = function (a, b) { return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0; };
        extentSpatialReference = new SpatialReference({ wkid: 102100 });

        var infoTemplate = new InfoTemplate("Zoomed to", getFirstAttribute);

        if (featureSet.isInstanceOf && featureSet.isInstanceOf(FeatureSet)) {
            (function () {
                var i, l, graphic, nameAttribute = "NAME";
                data = { identifier: "name", label: "name", items: [] };
                for (i = 0, l = featureSet.features.length; i < l; i += 1) {
                    graphic = featureSet.features[i];
                    graphic.setInfoTemplate(infoTemplate);
                    if (!graphic.attributes.hasOwnProperty(nameAttribute)) {
                        nameAttribute = getFirstStringAttribute(graphic);
                    }
                    if (graphic.geometry.isInstanceOf(Point)) {
                        data.items.push({
                            name: graphic.attributes[nameAttribute],
                            feature: graphic,
                            levelOrFactor: levelOrFactor
                        });
                    } else {
                        data.items.push({
                            name: graphic.attributes[nameAttribute],
                            feature: graphic
                        });
                    }
                }
                data.items.sort(sortByName);
                data = new ItemFileReadStore({ data: data });
            }());
        }

        filteringSelect = new FilteringSelect({
            id: domElement.id,
            name: "name",
            store: data,
            searchAttr: "name",
            required: false,
            onChange: function (newValue) {
                var feature, popup, center, extent;

                if (this.item && this.item.feature) {
                    feature = this.item.feature[0];
                    if (map && feature) {
                        popup = map.infoWindow;
                        popup.setFeatures([feature]);
                        popup.select(0);
                        center = getCenter(feature);
                        extent = getExtent(feature);
                        if (this.item.levelOrFactor) {
                            map.centerAndZoom(center, levelOrFactor);
                        } else {
                            map.centerAt(center);
                            map.setExtent(extent, true);
                        }
                        popup.show(center);
                    }
                }
                this.reset();
            }
        }, domElement);

        return filteringSelect;
    }

    return createExtentSelect;
});
