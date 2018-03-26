/*global require*/
require([
    "esri/arcgis/utils",
    "esri/map",
    "QueryStringManager",
    "LayerList"
], function (arcgisUtils, Map, QueryStringManager, LayerList) {
    "use strict";
    var mapId = "927b5daaa7f4434db4b312364489544d";

    var createMapOptions = {
        usePopupManager: true
    };


    /**
     * Gets the layer's position in its collection (either map.graphicsLayersIds or map.layerIds).
     * @param {esri/Map} map
     * @param {string} layerId
     * @returns {number}
     */
    function getLayerOrdinal(map, layerId) {
        var ord = null, i, l;

        for (i = 0, l = map.graphicsLayerIds.length; i < l; i += 1) {
            if (map.graphicsLayerIds[i] === layerId) {
                ord = i + 1;
                break;
            }
        }

        if (ord === null) {
            for (i = 0, l = map.layerIds.length; i < l; i += 1) {
                if (map.layerIds[i] === layerId) {
                    ord = i + 1;
                    break;
                }
            }
        }

        return ord;
    }

    function setupMap(response) {
        // Get the map object.
        var map = response.map;

        // TODO: Delete global map variable.
        window.theMap = map;

        // Create the QueryStringManager.
        new QueryStringManager(map);

        // Create the layer list (for testing layer and sublayer visibility changes)
        var opLayers = response.itemInfo.itemData.operationalLayers;
        var layerList = new LayerList(opLayers, document.getElementById("toc"));

        // Update layer list items to show if they are not visible due to zoom scale.
        function updateScale() {
            layerList.setScale(map.getScale());
        }

        // Setup scale classes in layer list.
        updateScale();
        map.on("zoom-end", function () {
            updateScale();
        });

        // Setup layer handling.
        layerList.root.addEventListener("layer-move", function (e) {
            var detail = e.detail;
            var movedLayerId = detail.movedLayerId;
            var targetLayerId = detail.targetLayerId;

            var movedLayer = map.getLayer(movedLayerId);

            var targetLayerOrd = getLayerOrdinal(map, targetLayerId);

            if (targetLayerOrd !== null) {
                map.reorderLayer(movedLayer, targetLayerOrd);
            }
        });

        // Update the layers' visibility to match the query string.
        var layersInfo = QueryStringManager.getLayerVisibilityInfo();
        var layerInfo, checkbox, qs, layer;
        for (var layerId in layersInfo) {
            if (layersInfo.hasOwnProperty(layerId)) {
                qs = ["input[value='", "']"].join(layerId);
                checkbox = layerList.root.querySelector(qs);
                if (checkbox) {
                    checkbox.checked = true;
                    layer = map.getLayer(layerId);
                    layer.suspend();
                    layer.show();
                    layerInfo = layersInfo[layerId];
                    // set sublayers.
                    if (layer.setVisibleLayers && Array.isArray(layerInfo)) {
                        layer.setVisibleLayers(layerInfo);
                    }
                    layer.resume();
                } else {
                    console.warn("checkbox not found", qs);
                }
            }

        }
    }

    // Update the map constructor options with those defined in the query string.
    createMapOptions.mapOptions = QueryStringManager.getMapInitOptions(createMapOptions);

    arcgisUtils.createMap(mapId, "map", createMapOptions).then(setupMap);





});