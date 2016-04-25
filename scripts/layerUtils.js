define(function () {
    "use strict";

    /**
     * @module layerUtils
     */

    var exports = {};

    /**
     * Creates a label for a layer based on its URL.
     * @param {esri/layers/Layer} layer - A layer.
     * @returns {string} A label for the layer base on the layer's URL.
     */
    exports.createLayerNameFromUrl = function (layer) {
        var svcNameRe = /\/(\w+)\/MapServer/i;
        var match;
        var output = null;
        // Get the layer name from the URL.
        if (layer && layer.url) {
            match = layer.url.match(svcNameRe);
            if (match) {
                output = match[1];
            }
        }
        var re = /([a-z])([A-Z])([a-z])/g;
        output = output.replace(re, "$1 $2$3");
        output = output.replace("_", " ");
        return output;
    }

    return exports;

});