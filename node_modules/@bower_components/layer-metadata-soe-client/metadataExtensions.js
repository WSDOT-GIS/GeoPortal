/*globals define */
/*jslint white:true */

/**
 * This JS file extends the esri.layer.Layers class to provide functions that work with WSDOT's Layer Metadata Server Object Extension (SOE).
 * @author Jeff Jacobson
 */

define([
    "dojo/_base/lang",
    "esri/request",
    "dojo/ready",
    "esri/layers/layer",
    "esri/layers/DynamicMapServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/FeatureLayer",
    "./MetadataClient"
], function (
    lang,
    esriRequest,
    ready,
    Layer,
    DynamicMapServiceLayer,
    ArcGISTiledMapServiceLayer,
    FeatureLayer,
    MetadataClient
) {
    "use strict";

    var layerUrlRe = /([\w\d\/\:%\.]+\/MapServer)(?:\/(\d*))?\/?$/i; // Match results: [full url, map server url, layer id]

    function getMapServerUrl(layer) {
        var url, match, output;
        if (layer) {
            if (typeof (layer) === "string") {
                url = layer;
            } else if (typeof (layer.url) === "string") {
                url = layer.url;
            } else {
                throw new TypeError("The layer parameter must be either a string or a Layer.");
            }
        } else {
            throw new TypeError("The layer parameter must be either a string or an external:Layer.");
        }

        match = url.match(layerUrlRe);

        if (match) {
            output = {
                mapServerUrl: match[1],
                layerId: match.length >= 3 && match[2] ? Number(match[2]) : null
            };
            if (isNaN(output.layerId)) {
                output.layerId = null;
            } else {
                return output;
            }
        } else {
            throw new Error("Invalid layer URL format.");
        }
    }

    function getMetadataSoeRootUrl(layer) {
        var output, url = getMapServerUrl(layer); // This will throw an Error if it fails.
        output = url.mapServerUrl + "/exts/LayerMetadata";
        return output;
    }

    function getValidLayersUrl(layer) {
        var url = getMapServerUrl(layer); // This will throw an Error if it fails.
        return url.mapServerUrl + "/exts/LayerMetadata/validLayers";
    }

    function getMetadataUrl(layer, sublayerId) {
        var urlInfo = getMapServerUrl(layer), output;
        if (urlInfo.layerId !== null) {
            sublayerId = urlInfo.layerId;
        }
        if (typeof (sublayerId) !== "number") {
            throw new Error("Invalid layer id.  Layer id must be an integer.");
        }
        output = urlInfo.mapServerUrl + "/exts/LayerMetadata/metadata/" + String(sublayerId);

        return output;
    }

    function getIdsOfLayersWithMetadata(layer, successHandler, failHandler) {
        var url = getMapServerUrl(layer).mapServerUrl;
        var client = new MetadataClient(url);
        var output = client.validLayers.then(function (sources) {
            var output;
            if (!sources) {
                output = null;
            } else {
                output = Array.isArray(sources) ? sources : sources.layerIds;
            }

            if (typeof successHandler === "function") {
                successHandler(output);
            }
            return output;
        }, function (error) {
            if (typeof failHandler === "function") {
                failHandler(error);
            }
        });
        return output;
    }

    function supportsMetadata(layer, successHandler, failHandler) {
        var url = getMapServerUrl(layer).mapServerUrl;
        var client = new MetadataClient(url);
        var promise = client.supportsMetadata;
        promise.then(function (isSupported) {
            if (isSupported && typeof successHandler === "function") {
                successHandler(isSupported);
            } else if (typeof failHandler === "function") {
                failHandler(isSupported);
            }
        }, function (error) {
            if (typeof failHandler === "function") {
                failHandler(error);
            }
        });
        return promise;
    }

    function addExtensions() {
        var i, l, ctor, f, f2, f3, multiLayerClasses = [DynamicMapServiceLayer, ArcGISTiledMapServiceLayer];


        lang.extend(Layer, {
            getIdsOfLayersWithMetadata: function (successHandler, failHandler) {
                return getIdsOfLayersWithMetadata(this, successHandler, failHandler);
            }
        });

        f = function (layerId, format) {
            return getMetadataUrl(this, layerId, format);
        };
        f2 = function () {
            return getMetadataSoeRootUrl(this);
        };

        f3 = function (successHandler, failHandler) {
            return supportsMetadata(this, successHandler, failHandler);
        };

        for (i = 0, l = multiLayerClasses.length; i < l; i += 1) {
            ctor = multiLayerClasses[i];
            lang.extend(ctor, {
                getMetadataUrl: f,
                getMetadataSoeRootUrl: f2,
                supportsMetadata: f3
            });
        }

        f = function (format) {
            return getMetadataUrl(this, null, format);
        };

        lang.extend(FeatureLayer, {
            getMetadataUrl: f
        });
    }

    ready(addExtensions);

    /**
     * @external Layer
     * @see {@link https://developers.arcgis.com/javascript/jsapi/layer-amd.html Class: Layer}
     * @borrows module:metadataExtension~getIdsOfLayersWithMetadata
     */

    /**
     * @external DynamicMapServiceLayer
     * @see {@link https://developers.arcgis.com/javascript/jsapi/dynamicmapservicelayer-amd.html Class: DynamicMapServiceLayer}
     */

    /**
     * @external ArcGISTiledMapServiceLayer
     * @see {@link https://developers.arcgis.com/javascript/jsapi/arcgistiledmapservicelayer-amd.html Class: ArcGISTiledMapServiceLayer}
     */

    /**
     * @external FeatureLayer
     * @see {@link https://developers.arcgis.com/javascript/jsapi/featurelayer-amd.html Class: Feature Layer}
     */

    /**
     * Extends the layer classes to add methods for calling the Layer Metadata SOE.
     * @exports metadataExtension
     * @deprecated
     */
    var exports = {
        /**
         * Examines a layer (or a layer URL) and returns the map service url and layer id parts as properties in the returned object.
         * @param {string|external:Layer} layer Either a map service or map service layer URL, or an external:Layer object.
         * @returns {Object} An object with the properties mapServerUrl and layerId.  mapServerUrl is the url to the map server (without any layerIDs).  layerId is the layer ID portion of the URL.  If the URL did not contain a layerID, this property will have a value of null.
         * @deprecated
         */
        getMapServerUrl: getMapServerUrl,
        /**
         * Given an external:Layer object or a layer URL, returns the URL for a query to the Layer Metadata SOE root page.
         * @param {string|external:Layer} layer Either a map service or map service layer URL, or an external:Layer object.
         * @returns {string} The URL to the SOE root.
         * @deprecated
         */
        getMetadataSoeRootUrl: getMetadataSoeRootUrl,
        /**
         * Given an external:Layer object or a layer URL, returns the URL for a query to the Layer Metadata SOE for a list of valid layer IDs.
         * @param {string|external:Layer} layer Either a map service or map service layer URL, or an external:Layer object.
         * @returns {string} The URL to a query for a list of valid layers.
         * @deprecated
         */
        getLayersWithMetadataUrl: getValidLayersUrl,
        /**
         * Returns the Layer Metadata SOE URL to retrieve the metadata for a map service feature layer.
         * @param {string|external:Layer} layer Either a map service or map service layer URL, or an external:Layer object.
         * @param {Number} [sublayerId] If the URL provided via the layer parameter does not contain a layer ID, this parameter must be used to supply one.  If the URL already has a layer ID, this parameter will be ignored.
         * @returns {Object.<string, string>} - Returns an object with a "mapServerUrl" property.
         * @deprecated
         */
        getMetadataUrl: getMetadataUrl,
        /**
         * Calls the SOE to get the list of layer IDs that correspond to feature layers.
         * @param {string|external:Layer} layer Either a map service or map service layer URL, or an external:Layer object.
         * @param {Function} Event handler function that is called when the query is successful.  Parameter "data" is an array of integers.
         * @param {Function} Event handler function that is called when the query fails.  Parameter "error" is an Error.
         * @returns {dojo/promise/Deferred.<number[]>}
         * @deprecated
         */
        getIdsOfLayersWithMetadata: getIdsOfLayersWithMetadata,
        /**
         * Tests to see if a layer supports metadata.
         * @param {external:Layer} layer - Either a map service or map service layer URL, or an external:Layer object.
         * @param {function} successHandler - Function that is called when metadata is supported.
         * @param {function} failHandler - Function that is called when metadata is not supported.
         * @returns {Promise.<Boolean>} - Returns a promise. When resolved, a boolean value indicates if the layer supports metadata.
         * @deprecated
         */
        supportsMetadata: supportsMetadata
    };

    return exports;
});
