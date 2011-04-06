/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js "/>

(function ($) {
    /// <summary>Creates a list of layers for a map.  The "this" keyword is the DOM element that will be turned into the layer list.</summary>
    $.fn.layerList = function (map, layerIds) {
        if (!layerIds) {
            layerIds = map.layerIds;
        }

        var layerListNode = this;

        // Add layer item to the layer list when it is added to the map.
        dojo.connect(map, "onLayerAddResult", layerListNode, function (layer, error) {
            if (!error) {
                var checkBox = $("<input>").attr("type", "checkbox").attr("data-layerId", layer.id);
                var label = $("<label>").text(layer.id);
                var layerDiv = $("<div>").attr("data-layerId", layer.id).append(checkBox).append(label);
                this.append(layerDiv);
            }
        });

        // When a map layer is removed, also remove it from the layer list.
        dojo.connect(map, "onLayerRemove", layerListNode, function (layer) {
            $("div[data-layerId='" + layer.id + "']").remove();
        });
    };
})(jQuery);