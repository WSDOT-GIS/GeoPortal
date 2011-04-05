/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js "/>

(function ($) {
    $.addKml = function (map, kmlUrl) {
        $.ajax(kmlUrl, {
            success: function (data, textStatus, jqXHR) {
                var kml = $(data);
                var styles = $("Style", kml);
                var placemarks = $("Placemark", kml);

                /// <summary>Converts the text from a KML coordinates tag into a Point.</summary>
                /// <param name="coordsString" type="String">The value from a Point > coordinates KML tag.</param>
                /// <param name="convertToWebMercator" type="Boolean">If set to true, the point will be converted from geographic to web mercator.</param>
                function parsePoint(coordsString, convertToWebMercator) {
                    var point = new esri.geometry.Point($.map(coordsString.split(","), function (element, index) { return Number(element); }));
                    if (convertToWebMercator === true) {
                        point = esri.geometry.geographicToWebMercator(point);
                    }
                    return point;
                }

                var graphics = placemarks.map(function (index, domElement) {
                    var point = parsePoint($("Point > coordinates", domElement).text(), true);
                    var attributes = {};
                    attributes.id = $(domElement).attr("id");
                    attributes.name = $("name", domElement).text();
                    attributes.description = $("description", domElement).text();
                    attributes.styleUrl = $("styleUrl", domElement).text();
                    var infoTemplate = null;
                    var graphic = new esri.Graphic(point, new esri.symbol.SimpleMarkerSymbol(), attributes, infoTemplate);
                    return graphic;
                });

                var layer = new esri.layers.GraphicsLayer({ id: "Cameras" });
                $(graphics).each(function (index, graphic) {
                    layer.add(graphic);
                });

                map.addLayer(layer);

                return layer;
            }
        });
    }
})(jQuery);