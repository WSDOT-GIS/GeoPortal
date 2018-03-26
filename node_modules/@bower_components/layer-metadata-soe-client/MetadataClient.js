(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.

        // Node doesn't support fetch natively, so this capability must be loaded.
        module.exports = factory(require("node-fetch"));
    } else {
        // Browser globals (root is window)
        root.MetadataClient = factory();
    }
}(this, function (fetchPolyfill) {

    /**
     * @module MetadataClient
     */

    var validLayersUrl = "exts/LayerMetadata/validLayers?f=json";
    var layerSourcesUrl = "exts/LayerMetadata/layerSources?f=json";
    var metadataUrl = "exts/LayerMetadata/metadata";

    // Enable fetch in node.
    // Browser polyfills will be handled with browser script tags.
    if (fetchPolyfill) {
        fetch = fetchPolyfill;
    }

    /**
     * Determines if an array contains a specific string.
     * @param {string[]} a - An array
     * @param {string} s - a string
     * @returns {Boolean} - Returns true if it does, false if it doesn't.
     */
    function arrayContainsString(a, s) {
        var output = false;
        for (var i = 0; i < a.length; i++) {
            if (a[i] === s) {
                output = true;
                break;
            }
        }
        return output;
    }


    /**
     * @alias module:MetadataClient
     * @constructor
     * @param {string} url - URL to a map service.
     * @throws {TypeError} thrown if no map service URL is provided.
     */
    function MetadataClient(url) {
        if (typeof url === "object" && url.url) {
            url = url;
        }
        if (!url) {
            throw new TypeError("No map service URL provided.");
        }

        var _supportsMetadata;
        var _layerSources;

        var self = this;

        Object.defineProperties(this, {
            /**
             * @member {string} - Map service URL
             */
            url: {
                value: url.replace(/\/$/, "") // Remove trailing slash
            },
            /**
             * @member {Promise.<Boolean>} - Tests a map service to see if it supports the Layer Metadata SOE.
             * First call submits an HTTP request. Subsequent calls do not.
             * Returns a promise that, when resolved, returns a boolean value
             * indicating if the service supports the layer metadata capability.
             * @example
             * var client = new MetadataClient("http://data.wsdot.wa.gov/arcgis/rest/services/Shared/CountyBoundaries/MapServer");
             * client.supportsMetadata.then(function (isSupported) {
             *      console.log("layer does " + isSupported ? "" : "not " + "support metadata");
             * });
             */
            supportsMetadata: {
                get: function () {
                    return new Promise(function (resolve, reject) {
                        if (typeof _supportsMetadata === "boolean") {
                            resolve(_supportsMetadata);
                        } else {
                            fetch(url + "?f=json").then(function (response) {
                                return response.json();
                            }).then(function (serviceInfo) {
                                var supportedExtensions = serviceInfo && serviceInfo.supportedExtensions ? serviceInfo.supportedExtensions.split(/[,\s]+/) : null;
                                _supportsMetadata = Array.isArray(supportedExtensions) && arrayContainsString(supportedExtensions, "LayerMetadata");
                                resolve(_supportsMetadata);
                            });
                        }
                    });
                }
            },
            /**
             * @member {Promise.<Object.<string, number[]>>} - Returns list of layers that have metadata associated with them,
             * grouped by common data source.
             * @example
             * var client = new MetadataClient("http://data.wsdot.wa.gov/arcgis/rest/services/Shared/CountyBoundaries/MapServer");
             * client.layerSources.then(function (layerSources) {
             *     console.debug(layerSources);
             * }, function (error) {
             *     console.error(error);
             * });
             * // Output:
             * // {
             * //  "GeodataExternalReplica.DBO.sr24kIncrease": [ 0, 1, 4 ],
             * //  "GeodataExternalReplica.DBO.sr24kDecrease": [ 2 ],
             * //  "GeodataExternalReplica.DBO.sr24kRamp": [ 3 ],
             * //  "GeodataExternalReplica.DBO.LAPR_Lines": [ 5, 6 ]
             * // }
             */
            layerSources: {
                get: function () {
                    return self.supportsMetadata.then(function (isSupported) {
                        var requestUrl = [url, layerSourcesUrl].join("/");

                        if (!isSupported) {
                            return false;
                        } else {
                            return fetch(requestUrl).then(function (response) {
                                return response.json();
                            });
                        }
                    });
                }
            },
            /**
             * Gets URLs to unique metadata items.
             * @returns {Object.<string, string>} - Key value pairs. Keys are table names and values are metadata URLs.
             */
            metadataLinks: {
                get: function () {
                    return self.layerSources.then(function (layerSources) {
                        var requestUrl = [url, metadataUrl].join("/");
                        var output = {};
                        for (var key in layerSources) {
                            output[key] = [requestUrl, layerSources[key][0]].join("/");
                        }
                        return output;
                    });
                }
            },
            validLayers: {
                get: function () {
                    return self.supportsMetadata.then(function (supportsMetadata) {
                        var requestUrl = [url, validLayersUrl].join("/");
                        if (supportsMetadata) {
                            return fetch(requestUrl).then(function (response) {
                                return response.json();
                            });
                        } else {
                            return null;
                        }
                    });
                }
            }
        });
    }

    return MetadataClient;
}));