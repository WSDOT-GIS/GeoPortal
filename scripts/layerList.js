/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js "/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.11/jquery-ui.js"/>
/*global jQuery, dojo */
/*jslint browser: true, es5: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 500, indent: 4 */

(function ($) {
    dojo.require("dijit.form.Slider");
    dojo.require("dijit.form.CheckBox");

    function formatForHtmlId(s) {
        /// <summary>Removes invalid characters from a string so that it can be used an the ID for an HTML element.</summary>
        var invalidCharRe = /[\s\/\()]+/
        while (invalidCharRe.test(s)) {
            s = s.replace(invalidCharRe, "-");
        }
        s = s.replace(/-$/, "");
        return s;
    }

    /// <summary>
    /// Creates a list of layers for a layerSource.  The "this" keyword is the jQuery object containing the DOM element(s) that will be turned into a layer list.
    /// </summary>
    /// <param name="layerSource" type="Object">This can be either an esri.Map or an array of esri.layer.Layer</param>
    $.fn.layerList = function (layerSource) {
        var layerListNode = this;
        this.addClass("ui-esri-layer-list");

        function createControlsForLayer(layer, autoAppend) {
            var layerIdForHtml = formatForHtmlId(layer.id);

            // Create a checkbox and label and place inside of a div.
            var checkBox = $("<input>").attr("type", "checkbox").attr("data-layerId", layer.id).attr("id", layerIdForHtml);
            var label = $("<label>").text(layer.id);

            // Create a unique ID for the slider for this layer.
            var sliderId = "layerSlider-" + layerIdForHtml;
            var opacitySlider = $("<div>").attr("id", sliderId).css("width", "300px");
            var layerDiv = $("<div>").attr("data-layerId", layer.id).append(checkBox).append(label).append(opacitySlider);

            // Add the div to the document.
            if (typeof (autoAppend) === "undefined" || autoAppend) {
                layerListNode.append(layerDiv);
            }

            // Create an opacity slider for the layer.
            opacitySlider = new dijit.form.HorizontalSlider({
                minimum: 0.0,
                maximum: 1.0,
                value: 1.0,
                discreteValues: 100,
                showButtons: true,
                onChange: function (value) {
                    layer.setOpacity(value);
                },
                disabled: layer.visible !== true
            }, dojo.byId(sliderId));

            // Create the checkbox dijit.
            checkBox = new dijit.form.CheckBox({
                checked: layer.visible,
                onChange: function (value) {
                    layer.setVisibility(value);
                    opacitySlider.set("disabled", !value);
                }
            }, dojo.byId(checkBox.attr("id")));

            return layerDiv;
        }

        // TODO: Add ablility to omit basemap layers OR omit layers with an ID matching a Regex.

        if (layerSource.isInstanceOf && layerSource.isInstanceOf(esri.Map)) {
            // Add layer item to the layer list when it is added to the layerSource.
            dojo.connect(layerSource, "onLayerAddResult", layerListNode, function (layer, error) {
                if (!error) {
                    createControlsForLayer(layer);
                }
            });

            // When a layerSource layer is removed, also remove it from the layer list.
            dojo.connect(layerSource, "onLayerRemove", layerListNode, function (layer) {
                $("div[data-layerId='" + layer.id + "']").remove();
            });
        } else {
            // Assume an array of layers.

            // Group layers into categories.
            var layerGroups = {};
            var layer;
            for (var i = 0, layerCount = layerSource.length; i < layerCount; i++) {
                layer = layerSource[i];
                if (layer.wsdotCategory) {
                    // Create the category if it is not already defined.
                    if (!layerGroups[layer.wsdotCategory]) {
                        layerGroups[layer.wsdotCategory] = [layer];
                    }
                    else {
                        layerGroups[layer.wsdotCategory].push(layer);
                    }
                } else {
                }
            }


            var groupNames = [];
            for (var g in layerGroups) {
                groupNames.push(g);
            }
            groupNames.sort();

            var layerGroup;
            var groupDiv;
            var groupName;

            for (var groupNameIndex in groupNames) {
                groupName = groupNames[groupNameIndex];
                layerGroup = layerGroups[groupName];
                // Sort the layers in each group by the value of their id properties
                layerGroup.sort(function (a, b) {
                    if (a.id > b.id) { return 1; }
                    else if (a.id < b.id) { return -1; }
                    else { return 0; }
                });

                // Create a new div for each group.
                groupDiv = $("<div>");
                groupDiv.attr("data-group", groupName);
                groupDiv.append($("<span>").html(groupName).addClass("esriLegendServiceLabel"));

                // Add controls for each layer in the group.
                for (var i = 0, l = layerGroup.length; i < l; i++) {
                    layer = layerGroup[i];
                    layerDiv = createControlsForLayer(layer);
                    groupDiv.append(layerDiv);
                }
                layerListNode.append(groupDiv);
            }
        }
    }
})(jQuery);