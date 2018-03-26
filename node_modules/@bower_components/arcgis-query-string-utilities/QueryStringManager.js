/// <reference path="./bower_components/polyfills/url.js" />
/*global define*/
define(function () {
    "use strict";

    function getVisibleLayersQSValue(map) {
        var layersObj = {};

        function loop(layerIds, filterOutBasemaps) {
            var layer, layerId;
            for (var i = 0, l = layerIds.length; i < l; i += 1) {
                layerId = layerIds[i];
                layer = map.getLayer(layerId);
                if (!layer.visible) {
                    continue;
                }

                if (!map.basemapLayerIds) {
                    console.warn("esri/Map.basemapLayerIds is undefined");
                } else if (filterOutBasemaps && map.basemapLayerIds.indexOf(layerId) !== -1) {
                    continue;
                }


                if (layer.setVisibleLayers) {
                    layersObj[layerId] = layer.visibleLayers;
                } else {
                    layersObj[layerId] = true;
                }
            }
        }

        loop(map.layerIds, true);
        loop(map.graphicsLayerIds);

        return layersObj;
    }

    /**
     * Parses a comma separated number string into an array of numbers.
     * @param {string} s
     * @returns {number[]}
     */
    function parseFloatArray(s) {
        return s.split(",").map(function (n) { return parseFloat(n); });
    }

    /**
     * Uses a Map's geographicExtent property to determine it's center.
     * @param {esri/Map} map
     * @returns {number[]} An array of two values: x and y coordinates of the center of the map.
     */
    function getCenter(map) {
        var gx, x, y;
        gx = map.geographicExtent;
        x = gx.xmax - ((gx.xmax - gx.xmin) / 2);
        y = gx.ymax - ((gx.ymax - gx.ymin) / 2);
        return [x, y];
    }

    /**
     * Updates the URL's query string in the browser as the map is changed.
     * @param {esri/Map} map
     */
    var QueryStringManager = function (map) {
        this.map = map;

        /**
         * Updates the query string in the browsers URL when the map
         * is zoomed or if a layer's visibility changes.
         * @this {(esri/Map|esri/layers/Layer)}
         */
        var updateQueryString = function (e) {
            var state, layer, layersValue;

            /*jshint eqnull:true*/
            if (e == null) {
                throw new Error("No event parameter was provided.");
            }
            /*jshint eqnull:false*/


            var url = new URL(window.location.href);

            layersValue = url.searchParams.get("layers");
            if (layersValue) {
                try {
                    layersValue = JSON.parse(layersValue);
                } catch (err) {
                    console.warn("Error parsing JSON", err);
                    layersValue = getVisibleLayersQSValue(map);
                }
            } else {
                layersValue = getVisibleLayersQSValue(map);
            }
            state = {
                center: getCenter(map),
                zoom: map.getLevel(), //e.lod.level,
                layers: layersValue
            };

            if (e.lod) {
                url.searchParams.set("center", state.center.join(","));
                url.searchParams.set("zoom", state.zoom);
            } else if (e.hasOwnProperty("visible") || e.hasOwnProperty("visibleLayers") || e.hasOwnProperty("layer")) {
                layer = e.layer || this;

                if (layer.visible) {
                    // TODO: Add or update layers object
                    if (layer.visibleLayers) {
                        layersValue[layer.id] = layer.visibleLayers;
                    } else {
                        layersValue[layer.id] = true;
                    }
                } else {
                    // Remove this layer from the query string layers object.
                    if (layersValue.hasOwnProperty(layer.id)) {
                        delete layersValue[layer.id];
                    }
                }
                state.layers = layersValue;
                url.searchParams.set("layers", JSON.stringify(layersValue));
            }



            history.replaceState(state, document.title, url.toString());
        };

        map.on("extent-change", updateQueryString);

        function setEventsForLayer(layer) {
            layer.on("visibility-change", updateQueryString);
            if (layer.setVisibleLayers) {
                layer.on("visible-layers-change", updateQueryString);
            }
        }

        // Attach layer events for layers currently in the map.
        [map.layerIds, map.graphicsLayerIds].forEach(function (layerIds) {
            layerIds.forEach(function (id) {
                var layer = map.getLayer(id);
                setEventsForLayer(layer);
            });
        });

        // Add event handler for map so that newly added layers will also be in the query string.
        map.on("layer-add-result", function (e) {
            if (e.layer) {
                setEventsForLayer(e.layer);
            }
            updateQueryString(e);
        });
    };

    /**
     * Gets an options object using options defined in the query string.
     * @param {Object} [options] - If an object is provided, the query string options will be added to it. Otherwise a new object will be created.
     * @returns {Object}
     */
    QueryStringManager.getMapInitOptions = function (options) {
        // If no options were specified, create a new one.
        options = options || {};
        var url, center, zoom;
        url = new URL(window.location.href);
        // Get the center from the URL.
        center = url.searchParams.get("center");
        if (center) {
            center = parseFloatArray(center);
            options.center = center;
        }
        // Get the zoom from the URL
        zoom = url.searchParams.get("zoom");
        if (zoom) {
            zoom = parseInt(zoom, 10);
            options.zoom = zoom;
        }

        return options;
    };

    /**
     * Retrieves the layer info from the query string.
     * @returns {Object.<string, number[]>}
     */
    QueryStringManager.getLayerVisibilityInfo = function () {
        var url, layerInfo;
        url = new URL(window.location.href);
        layerInfo = url.searchParams.get("layers") || null;

        if (layerInfo) {
            try {
                layerInfo = JSON.parse(layerInfo);
            } catch (e) {
                layerInfo = null;
                console.warn("Could not parse layer info data from query string", layerInfo);
            }
        }

        return layerInfo;
    };

    return QueryStringManager;
});