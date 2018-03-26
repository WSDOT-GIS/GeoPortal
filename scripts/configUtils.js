/*global define, Promise, wsdot*/
define(function () {
    "use strict";
    var exports = {}, defaultConfigUrl = "config/config.json";
    /**
     * Converts an collection of layer definition objects 
     * (either an array or arrays grouped into properties of an object)
     * into an array of layer definitions.
     * 
     * If the input is an array, the output will simply be the input.
     * @param {(Object)|(Object[])} layers
     * @returns {Object[]}
     */
    function getLayerArray(layers) {
        var output = null, propName, value;
        if (layers) {
            if (layers instanceof Array) {
                output = layers;
            } else if (typeof layers === "object") {
                output = [];
                for (propName in layers) {
                    if (layers.hasOwnProperty(propName)) {
                        value = layers[propName];
                        value = getLayerArray(value);
                        if (value) {
                            output = output.concat(value);
                        }
                    }
                }
            }
        }
        return output;
    }

    /**
     * Gets the config file specified by the query string.
     * @returns {string}
     */
    function getConfigUrl() {
        // Get the query string parameters.
        var output = defaultConfigUrl;
        var qsconfig = location.search.match(/\bconfig=([^=&]+)/);
        qsconfig = qsconfig ? qsconfig[1] : null;
        // If the config parameter has not been specified, return the default.
        if (qsconfig) {
            if (/\//g.test(qsconfig)) {
                output = [qsconfig, ".json"].join("");
            } else {
                output = ["config/", qsconfig, ".json"].join("");
            }
        }
        return output;
    }

    /**
     * Gets all of the layer IDs of layers that are specified with the `visible` option set to true.
     * @returns {Object[]}
     */
    function getVisibleLayerIdsFromConfig() {
        var layers = wsdot.config.layers, output = [], i, l, layer;
        if (layers) {
            layers = getLayerArray(layers);
            for (i = 0, l = layers.length; i < l; i += 1) {
                layer = layers[i];
                if (layer.options && layer.options.visible && layer.options.id) {
                    output.push(layer.options.id);
                }
            }
        }
        return output;
    }

    exports.getVisibleLayerIdsFromConfig = getVisibleLayerIdsFromConfig;

    exports.getConfig = function () {
        var url = getConfigUrl();
        var promise = new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open("get", url);
            request.onloadend = function () {
                var textStatus, bodyText;
                if (this.status === 200) {
                    wsdot.config = JSON.parse(this.response);
                    ////doPostConfig();
                    resolve(wsdot.config);
                } else {
                    // Detect the error that occurs if the user tries to access the airport power user setting via config query string parameter.
                    // Redirect to the aspx page which will prompt for a log in.
                    textStatus = this.statusText;
                    if (/parsererror/i.test(textStatus) && /^AIS\/config.js(?:on)?$/i.test(request.url)) {
                        bodyText = "<p>You need to <a href='AirportPowerUser.aspx'>log in</a> to access this page.</p>";
                        // location.replace("AirportPowerUser.aspx");
                    } else {
                        bodyText = "<p class='ui-state-error ui-corner-all'>Error: Invalid <em>config</em> parameter.</p>";
                    }
                    document.body.removeAttribute("class");
                    document.body.innerHTML = bodyText;
                    reject(bodyText);
                }
            };
            request.send();
        });
        return promise;
    };

    return exports;
});