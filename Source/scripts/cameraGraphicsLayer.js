/*global esri, dojo, jQuery */
/*jslint white: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, maxerr: 50, indent: 4 */

/// <reference path="dojo.js.uncompressed.js" />


dojo.require("esri.layers.graphics");

dojo.declare("wsdot.layers.CameraGraphicsLayer", esri.layers.GraphicsLayer, {
    onRefreshStart: function () {
    },
    onRefreshEnd: function (error) {
    },
    constructor: function (options) {
        this.url = options.url;
        this._options = options;
        this.refresh();
    },
    refresh: function () {
        this.clear();
        this.onRefreshStart();

        var layer = this;

        return dojo.xhrGet({
            url: layer.url,
            handleAs: "json",
            load: function (data) {
                try {

                    var graphic;
                    var point;
                    dojo.forEach(data, function (graphicJson, index, array) {
                        point = esri.geometry.fromJson(graphicJson.geometry);
                        // Convert the point from geo. to WebMercator if that option was specified.
                        if (layer._options.toWebMercator) {
                            point = esri.geometry.geographicToWebMercator(point)
                        }
                        graphic = new esri.Graphic({ geometry: point, attributes: graphicJson.attributes });
                        layer.add(graphic);
                    }, layer);

                    layer.onRefreshEnd();
                } catch (e) {
                    layer.onRefreshEnd(e);
                }
            },
            error: function (error) {
                layer.onRefreshEnd(error);
            }
        }, { useProxy: false });
    }
});
