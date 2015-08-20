/*global define*/

define([
    "QueryStringManager"
], function (QueryStringManager) {
    "use strict";

    var exports = {};

    /**
     * Turns on the layers specified in the query string.
     * @param {esri/Map} map
     */
    exports.setupLayerListForQueryString = function (map) {
        var layersInfo, layerInfo, checkbox;

        /**
         * Gets the checkbox corresponding to the given layer id.
         * @param {string} layerId
         * @returns {HTMLInputElement}
         */
        function getCheckbox(layerId) {
            var layerList, checkbox;
            layerList = document.getElementById("layerList");
            checkbox = layerList.querySelector(["input[data-layer-id='", "']"].join(layerId));
            return checkbox;
        }

        /**
         * Returns unchecked checkboxes corresponding to sublayers with the given layer ID.
         * @returns {NodeList}
         */
        function createQuerySelectorString(/**{number[]}*/ ids) {
            var output;
            if (ids && Array.isArray(ids)) {
                output = ids.map(function (id) {
                    return ["li[data-sublayerid='", "']:not(.ui-layer-list-has-children) > input[type=checkbox]:not(:checked)"].join(id);
                }).join(",");
            }
            return output;
        }

        /**
         * Checks all of the checkboxes in a node list.
         * @param {NodeList.<HTMLInputElement>} checkboxes
         */
        function checkAllBoxes(checkboxes) {
            console.debug(checkboxes);
            for (var i = 0, l = checkboxes.length; i < l; i += 1) {
                checkboxes[i].checked = true;
            }
        }

        /**
         * Sets up sublayer checkboxes to be checked once they have been added to the DOM.
         * @param {HTMLListItemElement} item
         * @param {string} selector - query string selector.
         */
        function setupMutationObserver(item, selector) {
            var observer, config;
            if (!item) {
                console.error("item is null");
            } else {

                observer = new MutationObserver(function (/*mutations*/) {
                    var sublayerCheckboxes = item.querySelectorAll(selector);
                    checkAllBoxes(sublayerCheckboxes);
                    // Disconnect the observer, as it is no longer needed.
                    observer.disconnect();
                });

                config = {
                    attributes: false,
                    childList: true,
                    characterData: false
                };

                observer.observe(item, config);
            }
        }

        // Once the layer has loaded, set sublayers (if layer supports this).
        map.on("layer-add-result", function (e) {
            var checkbox, sublayerIds, sublayerCheckboxes, selector;
            if (!e.error && e.layer.setVisibleLayers) {
                checkbox = getCheckbox(e.layer.id);
                sublayerIds = checkbox.dataset.sublayers;
                if (!sublayerIds) {
                    console.warn("No sublayers array in checkbox's dataset", {
                        layer: e.layer,
                        checkbox: checkbox
                    });
                } else {
                    sublayerIds = JSON.parse(sublayerIds);
                    e.layer.setVisibleLayers(sublayerIds);
                    selector = createQuerySelectorString(sublayerIds);
                    console.debug(selector);
                    sublayerCheckboxes = checkbox.parentElement.querySelectorAll(selector);
                    if (!sublayerCheckboxes || !sublayerCheckboxes.length) {
                        // If the corresponding sublayer checkboxes don't yet exist, setup a mutation observer
                        // to check them once they are added.
                        setupMutationObserver(checkbox.parentNode, selector);
                    } else {
                        // If the checkboxes are already present, check them.
                        checkAllBoxes(sublayerCheckboxes);
                    }
                }
            }
        });

        // Update the layers' visibility to match the query string.
        layersInfo = QueryStringManager.getLayerVisibilityInfo();
        for (var layerId in layersInfo) {
            if (layersInfo.hasOwnProperty(layerId)) {
                // Check the layer's checkbox.
                checkbox = getCheckbox(layerId);
                if (checkbox && !checkbox.checked) {
                    layerInfo = layersInfo[layerId];
                    if (Array.isArray(layerInfo)) {
                        checkbox.dataset.sublayers = JSON.stringify(layerInfo);
                    }
                    checkbox.click();
                }
            }

        }
    };

    return exports;

});