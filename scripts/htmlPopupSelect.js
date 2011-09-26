/*global jQuery:true*/
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.3-vsdoc.js"/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.16/jquery-ui.js"/>

(function ($) {
    "use strict";

    $.widget("ui.htmlPopupSelect", {
        options: {
            mapServices: null // e.g, [{ id: "MyService1": url: "http://<catalog-url>/<serviceName>/MapServer"}]
        },
        _create: function () {
            var self = this;
            if (!self.options.mapServices) {
                throw new Error("No map service URLs defined.");
            }

            // Throw an error if the node type is not a select.
            if (!/select/i.test(self.element[0].nodeName)) {
                throw new Error("Unsupported node type.  Only a select element is supported.");
            }

            $.map(self.options.mapServices, function (mapService) {
                var mapGroup;
                // Query the map service to get the list of layers.
                $.get(mapService.url, { f: "json" }, function (mapServiceInfo, textStatus) {
                    if (/success/i.test(textStatus) && mapServiceInfo.layers) {
                        // Loop through all of the layers in the map.
                        $.map(mapServiceInfo.layers, function (layerInfo) {
                            var layerUrl = mapService.url + "/" + String(layerInfo.id);
                            // Query the layers to see if they support html Popups
                            $.get(layerUrl, { f: "json" }, function (layerResponse, textStatus) {
                                // If the map supports HTML popups, add the layer to the list.
                                if (/success/i.test(textStatus)) {
                                    if (typeof (layerResponse.htmlPopupType) !== "undefined" && layerResponse.htmlPopupType === "esriServerHTMLPopupTypeAsHTMLText") {
                                        // Create the optgroup for the current MAP service if it does not exist.
                                        if (!mapGroup) {
                                            mapGroup = $("<optgroup>").attr("label", mapService.id).appendTo(self.element).data("url", mapService.url);
                                        }
                                        // Add an option for the currrent layer.
                                        $("<option>").text(layerResponse.name).val(layerUrl).appendTo(mapGroup);
                                    }
                                    self._trigger("layerLoaded", self, {
                                        layerResponse: layerResponse,
                                        layerUrl: layerUrl
                                    });
                                } else {
                                    self._trigger("layerLoadFailed", self, layerUrl);
                                }
                            }, "jsonp");
                        });
                    }
                }, "jsonp");
            });
        }
    });


} (jQuery));