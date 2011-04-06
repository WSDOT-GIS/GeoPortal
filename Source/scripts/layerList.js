/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js "/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.11/jquery-ui.js"/>
/*global jQuery, dojo */
/*jslint browser: true, es5: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 500, indent: 4 */

(function ($) {
    /// <summary>
    /// Creates a list of layers for a map.  The "this" keyword is the jQuery object containing the DOM element(s) that will be turned into a layer list.
    /// </summary>
    $.fn.layerList = function (map) {
        var layerListNode = this;
        this.addClass("ui-esri-layer-list");

        // Add layer item to the layer list when it is added to the map.
        dojo.connect(map, "onLayerAddResult", layerListNode, function (layer, error) {
            if (!error) {
                // Create a checkbox and label and place inside of a div.
                var checkBox = $("<input>").attr("type", "checkbox").attr("data-layerId", layer.id);
                var label = $("<label>").text(layer.id);
                // Create an opacity slider for the layer.
                var opacitySlider = $("<div>").slider({
                    min: 0.0,
                    max: 1.0,
                    step: 0.1,
                    value: 1.0,
                    disabled: !layer.visible,
                    change: function (event, ui) {
                        layer.setOpacity(ui.value);
                    }
                });
                var layerDiv = $("<div>").attr("data-layerId", layer.id).append(checkBox).append(label).append(opacitySlider);


                // Add the div to the document.
                this.append(layerDiv);

                // Set the checked state to match the layer visibility of the layer.
                if (layer.visible) {
                    checkBox.attr("checked", layer.visible);
                }

                // Make the checkbox turn the layer on and off.
                checkBox.click(function (eventObject) {
                    layer.setVisibility(checkBox.attr("checked"));
                    opacitySlider.slider({ disabled: !checkBox.attr("checked") });
                });



            }
        });

        // When a map layer is removed, also remove it from the layer list.
        dojo.connect(map, "onLayerRemove", layerListNode, function (layer) {
            $("div[data-layerId='" + layer.id + "']").remove();
        });
    };
})(jQuery);