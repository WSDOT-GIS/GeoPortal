/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js "/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.11/jquery-ui.js"/>
/*global jQuery, dojo */
/*jslint browser: true, es5: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 500, indent: 4 */

(function ($) {
    $.fn.locationInfo = function (layerListUrl) {
        var uiNode = this;
        this.addClass("ui-location-info");
        var nodes = {};
        nodes.bufferControl = $("<div>");
        nodes.bufferControl.addClass("wsdot-location-info-buffer").append("<label>Buffer</label>");

        nodes.bufferValue = $("<input type='number' value='0' class='wsdot-location-info-buffer-size'>");
        nodes.bufferControl.append(nodes.bufferValue);

        nodes.bufferUnitSelect = $("<select class='unit-select'>");
        nodes.bufferUnitSelect.append("<option value='Foot'>Foot</option>");
        nodes.bufferControl.append(nodes.bufferUnitSelect);

        this.append(nodes.bufferControl);

        nodes = {};
        nodes.dataSets = $("<table class='wsdot-location-info-layer-table'><thead><tr><th></th><th>Layer</th><th>Metadata</th></tr></thead><tbody></tbody></table>");

        this.append(nodes.dataSets);

        nodes = {
            shapeButtons: $("<div>")
        };

        nodes.shapeButtons.append("<button class='wsdot-location-info-point' >Point</button>").append("<button class='wsdot-location-info-polyline'>Polyline</button>").append("<button class='wsdot-location-info-polygon'>Polygon</button>");
        this.append(nodes.shapeButtons);



    }
})(jQuery);